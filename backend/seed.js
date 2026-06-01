const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const exists = await User.findOne({ email: 'admin@admin.com' });
  if (exists) {
    console.log('Admin already exists!');
    process.exit(0);
  }
  await User.create({
    name: 'Super Admin',
    email: 'admin@admin.com',
    contact: '+91 9999999999',
    password: 'admin123',
    role: 'ADMIN',
    enabled: true
  });
  console.log('✅ Admin created!');
  console.log('Email: admin@admin.com');
  console.log('Password: admin123');
  process.exit(0);
};

seed().catch(console.error);