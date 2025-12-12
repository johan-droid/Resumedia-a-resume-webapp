const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const { protect } = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Helper: Convert MongoDB Resume to Latex JSON Format
const mapResumeToLatexFormat = (mongoResume) => {
  const contact = mongoResume.contact || {};
  
  // Create Skill Groups for Blue-Collar Focus
  const skillGroups = [];
  if (mongoResume.certifications?.length) {
    skillGroups.push({ name: "Licenses & Certifications", keywords: mongoResume.certifications });
  }
  if (mongoResume.skills?.length) {
    skillGroups.push({ name: "Trade Skills & Equipment", keywords: mongoResume.skills });
  }

  // Format Work Experience
  const workFormatted = (mongoResume.workExperience || []).map(job => ({
    company: job.company || "Unknown",
    position: job.jobTitle || "Role",
    location: job.location || "",
    startDate: job.startDate || "",
    endDate: job.endDate || "Present",
    highlights: job.duties || []
  }));

  // Add Professional Title to Summary
  let summary = mongoResume.summary || mongoResume.experienceSummary || "";
  if (mongoResume.professionalTitle) {
    summary = `**${mongoResume.professionalTitle}** - ${summary}`;
  }

  return {
    selectedTemplate: 2,
    headings: { 
      work: "Work History", 
      education: "Education & Training", 
      projects: "Key Projects", 
      skills: "Qualifications" 
    },
    basics: {
      name: mongoResume.fullName || "Your Name",
      email: contact.email || "",
      phone: contact.phone || "",
      linkedin: "", 
      github: "",
      location: { address: mongoResume.location || "" },
      summary: summary
    },
    education: mongoResume.education ? [{ 
      institution: mongoResume.education, 
      area: "", 
      studyType: "", 
      startDate: "", 
      endDate: "" 
    }] : [],
    work: workFormatted,
    skills: skillGroups,
    projects: [], 
    awards: [],
    sections: ["profile", "skills", "work", "education"]
  };
}

// Gemini AI Configuration
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-pro',
  generationConfig: {
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 2048,
  },
});

// System prompts & helpers
const SYSTEM_PROMPTS = {
  chat: (template) => `You are a specialized resume assistant for BLUE-COLLAR professionals (trades, construction, driving, manufacturing).
    
    Your goal is to extract HARD SKILLS, LICENSES, and MACHINERY experience.
    
    Follow this onboarding flow (ask one at a time):
      1) Full Name and Target Job Title (e.g., "Joe Smith, HVAC Technician").
      2) **Critical:** Do you have any licenses or certifications? (Ask specifically about OSHA, CDL, welding certs, forklifts, or state licenses).
      3) **Equipment:** What specific tools, heavy machinery, or vehicles can you operate?
      4) Work History: Most recent company, role, and what you actually DID there (hands-on tasks).
      5) Education: High school, trade school, or apprenticeships.
      6) Contact Info: City/State, Phone number.

    **CRITICAL OUTPUT RULES:**
    - If the user mentions a certification (e.g., "I have my Class A"), extract it clearly.
    - If the user mentions equipment (e.g., "I drove a bobcat"), extract "Bobcat" as a skill.
    
    At the end of EVERY response, output the extracted data in this JSON format so the system can save it:
    
    SKILLS_JSON: ["OSHA 10", "Forklift Certified", "MIG Welding", "Blueprint Reading"]
    CERTS_JSON: ["CDL Class A", "NCCCO Crane Operator", "EPA 608 Universal"]
    
    Keep your tone respectful, direct, and professional. Avoid corporate buzzwords like "synergy" or "ideation". Use action words like "Operated", "Built", "Repaired", "Hauled".`,

  skillExtraction: `Extract a JSON array of 5-10 relevant skills from the provided text. 
    Include both technical and soft skills. 
    Format: ["skill1", "skill2", ...]`
};

