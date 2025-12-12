const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
    parseResume,
    validateResume,
    calculateGeneralATSScore,
    calculateATSScore,
    quickATSScore,
    getImprovementSuggestions
} = require('../controllers/atsController');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../debug_ats.log');

function log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (e) {
        console.error('Failed to write to log file:', e);
    }
    console.log(message, data || '');
}

// Configure multer for file uploads (memory storage for better performance)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'));
        }
    }
});

// @route   POST /api/ats/upload
// @desc    Upload and analyze resume file (general blue-collar analysis, no job description required)
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
    try {
        log('=== ATS Upload Request ===');
        log('File received:', req.file ? req.file.originalname : 'No file');

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        log('Parsing resume...');
        // Parse resume text
        const resumeText = await parseResume(req.file);
        log('Resume parsed, length:', resumeText.length);

        log('Validating resume...');
        // Validate if it's actually a resume
        const validation = await validateResume(resumeText);
        log('Validation result:', validation);

        if (!validation.isResume || validation.confidence < 60) {
            log('Validation failed:', validation);
            return res.status(400).json({
                success: false,
                message: 'The uploaded file does not appear to be a valid resume',
                reason: validation.reason,
                confidence: validation.confidence
            });
        }

        log('Calculating ATS score...');
        // Calculate general ATS score (no job description)
        const atsAnalysis = await calculateGeneralATSScore(resumeText);
        log('ATS Analysis complete:', atsAnalysis);

        // Return analysis
        res.json({
            success: true,
            fileName: req.file.originalname,
            validation: {
                isResume: validation.isResume,
                confidence: validation.confidence
            },
            analysis: atsAnalysis
        });

    } catch (error) {
        log('=== ATS Upload Error ===', { message: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            message: 'Error processing resume',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// @route   POST /api/ats/analyze
// @desc    Full detailed analysis with job description
router.post('/analyze', protect, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Resume file is required'
            });
        }

        const { jobDescription } = req.body;
        if (!jobDescription) {
            return res.status(400).json({
                success: false,
                error: 'Job description is required'
            });
        }

        const resumeText = await parseResume(req.file);
        const validation = await validateResume(resumeText);

        if (!validation.isResume || validation.confidence < 60) {
            return res.status(400).json({
                success: false,
                message: 'The uploaded file does not appear to be a valid resume',
                reason: validation.reason
            });
        }

        const result = await calculateATSScore(resumeText, jobDescription);
        res.json(result);

    } catch (error) {
        log('ATS Analyze Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @route   POST /api/ats/quick-score
// @desc    Quick score (faster)
router.post('/quick-score', protect, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Resume file is required'
            });
        }

        const { jobDescription } = req.body;
        if (!jobDescription) {
            return res.status(400).json({
                success: false,
                error: 'Job description is required'
            });
        }

        const resumeText = await parseResume(req.file);
        const result = await quickATSScore(resumeText, jobDescription);
        res.json(result);

    } catch (error) {
        log('Quick Score Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @route   POST /api/ats/suggestions
// @desc    Get improvement suggestions
router.post('/suggestions', protect, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Resume file is required'
            });
        }

        const resumeText = await parseResume(req.file);
        const { targetScore } = req.body;
        const result = await getImprovementSuggestions(
            resumeText,
            targetScore ? parseInt(targetScore) : 80
        );
        res.json(result);

    } catch (error) {
        log('Suggestions Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @route   GET /api/ats/health
// @desc    Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Blue-Collar ATS Analyzer',
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});

module.exports = router;
