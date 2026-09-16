'use strict';

const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

const REQUEST_COST = 5;

// ─── GET / - Requests received ────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM connection_requests WHERE receiver_id = $1 AND status = 'pending'`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT cr.id, cr.message, cr.status, cr.created_at,
              u.id AS sender_id, u.username, u.profile_photo, u.gender,
              u.city, u.state, u.is_online, u.verification_status,
              DATE_PART('year', AGE(u.date_of_birth)) AS age
       FROM connection_requests cr
       JOIN users u ON u.id = cr.sender_id
       WHERE cr.receiver_id = $1 AND cr.status = 'pending'
       ORDER BY cr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.status(200).json({ success: true, requests: result.rows, total, pages, page });
  } catch (err) {
    console.error('[REQUESTS] GET / error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /sent - Requests sent ────────────────────────────────────────────────

router.get('/sent', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM connection_requests WHERE sender_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT cr.id, cr.message, cr.status, cr.created_at,
              u.id AS receiver_id, u.username, u.profile_photo, u.gender,
              u.city, u.state, u.is_online, u.verification_status,
              DATE_PART('year', AGE(u.date_of_birth)) AS age
       FROM connection_requests cr
       JOIN users u ON u.id = cr.receiver_id
       WHERE cr.sender_id = $1
       ORDER BY cr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.status(200).json({ success: true, requests: result.rows, total, pages, page });
  } catch (err) {
    console.error('[REQUESTS] GET /sent error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST / - Send connection request ────────────────────────────────────────

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, message } = req.body;
    const receiverId = parseInt(user_id, 10);

    if (isNaN(receiverId)) {
      return res.status(400).json({ success: false, message: 'Valid user_id is required.' });
    }
    if (receiverId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot send a connection request to yourself.' });
    }

    await client.query('BEGIN');

    // Check receiver exists
    const receiverResult = await client.query(
      `SELECT id, username FROM users WHERE id = $1 AND is_active = true AND is_banned = false`,
      [receiverId]
    );
    if (receiverResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if request already exists
    const existing = await client.query(
      `SELECT id, status FROM connection_requests
       WHERE sender_id = $1 AND receiver_id = $2`,
      [req.user.id, receiverId]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: `Connection request already ${existing.rows[0].status}.`,
      });
    }

    const cost = req.user.gender === 'female' ? 0 : REQUEST_COST;

    // Check credits
    const creditResult = await client.query(
      `SELECT connect_credits as credits FROM users WHERE id = $1 FOR UPDATE`,
      [req.user.id]
    );
    const currentCredits = creditResult.rows[0]?.credits || 0;
    if (cost > 0 && currentCredits < cost) {
      await client.query('ROLLBACK');
      return res.status(402).json({
        success: false,
        message: `Insufficient credits. Sending a connection request costs ${cost} credits.`,
        credits: currentCredits,
      });
    }

    // Deduct credits
    if (cost > 0) {
      await client.query(
        `UPDATE users SET connect_credits = connect_credits - $1, updated_at = NOW() WHERE id = $2`,
        [cost, req.user.id]
      );

      await client.query(
        `INSERT INTO credit_logs (user_id, action, credits_delta, balance_after, description, created_at)
         VALUES ($1, 'request_sent', $2, $3, 'Connection request sent', NOW())`,
        [req.user.id, -cost, currentCredits - cost]
      );
    }

    // Insert request
    const reqResult = await client.query(
      `INSERT INTO connection_requests (sender_id, receiver_id, message, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       RETURNING id`,
      [req.user.id, receiverId, message ? message.trim().substring(0, 500) : null]
    );

    // Notification
    await client.query(
      `INSERT INTO notifications (user_id, type, related_user_id, body, is_read, created_at)
       VALUES ($1, 'connection_request', $2, $3, false, NOW())`,
      [
        receiverId,
        req.user.id,
        `${req.user.username} sent you a connection request.`,
      ]
    );

    await client.query('COMMIT');

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('connection_request', {
        from_user_id: req.user.id,
        from_username: req.user.username,
        request_id: reqResult.rows[0].id,
        message: message || null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Connection request sent.',
      request_id: reqResult.rows[0].id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[REQUESTS] POST / error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error sending request.' });
  } finally {
    client.release();
  }
});

// ─── PUT /:id/accept ──────────────────────────────────────────────────────────

router.put('/:id/accept', async (req, res) => {
  const client = await pool.connect();
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) return res.status(400).json({ success: false, message: 'Invalid request ID.' });

    await client.query('BEGIN');

    const reqResult = await client.query(
      `SELECT * FROM connection_requests WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [requestId, req.user.id]
    );
    if (reqResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Request not found or already processed.' });
    }

    const senderId = reqResult.rows[0].sender_id;

    // Update status
    await client.query(
      `UPDATE connection_requests SET status = 'accepted', updated_at = NOW() WHERE id = $1`,
      [requestId]
    );

    // Create conversation if not exists
    const convResult = await client.query(
      `SELECT id FROM conversations
       WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))
         AND is_active = true`,
      [req.user.id, senderId]
    );

    if (convResult.rows.length === 0) {
      await client.query(
        `INSERT INTO conversations (user1_id, user2_id, created_at, is_deleted)
         VALUES ($1, $2, NOW(), false)`,
        [req.user.id, senderId]
      );
    }

    // Notify sender
    await client.query(
      `INSERT INTO notifications (user_id, type, related_user_id, body, is_read, created_at)
       VALUES ($1, 'request_accepted', $2, $3, false, NOW())`,
      [senderId, req.user.id, `${req.user.username} accepted your connection request!`]
    );

    await client.query('COMMIT');

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${senderId}`).emit('request_accepted', {
        from_user_id: req.user.id,
        from_username: req.user.username,
      });
    }

    return res.status(200).json({ success: true, message: 'Connection request accepted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[REQUESTS] PUT /:id/accept error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
});

// ─── PUT /:id/decline ─────────────────────────────────────────────────────────

router.put('/:id/decline', async (req, res) => {
  const client = await pool.connect();
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) return res.status(400).json({ success: false, message: 'Invalid request ID.' });

    await client.query('BEGIN');

    const reqResult = await client.query(
      `UPDATE connection_requests SET status = 'declined', updated_at = NOW()
       WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
       RETURNING sender_id`,
      [requestId, req.user.id]
    );

    if (reqResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Request not found or already processed.' });
    }

    const senderId = reqResult.rows[0].sender_id;

    // Notify sender
    await client.query(
      `INSERT INTO notifications (user_id, type, from_user_id, message, is_read, created_at)
       VALUES ($1, 'request_declined', $2, $3, false, NOW())`,
      [senderId, req.user.id, `Your connection request was declined.`]
    );

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Connection request declined.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[REQUESTS] PUT /:id/decline error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
});

module.exports = router;
