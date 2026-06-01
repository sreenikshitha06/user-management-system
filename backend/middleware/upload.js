/**
 * middleware/upload.js — File Upload Handler
 * 
 * Configures Multer for handling profile picture uploads.
 * 
 * Multer is a middleware that handles multipart/form-data
 * which is the format used when uploading files.
 * 
 * This file configures:
 *  - Where to save uploaded files (uploads/ folder)
 *  - What to name each file (unique timestamp-based name)
 *  - Which file types are allowed (images only)
 *  - Maximum file size (5MB)
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── ENSURE UPLOADS FOLDER EXISTS ────────────────────────────
// Create the uploads directory if it doesn't exist yet
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── STORAGE CONFIGURATION ────────────────────────────────────
const storage = multer.diskStorage({

  /**
   * destination — where to save uploaded files
   * All profile pictures go into the uploads/ folder
   */
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  /**
   * filename — what to name the uploaded file
   * 
   * We create a unique name to avoid overwriting existing files.
   * Format: profile-<timestamp>-<random>.jpg
   * Example: profile-1703123456789-123456789.jpg
   */
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// ─── FILE TYPE FILTER ─────────────────────────────────────────
/**
 * fileFilter — only allow image file types
 * Rejects any file that is not jpeg, jpg, png, gif, or webp
 */
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowed.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);  // Accept file
  } else {
    cb(new Error('Images only! Allowed: jpeg, jpg, png, gif, webp'));
  }
};

/**
 * Export configured multer instance
 * limits.fileSize = 5MB maximum file size
 */
module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB in bytes
  fileFilter
});