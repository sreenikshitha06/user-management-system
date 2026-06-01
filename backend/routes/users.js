/**
 * routes/users.js — Admin User Management Routes
 * 
 * All routes in this file are ADMIN only.
 * Every request must pass through:
 *  1. protect    — must be logged in
 *  2. adminOnly  — must have ADMIN role
 * 
 * Routes:
 *  GET    /api/users              — Get all users (search, filter, paginate)
 *  GET    /api/users/stats        — Get user counts for dashboard cards
 *  PUT    /api/users/:id          — Update any user's details
 *  PATCH  /api/users/:id/toggle   — Enable or disable a user
 *  DELETE /api/users/:id          — Permanently delete a user
 */

const express = require('express');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Apply protect + adminOnly to ALL routes in this file
router.use(protect, adminOnly);

// ─────────────────────────────────────────────────────────────
// @route   GET /api/users
// @desc    Get all users with search, filter, and pagination
// @access  Admin only
// @query   search, role, enabled, page, limit
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, role, enabled, page = 1, limit = 8 } = req.query;

    // Build dynamic query object based on filters
    const query = {};

    // Search across name, email, and contact fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },    // case-insensitive
        { email: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role (USER or ADMIN)
    if (role && role !== 'ALL') query.role = role;

    // Filter by account status (active or disabled)
    if (enabled !== undefined && enabled !== 'ALL') {
      query.enabled = enabled === 'true'; // Convert string to boolean
    }

    // Calculate how many documents to skip for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get total count for pagination info
    const total = await User.countDocuments(query);

    // Fetch users with sorting, pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })  // Newest first
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   GET /api/users/stats
// @desc    Get user statistics for dashboard stat cards
// @access  Admin only
// ─────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    // Run all count queries in parallel for better performance
    const [total, admins, users, active, disabled] = await Promise.all([
      User.countDocuments(),                    // All users
      User.countDocuments({ role: 'ADMIN' }),   // Admin count
      User.countDocuments({ role: 'USER' }),    // User count
      User.countDocuments({ enabled: true }),   // Active accounts
      User.countDocuments({ enabled: false })   // Disabled accounts
    ]);

    res.json({ success: true, stats: { total, admins, users, active, disabled } });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   PUT /api/users/:id
// @desc    Update any user's information (admin power)
// @access  Admin only
// @params  id — user's MongoDB _id
// ─────────────────────────────────────────────────────────────
router.put('/:id', upload.single('profilePic'), async (req, res) => {
  try {
    const { name, email, contact, role, enabled } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Update each field only if provided in request
    if (name) user.name = name.trim();
    if (contact) user.contact = contact.trim();
    if (role) user.role = role;
    if (enabled !== undefined) user.enabled = enabled === 'true' || enabled === true;

    // Handle email update — check uniqueness before changing
    if (email && email !== user.email) {
      const exists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id }  // Exclude current user from check
      });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
      user.email = email.toLowerCase();
    }

    // Handle new profile picture
    if (req.file) {
      // Delete old picture from disk
      if (user.profilePic) {
        const old = path.join(__dirname, '..', user.profilePic);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      user.profilePic = '/uploads/' + req.file.filename;
    }

    await user.save();
    res.json({ success: true, message: 'User updated!', user });

  } catch (error) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch(e) {}
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   PATCH /api/users/:id/toggle
// @desc    Toggle user account between enabled and disabled
// @access  Admin only
// ─────────────────────────────────────────────────────────────
router.patch('/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent admin from disabling their own account (would lock themselves out)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot disable your own account.'
      });
    }

    // Flip the enabled status
    user.enabled = !user.enabled;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.enabled ? 'enabled' : 'disabled'} successfully.`,
      user
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   DELETE /api/users/:id
// @desc    Permanently delete a user and their profile picture
// @access  Admin only
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent admin from deleting their own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    // Delete profile picture file from disk to free up storage
    if (user.profilePic) {
      const picPath = path.join(__dirname, '..', user.profilePic);
      if (fs.existsSync(picPath)) fs.unlinkSync(picPath);
    }

    // Remove user document from MongoDB
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User deleted successfully.' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;