const SKILL_JSON_REGEX = /SKILLS_JSON:\s*(\[[\s\S]*?\])/i;
const CERTS_JSON_REGEX = /CERTS_JSON:\s*(\[[\s\S]*?\])/i;
const mergeUnique = (...lists) => {
  const flattened = lists.flat().filter(Boolean);
  return [...new Set(flattened.map((skill) => skill.trim()))].filter(Boolean);
};

const geminiService = {
  chat: async (history, message, template) => {
    try {
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPTS.chat(template) }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I\'m ready to help you with your resume.' }],
          },
          ...history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
        ],
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text().trim();

      let extractedSkills = [];
      let extractedCerts = [];
      let cleanText = text;
      
      const skillsMatch = text.match(SKILL_JSON_REGEX);
      if (skillsMatch) {
        try {
          extractedSkills = JSON.parse(skillsMatch[1]);
        } catch (parseError) {
          console.error('Error parsing SKILLS_JSON payload:', parseError);
        }
        cleanText = cleanText.replace(skillsMatch[0], '').trim();
      }
      
      const certsMatch = text.match(CERTS_JSON_REGEX);
      if (certsMatch) {
        try {
          extractedCerts = JSON.parse(certsMatch[1]);
        } catch (parseError) {
          console.error('Error parsing CERTS_JSON payload:', parseError);
        }
        cleanText = cleanText.replace(certsMatch[0], '').trim();
      }

      return {
        text: cleanText,
        action: null,
        extractedSkills,
        extractedCerts,
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
        action: null,
        extractedSkills: [],
      };
    }
  },

  extractSkills: async (text) => {
    try {
      const prompt = `${SYSTEM_PROMPTS.skillExtraction}\n\nText: "${text}"`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().trim();

      // Try to parse the JSON response
      try {
        // Handle cases where response might be wrapped in markdown code blocks
        const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/) ||
          jsonText.match(/```\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : jsonText;
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Error parsing skills JSON:', parseError);
        // Fallback to a basic extraction if JSON parsing fails
        return text
          .split(/[\n,;]+/)
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
      }
    } catch (error) {
      console.error('Gemini Skill Extraction Error:', error);
      return [];
    }
  },
};

// ----------------------------------------------------
// Typst Markup Generation Engine
// ----------------------------------------------------
const typstEngine = (resume) => {
  // A simple way to get a field, handling null/undefined
  const getField = (field, fallback = '') => resume[field] || fallback;

  // Header and Contact Info
  let typstCode = `#set page(
  margin: (x: 1in, y: 1in)
)
#set text(
  font: "Inter",
  size: 11pt,
  fill: rgb("#f5f5f5")
)
#set heading(
  level: 1, 
  fill: rgb("#6366f1")
)

#align(center, [
  #text(30pt, weight: "bold", "${getField('fullName')}") \\
  #text(14pt, weight: "medium", "${getField('professionalTitle')}")
])

#align(center)[
  ${getField('contact')?.phone || ''} #h(1em) | #h(1em) 
  ${getField('contact')?.email || ''} 
]

#line(length: 100%, stroke: 1.5pt + rgb("#ec4899"))
\n`;

  // --- 1. Skills-First Template Logic ---
  if (resume.template === 'skills-first') {
    typstCode += `
#heading[Skills & Certifications]
${(resume.skills || []).map(s => `#box(height: 10pt, width: 2pt, fill: rgb("#6366f1")) #h(0.5em) ${s}`).join('\\ \n')}
\n#v(0.5em)

#heading[Summary]
${getField('summary', 'A highly skilled and dedicated professional.')}
\n#v(0.5em)

#heading[Work Experience]
#list(
  ${(resume.workExperience || [])
        .map(job =>
          `[#text(weight: "bold", "${job.jobTitle}") #h(1fr) #text(size: 10pt, "${job.startDate || ''} - ${job.endDate || 'Present'}")] \\
       [#text(size: 10pt, "${job.company}, ${job.location || ''}")] \\
       #v(0.2em) \\
       #list(
         ${(job.duties || []).map(duty => `[${duty}]`).join('\n')}
       )`
        )
        .join('\n')}
)
`;
  }
  // --- 2. Chronological Template Logic ---
  else if (resume.template === 'chronological') {
    typstCode += `
