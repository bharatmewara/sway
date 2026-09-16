'use strict';

const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

const CRUSH_COST = 5;

// ─── GET / - Get crushes received ────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM crushes WHERE receiver_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT c.id, c.created_at,
              u.id AS sender_id, u.username, u.profile_photo, u.gender,
              u.city, u.state, u.is_online, u.verification_status,
              DATE_PART('year', AGE(u.date_of_birth)) AS age,
              EXISTS (
                SELECT 1 FROM crushes c2
                WHERE c2.sender_id = $1 AND c2.receiver_id = u.id
              ) AS is_mutual
       FROM crushes c
       JOIN users u ON u.id = c.sender_id
       WHERE c.receiver_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.status(200).json({ success: true, crushes: result.rows, total, pages, page });
  } catch (err) {
    console.error('[CRUSHES] GET / error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /sent - Get crushes sent ─────────────────────────────────────────────

router.get('/sent', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM crushes WHERE sender_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT c.id, c.created_at,
              u.id AS receiver_id, u.username, u.profile_photo, u.gender,
              u.city, u.state, u.is_online, u.verification_status,
              DATE_PART('year', AGE(u.date_of_birth)) AS age,
              EXISTS (
                SELECT 1 FROM crushes c2
                WHERE c2.sender_id = $1 AND c2.receiver_id = u.id
              ) AS is_mutual
       FROM crushes c
       JOIN users u ON u.id = c.receiver_id
       WHERE c.sender_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.status(200).json({ success: true, crushes: result.rows, total, pages, page });
  } catch (err) {
    console.error('[CRUSHES] GET /sent error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST / - Send crush ──────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, receiver_id } = req.body;
    const receiverId = parseInt(user_id || receiver_id, 10);

    if (isNaN(receiverId)) {
      return res.status(400).json({ success: false, message: 'Valid user_id or receiver_id is required.' });
    }
    if (receiverId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot send a crush to yourself.' });
    }

    await client.query('BEGIN');

    // Check daily crushes to see if it's free
    const dailyLimitCheck = await client.query(
      `SELECT COUNT(*) AS daily_crushes 
       FROM crushes 
       WHERE sender_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [req.user.id]
    );
    const dailyCrushes = parseInt(dailyLimitCheck.rows[0].daily_crushes, 10);
    let cost = dailyCrushes < 5 ? 0 : CRUSH_COST;
    
    // Female users get unlimited free crushes
    if (req.user.gender === 'female') {
      cost = 0;
    }

    // Check receiver exists
    const receiverResult = await client.query(
      `SELECT id FROM users WHERE id = $1 AND is_active = true AND is_banned = false`,
      [receiverId]
    );
    if (receiverResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if already crushed
    const existingCrush = await client.query(
      `SELECT id FROM crushes WHERE sender_id = $1 AND receiver_id = $2`,
      [req.user.id, receiverId]
    );
    if (existingCrush.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'You already sent a crush to this user.' });
    }

    // Check and deduct credits if not free
    const creditResult = await client.query(
      `SELECT connect_credits AS credits FROM users WHERE id = $1 FOR UPDATE`,
      [req.user.id]
    );
    const currentCredits = creditResult.rows[0]?.credits || 0;
    
    if (cost > 0 && currentCredits < cost) {
      await client.query('ROLLBACK');
      return res.status(402).json({
        success: false,
        message: `You have used your 5 free daily crushes. Additional crushes cost ${cost} credits.`,
        credits: currentCredits,
      });
    }

    if (cost > 0) {
      await client.query(
        `UPDATE users SET connect_credits = connect_credits - $1, updated_at = NOW() WHERE id = $2`,
        [cost, req.user.id]
      );

      await client.query(
        `INSERT INTO credit_logs (user_id, action, credits_delta, balance_after, description, created_at)
         VALUES ($1, 'crush_sent', $2, $3, 'Crush sent', NOW())`,
        [req.user.id, -cost, currentCredits - cost]
      );
    }

    // Insert crush
    await client.query(
      `INSERT INTO crushes (sender_id, receiver_id, created_at) VALUES ($1, $2, NOW())`,
      [req.user.id, receiverId]
    );

    // Check if mutual crush
    const mutualCheck = await client.query(
      `SELECT id FROM crushes WHERE sender_id = $1 AND receiver_id = $2`,
      [receiverId, req.user.id]
    );
    const isMutual = mutualCheck.rows.length > 0;

    // Notification for receiver
    const notifMessage = isMutual
      ? `You and ${req.user.username} have a mutual crush! 💕`
      : `${req.user.username} has a crush on you! 😍`;

    await client.query(
      `INSERT INTO notifications (user_id, type, related_user_id, body, is_read, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())`,
      [receiverId, isMutual ? 'mutual_crush' : 'crush_received', req.user.id, notifMessage]
    );

    if (isMutual) {
      // Also notify sender
      await client.query(
        `INSERT INTO notifications (user_id, type, related_user_id, body, is_read, created_at)
         VALUES ($1, 'mutual_crush', $2, $3, false, NOW())`,
        [req.user.id, receiverId, `It's a mutual crush with ${req.user.username}! 💕`]
      );
    }

    await client.query('COMMIT');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('crush_received', {
        from_user_id: req.user.id,
        from_username: req.user.username,
        is_mutual: isMutual,
      });
    }

    return res.status(201).json({
      success: true,
      message: isMutual ? 'Mutual crush! 💕' : 'Crush sent successfully!',
      is_mutual: isMutual,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[CRUSHES] POST / error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error sending crush.' });
  } finally {
    client.release();
  }
});

// ─── GET /mutual - Get mutual crushes ────────────────────────────────────────

router.get('/mutual', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM crushes c1
       JOIN crushes c2 ON c1.sender_id = c2.receiver_id AND c1.receiver_id = c2.sender_id
       WHERE c1.sender_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT c1.id, c1.created_at,
              u.id AS user_id, u.username, u.profile_photo, u.gender,
              u.city, u.state, u.is_online, u.verification_status,
              DATE_PART('year', AGE(u.date_of_birth)) AS age
       FROM crushes c1
       JOIN crushes c2 ON c1.sender_id = c2.receiver_id AND c1.receiver_id = c2.sender_id
       JOIN users u ON u.id = c1.receiver_id
       WHERE c1.sender_id = $1
       ORDER BY c1.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.status(200).json({ success: true, mutual_crushes: result.rows, total, pages, page });
  } catch (err) {
    console.error('[CRUSHES] GET /mutual error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /:id - Delete a crush ─────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const crushId = parseInt(req.params.id, 10);
    if (isNaN(crushId)) return res.status(400).json({ success: false, message: 'Invalid crush ID.' });

    // Ensure the crush exists and the user is either the sender or receiver
    const result = await pool.query(
      `DELETE FROM crushes 
       WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)
       RETURNING id`,
      [crushId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Crush not found or unauthorized.' });
    }

    return res.status(200).json({ success: true, message: 'Crush removed successfully.' });
  } catch (err) {
    console.error('[CRUSHES] DELETE /:id error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error deleting crush.' });
  }
});

module.exports = router;
