const express = require('express');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.use(protect, adminOnly);

// GET ALL USERS (search, filter, paginate)
router.get('/', async (req, res) => {
  try {
    const { search, role, enabled, page = 1, limit = 10 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'ALL') query.role = role;
    if (enabled !== undefined && enabled !== 'ALL') query.enabled = enabled === 'true';
    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET STATS
router.get('/stats', async (req, res) => {
  try {
    const total = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'ADMIN' });
    const users = await User.countDocuments({ role: 'USER' });
    const active = await User.countDocuments({ enabled: true });
    const disabled = await User.countDocuments({ enabled: false });
    res.json({ success: true, stats: { total, admins, users, active, disabled } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// UPDATE USER
router.put('/:id', upload.single('profilePic'), async (req, res) => {
  try {
    const { name, email, contact, role, enabled } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (name) user.name = name.trim();
    if (contact) user.contact = contact.trim();
    if (role) user.role = role;
    if (enabled !== undefined) user.enabled = enabled === 'true' || enabled === true;
    if (email && email !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ success: false, message: 'Email already in use.' });
      user.email = email.toLowerCase();
    }
    if (req.file) {
      if (user.profilePic) {
        const old = path.join(__dirname, '..', user.profilePic);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      user.profilePic = '/uploads/' + req.file.filename;
    }
    await user.save();
    res.json({ success: true, message: 'User updated!', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// TOGGLE ENABLE/DISABLE
router.patch('/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot disable yourself.' });
    user.enabled = !user.enabled;
    await user.save();
    res.json({ success: true, message: `User ${user.enabled ? 'enabled' : 'disabled'}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE USER
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot delete yourself.' });
    if (user.profilePic) {
      const picPath = path.join(__dirname, '..', user.profilePic);
      if (fs.existsSync(picPath)) fs.unlinkSync(picPath);
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;