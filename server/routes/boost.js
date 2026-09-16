'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Boost type durations in minutes
const BOOST_DURATIONS = { '30min': 30, '1hour': 60, '24hours': 1440 };
const BOOST_COSTS = { '30min': 20, '1hour': 35, '24hours': 100 };

// POST /api/boost/activate
router.post('/activate', verifyToken, async (req, res) => {
  const { boost_type = '30min' } = req.body;
  if (!BOOST_DURATIONS[boost_type]) return res.status(400).json({ error: 'Invalid boost type' });

  const cost = BOOST_COSTS[boost_type];
  const duration = BOOST_DURATIONS[boost_type];

  try {
    const user = await pool.query('SELECT connect_credits, boost_active_until FROM users WHERE id = $1', [req.user.id]);
    const u = user.rows[0];

    if (u.boost_active_until && new Date(u.boost_active_until) > new Date()) {
      return res.status(409).json({ error: 'Boost already active', expires_at: u.boost_active_until });
    }

    if (u.connect_credits < cost) {
      return res.status(402).json({ error: `Need ${cost} credits for this boost` });
    }

    const endsAt = new Date(Date.now() + duration * 60000);

    await pool.query('UPDATE users SET connect_credits = connect_credits - $1, boost_active_until = $2 WHERE id = $3',
      [cost, endsAt, req.user.id]);

    await pool.query(`INSERT INTO credit_logs (user_id, action, credits_delta, description)
      VALUES ($1, 'boost_purchased', $2, $3)`, [req.user.id, -cost, `Profile boost: ${boost_type}`]);

    await pool.query(`INSERT INTO boosts (user_id, boost_type, credits_charged, ends_at) VALUES ($1, $2, $3, $4)`,
      [req.user.id, boost_type, cost, endsAt]);

    res.json({ success: true, boost_type, ends_at: endsAt, credits_charged: cost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/boost/status
router.get('/status', verifyToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT boost_active_until FROM users WHERE id = $1', [req.user.id]);
    const boostUntil = user.rows[0].boost_active_until;
    const isActive = boostUntil && new Date(boostUntil) > new Date();
    res.json({ is_active: isActive, expires_at: boostUntil, options: Object.keys(BOOST_DURATIONS).map(k => ({ type: k, duration_min: BOOST_DURATIONS[k], credits: BOOST_COSTS[k] })) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/boost/history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM boosts WHERE user_id = $1 ORDER BY started_at DESC LIMIT 20', [req.user.id]);
    res.json({ boosts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
