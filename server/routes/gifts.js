'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/gifts/catalog
router.get('/catalog', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gift_catalog WHERE is_active = true ORDER BY credit_cost ASC');
    res.json({ gifts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/gifts/send
router.post('/send', verifyToken, async (req, res) => {
  const senderId = req.user.id;
  const { receiver_id, gift_id, message } = req.body;
  if (!receiver_id || !gift_id) return res.status(400).json({ error: 'receiver_id and gift_id required' });

  try {
    const gift = await pool.query('SELECT * FROM gift_catalog WHERE id = $1 AND is_active = true', [gift_id]);
    if (!gift.rows.length) return res.status(404).json({ error: 'Gift not found' });

    const cost = gift.rows[0].credit_cost;
    const sender = await pool.query('SELECT connect_credits FROM users WHERE id = $1', [senderId]);
    if (sender.rows[0].connect_credits < cost) {
      return res.status(402).json({ error: `Not enough credits. Need ${cost} credits.` });
    }

    // Deduct credits
    await pool.query('UPDATE users SET connect_credits = connect_credits - $1 WHERE id = $2', [cost, senderId]);
    await pool.query(`INSERT INTO credit_logs (user_id, action, credits_delta, description)
      VALUES ($1, 'gift_sent', $2, $3)`, [senderId, -cost, `Gift: ${gift.rows[0].name} to user ${receiver_id}`]);

    // Record gift
    const result = await pool.query(`
      INSERT INTO gifts (sender_id, receiver_id, gift_id, message, credits_charged)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [senderId, receiver_id, gift_id, message || null, cost]);

    // Notification
    const senderInfo = await pool.query('SELECT username FROM users WHERE id=$1', [senderId]);
    await pool.query(`
      INSERT INTO notifications (user_id, type, title, body, related_user_id, related_id)
      VALUES ($1, 'gift', 'You received a gift! 🎁', $2, $3, $4)
    `, [receiver_id, `${senderInfo.rows[0].username} sent you a ${gift.rows[0].name} ${gift.rows[0].emoji}`, senderId, result.rows[0].id]);

    res.json({ success: true, gift: { ...result.rows[0], gift_name: gift.rows[0].name, emoji: gift.rows[0].emoji } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/gifts/received
router.get('/received', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, gc.name, gc.emoji, gc.animation_url,
             u.username as sender_name, u.profile_photo as sender_photo
      FROM gifts g
      JOIN gift_catalog gc ON gc.id = g.gift_id
      JOIN users u ON u.id = g.sender_id
      WHERE g.receiver_id = $1
      ORDER BY g.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    
    // Mark as seen
    await pool.query('UPDATE gifts SET is_seen = true WHERE receiver_id = $1 AND is_seen = false', [req.user.id]);
    
    res.json({ gifts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/gifts/sent
router.get('/sent', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, gc.name, gc.emoji,
             u.username as receiver_name, u.profile_photo as receiver_photo
      FROM gifts g
      JOIN gift_catalog gc ON gc.id = g.gift_id
      JOIN users u ON u.id = g.receiver_id
      WHERE g.sender_id = $1
      ORDER BY g.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    res.json({ gifts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
