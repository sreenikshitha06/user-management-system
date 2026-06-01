/**
 * seed.js — Database Seeder
 * 
 * This script creates the first ADMIN user in the database.
 * 
 * Run this ONCE before starting the app:
 *   node seed.js
 * 
 * After running, you can login at http://localhost:5000/login
 * with Email: admin@admin.com and Password: admin123
 * 
 * Why do we need this?
 * Because the registration page only creates USER role accounts.
 * There is no way to create an ADMIN through the UI intentionally,
 * so we create the first admin manually via this script.
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seed = async () => {
  // Connect to database
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Check if admin already exists to avoid duplicates
  const exists = await User.findOne({ email: 'admin@admin.com' });
  if (exists) {
    console.log('⚠️  Admin already exists! No changes made.');
    process.exit(0);
  }

  // Create admin user — password will be hashed by User model
  await User.create({
    name: 'Super Admin',
    email: 'admin@admin.com',
    contact: '+91 9999999999',
    password: 'admin123',   // Will be bcrypt hashed before saving
    role: 'ADMIN',          // This is what gives access to dashboard
    enabled: true
  });

  console.log('✅ Admin user created successfully!');
  console.log('─────────────────────────────');
  console.log('Email    : admin@admin.com');
  console.log('Password : admin123');
  console.log('Role     : ADMIN');
  console.log('─────────────────────────────');
  console.log('Go to http://localhost:5000/login');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});