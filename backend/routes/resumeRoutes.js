const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const { protect } = require('../middleware/authMiddleware');

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

// System prompts
const SYSTEM_PROMPTS = {
  chat: (template) => `You are a professional resume writing assistant specializing in helping blue-collar workers. 
    The user is currently working with the ${template} resume template. 
    Be concise, professional, and focus on actionable advice. 
    Help with:
    - Rewriting bullet points for impact
    - Suggesting relevant skills
    - Improving action verbs
    - Formatting advice
    - ATS optimization tips`,
    
  skillExtraction: `Extract a JSON array of 5-10 relevant skills from the provided text. 
    Include both technical and soft skills. 
    Format: ["skill1", "skill2", ...]`
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
      const text = response.text();

      return {
        text,
        action: null, // Can be extended for function calling
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
        action: null,
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

  // --- 1. Skills-First Template Logic (as an example) ---
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
  
  // Add more template logic here for other templates like trade-focused
  
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
    
    // Respond with the AI's generated content
    res.json({
      response: aiResponse.text,
      action: aiResponse.action, // Future tool/action suggestions
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
