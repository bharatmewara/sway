'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/privacy/settings
router.get('/settings', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_privacy_settings WHERE user_id = $1',
      [req.user.id]
    );
    if (!result.rows.length) {
      // Return defaults
      return res.json({
        settings: {
          hide_real_name: false, hide_phone: true, hide_email: true,
          blur_face: false, hide_distance: false, hide_age: false,
          incognito_mode: false, invisible_browsing: false,
          screenshot_warning: true, auto_logout_minutes: 0,
          notification_masking: false, pin_lock: null,
        }
      });
    }
    const s = result.rows[0];
    delete s.pin_lock; // never send PIN to client
    res.json({ settings: s });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/privacy/settings
router.put('/settings', verifyToken, async (req, res) => {
  const {
    hide_real_name, hide_phone, hide_email, blur_face,
    hide_distance, hide_age, incognito_mode, invisible_browsing,
    screenshot_warning, auto_logout_minutes, notification_masking, pin_lock
  } = req.body;

  try {
    await pool.query(`
      INSERT INTO user_privacy_settings (
        user_id, hide_real_name, hide_phone, hide_email, blur_face,
        hide_distance, hide_age, incognito_mode, invisible_browsing,
        screenshot_warning, auto_logout_minutes, notification_masking, pin_lock, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        hide_real_name = EXCLUDED.hide_real_name,
        hide_phone = EXCLUDED.hide_phone,
        hide_email = EXCLUDED.hide_email,
        blur_face = EXCLUDED.blur_face,
        hide_distance = EXCLUDED.hide_distance,
        hide_age = EXCLUDED.hide_age,
        incognito_mode = EXCLUDED.incognito_mode,
        invisible_browsing = EXCLUDED.invisible_browsing,
        screenshot_warning = EXCLUDED.screenshot_warning,
        auto_logout_minutes = EXCLUDED.auto_logout_minutes,
        notification_masking = EXCLUDED.notification_masking,
        pin_lock = EXCLUDED.pin_lock,
        updated_at = NOW()
    `, [
      req.user.id, hide_real_name, hide_phone, hide_email, blur_face,
      hide_distance, hide_age, incognito_mode, invisible_browsing,
      screenshot_warning, auto_logout_minutes, notification_masking, pin_lock
    ]);

    // Update blur_face on user record
    if (typeof blur_face !== 'undefined') {
      await pool.query('UPDATE users SET blur_face_photo = $1 WHERE id = $2', [blur_face, req.user.id]);
    }

    // Update incognito/invisible on user record
    if (typeof incognito_mode !== 'undefined') {
      await pool.query('UPDATE users SET is_online = $1 WHERE id = $2', [!incognito_mode, req.user.id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
