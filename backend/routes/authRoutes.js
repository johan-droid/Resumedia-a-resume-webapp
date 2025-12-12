const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

// Helper function to generate a token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/users/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;
  try {
    // Check if username, email or phoneNumber already exist to avoid duplicate key errors
    const existingUser = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { username },
        ...(phoneNumber ? [{ phoneNumber }] : [])
      ],
    });

    if (existingUser) {
      let duplicateField = 'username';
      if (existingUser.email === email?.toLowerCase()) {
        duplicateField = 'email';
      } else if (phoneNumber && existingUser.phoneNumber === phoneNumber) {
        duplicateField = 'phone number';
      }
      return res.status(400).json({ message: `User with this ${duplicateField} already exists` });
    }

    const user = await User.create({
      username,
      email: email?.toLowerCase(),
      phoneNumber: phoneNumber || undefined,
      password,
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid user data' });
    }

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('User registration failed:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/users/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  // 1. Change destructuring to get phoneNumber
  const { phoneNumber, password } = req.body;

  try {
    // 2. Find user by phoneNumber instead of email
    const user = await User.findOne({ phoneNumber });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email, // We can still return email if needed
        phoneNumber: user.phoneNumber,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid phone number or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/users/me
// @desc    Get current user's profile (registration fields only)
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('_id username email phoneNumber createdAt updatedAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetch current user failed:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
