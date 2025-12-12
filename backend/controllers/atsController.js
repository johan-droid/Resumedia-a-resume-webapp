const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Parse resume file
async function parseResume(file) {
  const fileBuffer = file.buffer;
  const fileType = file.mimetype;

  let text = '';

  if (fileType === 'application/pdf') {
    const data = await pdfParse(fileBuffer);
    text = data.text;
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    text = result.value;
  } else {
    throw new Error('Unsupported file type');
  }

  return text;
}

// Validate if content is a resume
async function validateResume(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a resume validation expert. Analyze the following text and determine if it is a professional resume or CV.

A valid resume should contain:
- Personal/contact information (name, phone, email, or address)
- Work experience OR education OR skills section
- Professional content related to employment

Respond with a JSON object in this exact format:
{
  "isResume": true/false,
  "confidence": 0-100,
  "reason": "brief explanation"
}

Text to analyze:
${text.substring(0, 3000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const validation = JSON.parse(jsonMatch[0]);
      return validation;
    }

    return { isResume: false, confidence: 0, reason: 'Unable to parse validation response' };
  } catch (error) {
    console.error('Error validating resume with Gemini:', error);
    return { isResume: false, confidence: 0, reason: `Validation error: ${error.message}` };
  }
}

// Main ATS scoring function - General blue-collar analysis (no job description required)
async function calculateGeneralATSScore(resumeText) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer specializing in BLUE-COLLAR job positions. 
Analyze the following resume and provide a detailed scoring breakdown for general blue-collar job readiness.

RESUME:
${resumeText}

IMPORTANT: This is for BLUE-COLLAR positions (construction, manufacturing, warehouse, automotive, electrical, plumbing, HVAC, transportation, etc.)

Analyze and score the resume based on these criteria (out of 100 total):

1. CERTIFICATIONS & LICENSES (35 points max):
   - Look for: OSHA certifications, CDL licenses, forklift certification, trade licenses, welding certifications, EPA, ASE, NCCCO, TWIC, Hazmat, journeyman/master licenses, etc.
   - Score based on how many certifications are present

2. EQUIPMENT & TOOL SKILLS (25 points max):
   - Look for: Specific equipment operation (forklift, heavy machinery, power tools, CNC, welding equipment, etc.)
   - Hands-on technical skills

3. SAFETY TRAINING & RECORD (20 points max):
   - Look for: Safety training, OSHA compliance, PPE usage, incident-free record, safety procedures, lockout/tagout, confined space, fall protection
   - Safety consciousness and training

4. RELEVANT EXPERIENCE (10 points max):
   - Years of experience in trades or similar hands-on roles
   - Hands-on work experience over theoretical knowledge

5. INDUSTRY-SPECIFIC KEYWORDS (10 points max):
   - Trade-specific terminology and skills
   - Understanding of industry standards and practices

Provide your response ONLY in this exact JSON format (no additional text):
{
  "totalScore": <number 0-100>,
  "rating": "<Excellent/Good/Fair/Needs Improvement>",
  "feedback": "<brief overall assessment>",
  "breakdown": {
    "certifications": {
      "score": <number>,
      "max": 35,
      "found": ["<list of certifications found>"],
      "details": "<brief explanation>"
    },
    "equipment": {
      "score": <number>,
      "max": 25,
      "found": ["<list of equipment/tools found>"],
      "details": "<brief explanation>"
    },
    "safety": {
      "score": <number>,
      "max": 20,
      "mentions": ["<list of safety-related items found>"],
      "details": "<brief explanation>"
    },
    "experience": {
      "score": <number>,
      "max": 10,
      "years": <number or 0>,
      "details": "<brief explanation>"
    },
    "industryKeywords": {
      "score": <number>,
      "max": 10,
      "matched": ["<list of matched keywords>"],
      "details": "<brief explanation>"
    }
  },
  "suggestions": ["<actionable improvement suggestion 1>", "<suggestion 2>", "..."],
  "strengths": ["<strength 1>", "<strength 2>", "..."],
  "contactInfo": {
    "hasEmail": <boolean>,
    "hasPhone": <boolean>,
    "isComplete": <boolean>
  }
}

Be strict but fair in scoring. Focus on actual qualifications over resume formatting.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    let jsonText = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const analysisResult = JSON.parse(jsonText);

    return {
      success: true,
      ...analysisResult,
      analyzedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('ATS Analysis Error:', error);
    throw error;
  }
}

