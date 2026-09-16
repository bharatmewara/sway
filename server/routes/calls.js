'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/calls/history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cl.*,
        CASE WHEN cl.caller_id = $1 THEN 'outgoing' ELSE 'incoming' END as direction,
        u.username as other_user_name,
        u.profile_photo as other_user_photo,
        CASE WHEN cl.caller_id = $1 THEN cl.receiver_id ELSE cl.caller_id END as other_user_id
      FROM call_logs cl
      JOIN users u ON u.id = CASE WHEN cl.caller_id = $1 THEN cl.receiver_id ELSE cl.caller_id END
      WHERE cl.caller_id = $1 OR cl.receiver_id = $1
      ORDER BY cl.started_at DESC LIMIT 50
    `, [req.user.id]);
    res.json({ calls: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/calls/initiate - Record call initiation
router.post('/initiate', verifyToken, async (req, res) => {
  const { receiver_id, call_type = 'voice' } = req.body;
  if (!receiver_id) return res.status(400).json({ error: 'receiver_id required' });
  try {
    const result = await pool.query(`
      INSERT INTO call_logs (caller_id, receiver_id, call_type, status)
      VALUES ($1, $2, $3, 'initiated') RETURNING id
    `, [req.user.id, receiver_id, call_type]);

    // Notify receiver via notification
    await pool.query(`
      INSERT INTO notifications (user_id, type, title, body, related_user_id, related_id)
      VALUES ($1, 'call', $2, $3, $4, $5)
    `, [receiver_id, `Incoming ${call_type} call`, `${req.user.username} is calling you`, req.user.id, result.rows[0].id]);

    res.json({ call_id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/calls/:id/end
router.put('/:id/end', verifyToken, async (req, res) => {
  const { duration_seconds = 0, status = 'completed' } = req.body;
  try {
    await pool.query(`
      UPDATE call_logs SET status = $1, duration_seconds = $2, ended_at = NOW()
      WHERE id = $3 AND (caller_id = $4 OR receiver_id = $4)
    `, [status, duration_seconds, req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/calls/signal/:userId - WebRTC signaling helper
// In production this would use a TURN server (Twilio, Agora, etc.)
router.get('/signal/:userId', verifyToken, async (req, res) => {
  res.json({
    ice_servers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
    note: 'For production, integrate Twilio or Agora TURN servers'
  });
});

module.exports = router;