#heading[Summary]
${getField('summary', 'A highly skilled and dedicated professional.')}
\n#v(0.5em)

#heading[Work Experience]
#list(
  ${(resume.workExperience || [])
        .map(job =>
          `[#text(weight: "bold", "${job.jobTitle}") #h(1fr) #text(size: 10pt, "${job.startDate || ''} - ${job.endDate || 'Present'}")] \\
       [#text(size: 10pt, "${job.company}, ${job.location || ''}")] \\
       #v(0.2em) \\
       #list(
         ${(job.duties || []).map(duty => `[${duty}]`).join('\n')}
       )`
        )
        .join('\n')}
)
\n#v(0.5em)

#heading[Skills & Certifications]
${(resume.skills || []).map(s => `#box(height: 10pt, width: 2pt, fill: rgb("#10b981")) #h(0.5em) ${s}`).join('\\ \n')}
`;
  }

  return typstCode;
};
// ----------------------------------------------------

// @route   POST /api/resumes
// @desc    Create a new resume (template-only flow supported)
router.post('/', protect, async (req, res) => {
  try {
    const {
      fullName,
      professionalTitle,
      contact = {},
      summary = '',
      workExperience = [],
      skills = [],
      certifications = [],
      template = 'skills-first',
    } = req.body;

    const user = req.user;
    const fallbackName = user?.username || user?.name || 'Untitled Resume';
    const fallbackTitle = 'Professional';

    const newResume = new Resume({
      user: user.id,
      fullName: fullName || fallbackName,
      professionalTitle: professionalTitle || fallbackTitle,
      contact,
      summary,
      workExperience,
      skills,
      certifications,
      template,
    });

    const savedResume = await newResume.save();
    res.status(201).json(savedResume);
  } catch (error) {
    console.error('Error creating resume:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    res.status(500).json({ message: 'Server Error: Failed to create resume' });
  }
});

// @route   GET /api/resumes/myresumes
// @desc    Get all resumes for the logged-in user
router.get('/myresumes', protect, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id });
    res.json(resumes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/resumes/:id
// @desc    Delete a resume
router.delete('/:id', protect, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id, // Ensure user can only delete their own resumes
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found or unauthorized' });
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Server Error: Failed to delete resume' });
  }
});

// @route   PUT /api/resumes/:id
// @desc    Update a resume with data (used by AI chat to populate bio-data)
router.put('/:id', protect, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const updates = req.body;

    // Find the resume and ensure it belongs to the logged-in user
    // We use $set to ensure nested fields like 'contact' are updated correctly.
    const updatedResume = await Resume.findOneAndUpdate(
      { _id: resumeId, user: req.user.id },
      { $set: updates },
      { new: true, runValidators: true } // Return the updated doc and run schema validators
    );

    if (!updatedResume) {
      return res.status(404).json({ message: 'Resume not found or user unauthorized' });
    }

    res.json(updatedResume);

  } catch (error) {
    console.error('Error updating resume:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error during update',
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    res.status(500).json({ message: 'Server Error: Failed to update resume' });
  }
});

// @route   GET /api/resumes/:id/typst
// @desc    Get the Typst code for a specific resume
router.get('/:id/typst', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Pass the resume data to the Typst engine
    const typstCode = typstEngine(resume);

    // Respond with the Typst code as plain text
    res.set('Content-Type', 'text/plain').send(typstCode);
  } catch (error) {
    console.error('Error fetching Typst code:', error);
    res.status(500).json({ message: 'Server Error: Failed to generate Typst code' });
  }
});

// @route   GET /api/resumes/:id/pdf
// @desc    Generate PDF using Python (Blue-Collar Resume)
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // 1. Setup Paths
    const pdfServiceDir = path.join(__dirname, '../pdf_service');
    const inputJsonPath = path.join(pdfServiceDir, `temp_${resume._id}.json`);
    const outputPdfName = `resume_${resume._id}.pdf`;
    const outputPdfPath = path.join(pdfServiceDir, outputPdfName);

    // 2. Write Data to JSON
    const latexJson = mapResumeToLatexFormat(resume);
    fs.writeFileSync(inputJsonPath, JSON.stringify(latexJson, null, 2));

    console.log("Spawn Python for:", resume._id);

    // 3. Run Python Script
    const pythonProcess = spawn('python', [
      'render_resume.py',
      '--resume-json', inputJsonPath,
      '--output-pdf', outputPdfPath
    ], { cwd: pdfServiceDir });

    // 4. Capture Logs
    pythonProcess.stdout.on('data', (data) => console.log(`Python Out: ${data}`));
    pythonProcess.stderr.on('data', (data) => console.error(`Python Err: ${data}`));

    pythonProcess.on('close', (code) => {
      // Cleanup Input JSON
      try { fs.unlinkSync(inputJsonPath); } catch (e) {}

      if (code !== 0) {
        console.error(`Python exited with code ${code}`);
        return res.status(500).json({ 
          message: 'PDF generation failed. This usually means "tectonic" is not installed or the text contains invalid characters.' 
        });
      }

      if (fs.existsSync(outputPdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        // If query param ?download=true is present, force download, else view inline
        const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
        res.setHeader('Content-Disposition', `${disposition}; filename="${(resume.fullName || 'resume').replace(/\s+/g, '_')}.pdf"`);
        
        const fileStream = fs.createReadStream(outputPdfPath);
        fileStream.pipe(res);

        // Delete PDF after sending
        fileStream.on('close', () => {
           try { fs.unlinkSync(outputPdfPath); } catch (e) {}
        });
      } else {
        res.status(500).json({ message: 'Output PDF not found.' });
      }
    });

  } catch (error) {
    console.error('PDF Route Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// ====================================================
// AI RESUME ASSISTANT ROUTES
// ====================================================

// @route   POST /api/resumes/:id/ai/chat
// @desc    Handle conversational requests using the Gemini API
router.post('/:id/ai/chat', protect, async (req, res) => {
  try {
    const { message, history } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Call the Gemini chat service
    const aiResponse = await geminiService.chat(history || [], message, resume.template);
    
    let updated = false;
    
    if (aiResponse.extractedSkills?.length) {
      const updatedSkills = mergeUnique(resume.skills || [], aiResponse.extractedSkills);
      if (updatedSkills.length !== (resume.skills || []).length) {
        resume.skills = updatedSkills;
        updated = true;
      }
    }
    
    if (aiResponse.extractedCerts?.length) {
      const updatedCerts = mergeUnique(resume.certifications || [], aiResponse.extractedCerts);
      if (updatedCerts.length !== (resume.certifications || []).length) {
        resume.certifications = updatedCerts;
        updated = true;
      }
    }
    
    if (updated) {
      await resume.save();
    }

    // Respond with the AI's generated content
    res.json({
      response: aiResponse.text,
      action: aiResponse.action,
      skills: resume.skills || [],
      certifications: resume.certifications || [],
    });

  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    res.status(500).json({ message: 'Server Error in AI chat' });
  }
});

// @route   POST /api/resumes/:id/ai/skill-extract
// @desc    Extract skills from user-provided text using the Gemini API
router.post('/:id/ai/skill-extract', protect, async (req, res) => {
  try {
    const { textToAnalyze } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (!textToAnalyze || textToAnalyze.length < 10) {
      return res.status(400).json({ message: 'Please provide enough text to analyze.' });
    }

    // Call the Gemini skill extraction service
    const extractedSkills = await geminiService.extractSkills(textToAnalyze);

    res.json({
      skills: extractedSkills,
      template: resume.template
    });

  } catch (error) {
    console.error('Error in AI skill extraction endpoint:', error);
    res.status(500).json({ message: 'Server Error in skill extraction' });
  }
});

module.exports = router;