// ATS scoring with job description matching
async function calculateATSScore(resumeText, jobDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer specializing in BLUE-COLLAR job positions. 
Analyze the following resume against the job description and provide a detailed scoring breakdown.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

IMPORTANT: This is for BLUE-COLLAR positions (construction, manufacturing, warehouse, automotive, electrical, plumbing, HVAC, transportation, etc.)

Analyze and score the resume based on these criteria (out of 100 total):

1. CERTIFICATIONS & LICENSES (35 points max):
   - Look for: OSHA certifications, CDL licenses, forklift certification, trade licenses, welding certifications, EPA, ASE, NCCCO, TWIC, Hazmat, journeyman/master licenses, etc.
   - Score based on how many required certifications are present

2. EQUIPMENT & TOOL SKILLS (25 points max):
   - Look for: Specific equipment operation (forklift, heavy machinery, power tools, CNC, welding equipment, etc.)
   - Hands-on technical skills relevant to the job

3. SAFETY TRAINING & RECORD (20 points max):
   - Look for: Safety training, OSHA compliance, PPE usage, incident-free record, safety procedures, lockout/tagout, confined space, fall protection
   - Safety consciousness and training

4. RELEVANT EXPERIENCE (10 points max):
   - Years of experience in the specific trade or similar roles
   - Hands-on work experience over theoretical knowledge

5. INDUSTRY-SPECIFIC KEYWORDS (10 points max):
   - Match of trade-specific terminology and skills from job description
   - Understanding of industry standards and practices

Provide your response ONLY in this exact JSON format (no additional text):
{
  "totalScore": <number 0-100>,
  "rating": "<Excellent/Good/Fair/Needs Improvement>",
  "feedback": "<brief overall assessment>",
  "breakdown": {
    "certifications": {
      "score": <number>,
      "max": 35,
      "found": ["<list of certifications found>"],
      "missing": ["<list of required certifications missing>"],
      "details": "<brief explanation>"
    },
    "equipment": {
      "score": <number>,
      "max": 25,
      "found": ["<list of equipment/tools found>"],
      "missing": ["<list of required equipment skills missing>"],
      "details": "<brief explanation>"
    },
    "safety": {
      "score": <number>,
      "max": 20,
      "mentions": ["<list of safety-related items found>"],
      "details": "<brief explanation>"
    },
    "experience": {
      "score": <number>,
      "max": 10,
      "years": <number or 0>,
      "details": "<brief explanation>"
    },
    "industryKeywords": {
      "score": <number>,
      "max": 10,
      "matched": ["<list of matched keywords>"],
      "details": "<brief explanation>"
    }
  },
  "suggestions": ["<actionable improvement suggestion 1>", "<suggestion 2>", "..."],
  "strengths": ["<strength 1>", "<strength 2>", "..."],
  "contactInfo": {
    "hasEmail": <boolean>,
    "hasPhone": <boolean>,
    "isComplete": <boolean>
  }
}

Be strict but fair in scoring. Focus on actual qualifications over resume formatting.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    let jsonText = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const analysisResult = JSON.parse(jsonText);

    return {
      success: true,
      ...analysisResult,
      analyzedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('ATS Analysis Error:', error);
    throw error;
  }
}

// Quick score function (faster, less detailed)
async function quickATSScore(resumeText, jobDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
Quickly analyze this blue-collar resume against the job description and give an ATS score (0-100).

RESUME: ${resumeText.substring(0, 2000)}
JOB: ${jobDescription.substring(0, 1000)}

Respond with ONLY a JSON object:
{
  "score": <number 0-100>,
  "rating": "<Excellent/Good/Fair/Poor>",
  "topMissingItems": ["<item1>", "<item2>", "<item3>"]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const quickResult = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return {
      success: true,
      ...quickResult,
      isQuickScan: true
    };

  } catch (error) {
    throw error;
  }
}

// Get improvement suggestions
async function getImprovementSuggestions(resumeText, targetScore = 80) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are a blue-collar career coach. Review this resume and provide specific, actionable suggestions to improve it to an ATS score of ${targetScore}+.

RESUME:
${resumeText}

Focus on:
1. Missing certifications that are commonly required
2. Equipment/tools experience that should be highlighted
3. Safety training to add
4. Better ways to describe hands-on experience
5. Industry keywords to include

Provide response as JSON:
{
  "currentEstimatedScore": <number>,
  "suggestedCertifications": ["<cert1>", "<cert2>"],
  "skillsToHighlight": ["<skill1>", "<skill2>"],
  "safetyImprovements": ["<improvement1>", "<improvement2>"],
  "keywordSuggestions": ["<keyword1>", "<keyword2>"],
  "formattingTips": ["<tip1>", "<tip2>"]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const suggestions = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return {
      success: true,
      ...suggestions
    };

  } catch (error) {
    throw error;
  }
}

module.exports = {
  parseResume,
  validateResume,
  calculateGeneralATSScore,
  calculateATSScore,
  quickATSScore,
  getImprovementSuggestions
};
