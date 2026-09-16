'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { verifyToken, signToken } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;

// ─── Validation Rules ─────────────────────────────────────────────────────────

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.'),
  body('dob').isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD).'),
  body('city').trim().notEmpty().withMessage('City is required.'),
  body('state').trim().notEmpty().withMessage('State is required.'),
  body('country').trim().notEmpty().withMessage('Country is required.'),
];

const loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  gender: user.gender,
  dob: user.date_of_birth,
  age: user.age,
  city: user.city,
  state: user.state,
  country: user.country,
  profile_photo: user.profile_photo,
  bio: user.bio,
  role: user.role,
  verification_status: user.verification_status,
  connect_credits: user.connect_credits,
  is_online: user.is_online,
  created_at: user.created_at,
});

// ─── POST /register ───────────────────────────────────────────────────────────

router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, gender, dob, city, state, country } = req.body;

    // Check age (must be 18+)
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 18) {
      return res.status(400).json({ success: false, message: 'You must be at least 18 years old to register.' });
    }

    // Check duplicates
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or username already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users
        (username, email, password_hash, gender, date_of_birth, age, city, state, country, role, connect_credits, is_online)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'user', 0, false)
       RETURNING *`,
      [username, email, passwordHash, gender, dob, age, city, state, country]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, role: user.role, gender: user.gender, username: user.username });

    // Emit real-time event to admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('admin_update', { type: 'new_user', user: { id: user.id, username: user.username, created_at: user.created_at } });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// ─── POST /login ──────────────────────────────────────────────────────────────

router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { identifier, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM users WHERE (email = $1 OR username = $1) AND is_active = true`,
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: `Your account has been banned. Reason: ${user.ban_reason || 'Violation of terms.'}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Online status is best-effort; login should not hang if this row is locked.
    pool.query(
      `UPDATE users SET is_online = true, last_seen = NOW(), updated_at = NOW() WHERE id = $1`,
      [user.id]
    ).catch((err) => {
      console.error('[AUTH] Failed to update online status after login:', err.message);
    });

    const token = signToken({ id: user.id, role: user.role, gender: user.gender, username: user.username });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: formatUser({ ...user, is_online: true }),
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ─── POST /logout ─────────────────────────────────────────────────────────────

router.post('/logout', verifyToken, async (req, res) => {
  try {
    await pool.query(
      `UPDATE users SET is_online = false, last_seen = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('[AUTH] Logout error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
});

// ─── POST /forgot-password ────────────────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const result = await pool.query('SELECT id FROM users WHERE email = $1 AND is_active = true', [email]);

    // Always return success to prevent user enumeration
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If this email exists in our system, a reset link has been sent.',
      });
    }

    const userId = result.rows[0].id;
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    
    // In production, send email with reset link and store the token
    console.log(`[AUTH] Password reset token for user ${userId}: ${resetToken}`);

    return res.status(200).json({
      success: true,
      message: 'If this email exists in our system, a reset link has been sent.',
    });
  } catch (err) {
    console.error('[AUTH] Forgot-password error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /me ──────────────────────────────────────────────────────────────────

router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE id = $1 AND is_active = true`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = result.rows[0];
    delete user.password_hash;
    delete user.reset_token;
    delete user.reset_token_expires;

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[AUTH] /me error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
