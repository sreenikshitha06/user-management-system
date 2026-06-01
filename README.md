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
##Project Screenshots
-Registration page
<img width="911" height="1268" alt="image" src="https://github.com/user-attachments/assets/398c7dce-d5c3-43d2-ad5a-57b4ec7d8bbe" />

-login page
<img width="951" height="862" alt="image" src="https://github.com/user-attachments/assets/48ffdaa7-b6fd-461f-91d9-f23f7da95b9c" />

-user page
<img width="2524" height="1258" alt="image" src="https://github.com/user-attachments/assets/3cce189f-5226-4292-8313-63e5ecbd713d" />

-Admin dashboard
 <img width="2431" height="1199" alt="image" src="https://github.com/user-attachments/assets/683a7ede-ceec-4973-8bf8-55894f383f6b" />

