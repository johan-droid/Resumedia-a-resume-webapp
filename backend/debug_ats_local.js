require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        return { isResume: false, confidence: 0, reason: 'Unable to parse validation response', rawText: responseText };
    } catch (error) {
        console.error('Error validating resume with Gemini:', error);
        return { isResume: false, confidence: 0, reason: `Validation error: ${error.message}` };
    }
}

async function test() {
    try {
        console.log('Testing ATS validation with gemini-2.0-flash and controller logic...');

        const dummyText = "John Doe\nSoftware Engineer\nExperience: 5 years at Google.\nEducation: BS CS.";

        const result = await validateResume(dummyText);
        console.log('Validation Result:', result);

        fs.writeFileSync('debug_result.json', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Test failed:', error);
        fs.writeFileSync('debug_result.json', JSON.stringify({ error: error.message }, null, 2));
    }
}

test();
