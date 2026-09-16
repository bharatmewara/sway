'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// GET /api/security/sessions
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, device_name, device_type, os, browser, ip_address, 
             location_country, location_city, is_current, last_active, created_at
      FROM user_sessions WHERE user_id = $1 AND expires_at > NOW()
      ORDER BY is_current DESC, last_active DESC
    `, [req.user.id]);
    res.json({ sessions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/security/sessions/:id
router.delete('/sessions/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_sessions WHERE id = $1 AND user_id = $2 AND is_current = false',
      [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/security/sessions - Logout all other sessions
router.delete('/sessions', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1 AND is_current = false', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/security/login-history
router.get('/login-history', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM login_alerts WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 20
    `, [req.user.id]);
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/security/2fa/enable
router.post('/2fa/enable', verifyToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT username, email FROM users WHERE id=$1', [req.user.id]);
    const u = user.rows[0];

    const secret = speakeasy.generateSecret({
      name: `SWAY (${u.email})`,
      issuer: 'SWAY Dating',
    });

    // Store secret temporarily (in real app, store in temp table until verified)
    await pool.query('UPDATE users SET two_fa_secret = $1 WHERE id = $2', [secret.base32, req.user.id]);

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qr_code: qrCode });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/security/2fa/verify
router.post('/2fa/verify', verifyToken, async (req, res) => {
  const { token } = req.body;
  try {
    const user = await pool.query('SELECT two_fa_secret FROM users WHERE id=$1', [req.user.id]);
    if (!user.rows[0].two_fa_secret) return res.status(400).json({ error: '2FA not set up' });

    const verified = speakeasy.totp.verify({
      secret: user.rows[0].two_fa_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) return res.status(401).json({ error: 'Invalid 2FA code' });

    await pool.query('UPDATE users SET two_fa_enabled = true WHERE id=$1', [req.user.id]);
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/security/2fa/disable
router.post('/2fa/disable', verifyToken, async (req, res) => {
  const { token } = req.body;
  try {
    const user = await pool.query('SELECT two_fa_secret FROM users WHERE id=$1', [req.user.id]);
    const verified = speakeasy.totp.verify({
      secret: user.rows[0].two_fa_secret,
      encoding: 'base32',
      token, window: 2,
    });
    if (!verified) return res.status(401).json({ error: 'Invalid 2FA code' });

    await pool.query('UPDATE users SET two_fa_enabled = false, two_fa_secret = NULL WHERE id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
