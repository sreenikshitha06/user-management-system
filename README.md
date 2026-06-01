# UserMS — User Management System

A full-stack User Management System with Admin Panel.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express.js
- Database: MongoDB
- Auth: JWT + bcrypt
- File Upload: Multer

## Setup

### 1. Install dependencies
cd backend
npm install

### 2. Create .env file inside backend/
PORT=5000
MONGO_URI=mongodb://localhost:27017/usermanagement
JWT_SECRET=mysupersecretkey2024
JWT_EXPIRES_IN=7d

### 3. Create admin account
node seed.js

### 4. Start server
npm run dev

### 5. Open browser
http://localhost:5000

## Admin Login
Email: admin@admin.com
Password: admin123

## Features
- User Registration with profile picture
- JWT Authentication
- Role-based access (ADMIN / USER)
- Admin dashboard with full CRUD
- Search, filter, paginate users
- Enable / Disable users
- Protected routes