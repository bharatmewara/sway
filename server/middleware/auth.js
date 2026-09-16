'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sway_secret_key_change_in_production';

/**
 * Middleware: Verify JWT token from Authorization: Bearer <token>
 * Attaches req.user = { id, role, gender, username }
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. Token missing.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      gender: decoded.gender,
      username: decoded.username,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
};

/**
 * Middleware: Verify JWT AND require role === 'admin'
 */
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  });
};

/**
 * Utility: Sign a JWT token
 */
const signToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = { verifyToken, verifyAdmin, signToken };
