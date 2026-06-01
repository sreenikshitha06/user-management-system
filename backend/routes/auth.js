const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// REGISTER
router.post('/register', upload.single('profilePic'), async (req, res) => {
  try {
    const { name, email, contact, password } = req.body;
    if (!name || !email || !contact || !password) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    const userData = { name, email, contact, password, role: 'USER', enabled: true };
    if (req.file) userData.profilePic = '/uploads/' + req.file.filename;
    const user = await User.create(userData);
    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'Registered successfully!', token, user });
  } catch (error) {
    console.error('REGISTER ERROR:', error.message);
    if (req.file) try { fs.unlinkSync(req.file.path); } catch(e) {}
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(error.errors)[0].message });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (!user.enabled) return res.status(403).json({ success: false, message: 'Account disabled. Contact admin.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    const token = generateToken(user._id);
    res.json({ success: true, message: 'Login successful!', token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET CURRENT USER
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// UPDATE OWN PROFILE
router.put('/update-profile', protect, upload.single('profilePic'), async (req, res) => {
  try {
    const { name, contact } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name.trim();
    if (contact) user.contact = contact.trim();
    if (req.file) {
      if (user.profilePic) {
        const old = path.join(__dirname, '..', user.profilePic);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      user.profilePic = '/uploads/' + req.file.filename;
    }
    await user.save();
    res.json({ success: true, message: 'Profile updated!', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;