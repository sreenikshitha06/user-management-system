/**
 * routes/auth.js — Authentication Routes
 * 
 * Handles all user authentication:
 *  POST /api/auth/register      — Create new account
 *  POST /api/auth/login         — Login and get JWT token
 *  GET  /api/auth/me            — Get current logged-in user
 *  PUT  /api/auth/update-profile — Update own profile
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const router = express.Router();

/**
 * generateToken — creates a JWT token for a user
 * 
 * JWT (JSON Web Token) is a signed string that proves identity.
 * It contains the user's ID and expires after JWT_EXPIRES_IN (7 days).
 * The frontend stores this token and sends it with every API request.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new user account
// @access  Public (anyone can register)
// @body    name, email, contact, password, profilePic (file)
// ─────────────────────────────────────────────────────────────
router.post('/register', upload.single('profilePic'), async (req, res) => {
  try {
    const { name, email, contact, password } = req.body;

    // Validate all required fields are present
    if (!name || !email || !contact || !password) {
      // Delete uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    // Check if email is already registered
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    // Build user data object
    const userData = {
      name,
      email,
      contact,
      password,    // Will be hashed by User model pre-save hook
      role: 'USER', // All registrations default to USER role
      enabled: true
    };

    // If a profile picture was uploaded, save its path
    if (req.file) {
      userData.profilePic = '/uploads/' + req.file.filename;
    }

    // Save user to database
    const user = await User.create(userData);

    // Generate JWT token for immediate login after registration
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registered successfully!',
      token,
      user
    });

  } catch (error) {
    // Clean up uploaded file if any error occurred
    if (req.file) try { fs.unlinkSync(req.file.path); } catch(e) {}

    // Handle Mongoose validation errors (e.g. minlength)
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message
      });
    }

    console.error('REGISTER ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login with email and password, returns JWT token
// @access  Public
// @body    email, password
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required.'
      });
    }

    // Find user by email — must use .select('+password') because
    // password has select:false in the model (hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Use same error message for wrong email OR wrong password
    // This prevents attackers from knowing which one is wrong
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Block disabled accounts from logging in
    if (!user.enabled) {
      return res.status(403).json({
        success: false,
        message: 'Account disabled. Contact admin.'
      });
    }

    // Compare entered password with stored hash using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate token and send response
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user  // Password is removed by toJSON() method in model
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get currently logged-in user's profile
// @access  Private (requires valid JWT token)
// ─────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  // req.user is set by the protect middleware
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// ─────────────────────────────────────────────────────────────
// @route   PUT /api/auth/update-profile
// @desc    Update own name, contact, profile picture
// @access  Private (requires valid JWT token)
// ─────────────────────────────────────────────────────────────
router.put('/update-profile', protect, upload.single('profilePic'), async (req, res) => {
  try {
    const { name, contact } = req.body;
    const user = await User.findById(req.user._id);

    // Update only provided fields
    if (name) user.name = name.trim();
    if (contact) user.contact = contact.trim();

    // Handle new profile picture upload
    if (req.file) {
      // Delete old profile picture from disk to save storage space
      if (user.profilePic) {
        const oldPath = path.join(__dirname, '..', user.profilePic);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      user.profilePic = '/uploads/' + req.file.filename;
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated!', user });

  } catch (error) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch(e) {}
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;