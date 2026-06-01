/**
 * server.js — Main Entry Point
 * 
 * This is the first file that runs when you start the server.
 * It does the following:
 *  1. Creates the Express app
 *  2. Connects to MongoDB database
 *  3. Registers all middleware (cors, json parser, static files)
 *  4. Registers all API routes
 *  5. Serves frontend HTML pages
 *  6. Starts listening on the port defined in .env
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

// Import route files
const authRoutes = require('./routes/auth');   // Register, Login, Profile
const userRoutes = require('./routes/users');  // Admin user management

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────
// Allow requests from any origin (needed for frontend-backend communication)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve uploaded profile pictures as static files
// Example: http://localhost:5000/uploads/profile-123.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend files (HTML, CSS, JS) as static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API ROUTES ───────────────────────────────────────────────
// All auth endpoints: /api/auth/register, /api/auth/login, etc.
app.use('/api/auth', authRoutes);

// All admin user endpoints: /api/users, /api/users/:id, etc.
app.use('/api/users', userRoutes);

// ─── FRONTEND PAGE ROUTES ─────────────────────────────────────
// These serve the HTML files when user visits a URL in browser
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/profile.html')));

// ─── DATABASE CONNECTION ──────────────────────────────────────
// Connect to MongoDB first, then start the server
// If MongoDB connection fails, the server will not start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server: http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB Error:', err.message);
    process.exit(1); // Stop the process if DB connection fails
  });