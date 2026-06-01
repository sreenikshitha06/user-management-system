/**
 * models/User.js — User Database Model
 * 
 * This file defines the structure (schema) of a User in MongoDB.
 * Every user document saved in the database will follow this structure.
 * 
 * It also handles:
 *  - Password encryption before saving
 *  - Password comparison for login
 *  - Hiding password from API responses
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema — defines fields and validation rules
 */
const userSchema = new mongoose.Schema({

  // User's full name — required, extra spaces trimmed
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },

  // Email — must be unique across all users, stored in lowercase
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,      // No two users can have same email
    lowercase: true,   // Always stored as lowercase
    trim: true
  },

  // Phone number
  contact: {
    type: String,
    required: [true, 'Contact is required'],
    trim: true
  },

  /**
   * Password — stored as bcrypt hash, never plain text
   * select: false means password is NOT returned in queries by default
   * You must explicitly request it with .select('+password')
   */
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },

  // Path to uploaded profile picture file
  // Example: /uploads/profile-1234567890.jpg
  profilePic: {
    type: String,
    default: null  // null means no picture uploaded
  },

  /**
   * Role — controls what user can access
   * USER  → can only see their own profile
   * ADMIN → can access dashboard and manage all users
   */
  role: {
    type: String,
    enum: ['USER', 'ADMIN'], // Only these two values allowed
    default: 'USER'          // Every new registration gets USER role
  },

  /**
   * Enabled — controls if account is active
   * true  → user can login normally
   * false → user gets blocked even with correct password
   */
  enabled: {
    type: Boolean,
    default: true
  }

}, {
  /**
   * timestamps: true automatically adds:
   *  - createdAt: when user registered
   *  - updatedAt: when user was last modified
   */
  timestamps: true
});

/**
 * PRE-SAVE HOOK — runs automatically before every .save()
 * 
 * Encrypts the password using bcrypt before storing in database.
 * Only runs if the password field was actually changed,
 * so updating name/contact won't re-hash the password.
 * 
 * bcrypt salt rounds = 12 (higher = more secure but slower)
 */
userSchema.pre('save', async function() {
  // Skip hashing if password wasn't changed
  if (!this.isModified('password')) return;
  // Hash the password with 12 salt rounds
  this.password = await bcrypt.hash(this.password, 12);
});

/**
 * comparePassword — instance method to check login password
 * 
 * Usage: const isMatch = await user.comparePassword(enteredPassword)
 * Returns true if password matches, false if not.
 * 
 * We use bcrypt.compare because the stored password is hashed.
 * You cannot "unhash" — you can only compare.
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * toJSON — removes password from any JSON output
 * 
 * This runs automatically whenever user data is sent as API response.
 * Ensures password hash is NEVER sent to the frontend.
 */
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);