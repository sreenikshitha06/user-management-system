/**
 * middleware/auth.js — Authentication & Authorization Middleware
 * 
 * Middleware = functions that run BETWEEN receiving a request and sending response.
 * 
 * This file has two middleware functions:
 *  1. protect    — verifies the user is logged in (has valid JWT token)
 *  2. adminOnly  — verifies the logged-in user is an ADMIN
 * 
 * Usage in routes:
 *  router.get('/secret', protect, handler)              // logged in users only
 *  router.get('/admin', protect, adminOnly, handler)    // admins only
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — checks if user is authenticated
 * 
 * How it works:
 *  1. Reads the Authorization header from the request
 *  2. Extracts the JWT token (format: "Bearer <token>")
 *  3. Verifies the token using JWT_SECRET
 *  4. Finds the user in database using ID from token
 *  5. Checks if user account is enabled
 *  6. Attaches user object to req.user for next middleware to use
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if Authorization header exists and starts with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token part after "Bearer "
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found, block the request
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.'
      });
    }

    // Verify token signature and expiry using our secret key
    // This will throw an error if token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in database using ID stored in token
    const user = await User.findById(decoded.id);

    // Handle case where user was deleted after token was issued
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Block disabled accounts even if they have valid token
    if (!user.enabled) {
      return res.status(403).json({
        success: false,
        message: 'Account disabled. Contact admin.'
      });
    }

    // Attach user to request — available in all next middleware/routes
    req.user = user;
    next(); // Move to next middleware or route handler

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.'
    });
  }
};

/**
 * adminOnly — checks if logged-in user is an ADMIN
 * 
 * MUST be used AFTER protect middleware, because it needs req.user
 * which is set by protect.
 * 
 * If user role is not ADMIN, request is blocked with 403 Forbidden.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next(); // User is admin, allow request
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admins only.'
    });
  }
};

module.exports = { protect, adminOnly };