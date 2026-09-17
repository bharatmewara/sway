'use strict';

const router = require('express').Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');
const { ok, fail } = require('../utils/response');

router.use(verifyToken);

// GET /api/requests - Get pending connection requests for logged in user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cr.id, cr.sender_id, cr.receiver_id, cr.status, cr.message, cr.created_at,
              u.username, u.profile_photo, u.gender, u.age, u.city, u.state, u.is_online
       FROM connection_requests cr
       JOIN users u ON u.id = cr.sender_id
       WHERE cr.receiver_id = $1 AND cr.status = 'pending'
       ORDER BY cr.created_at DESC`,
      [req.user.id]
    );
    return ok(res, { requests: result.rows });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// POST /api/requests - Send a connection request
router.post('/', async (req, res) => {
  try {
    const { receiver_id, user_id, message = 'Hi, I would like to connect with you!' } = req.body;
    const targetId = parseInt(receiver_id || user_id, 10);
    if (!targetId || isNaN(targetId)) return fail(res, 'receiver_id is required.', 400);
    if (targetId === req.user.id) return fail(res, 'Cannot send request to yourself.', 400);

    const existing = await pool.query(
      `SELECT * FROM connection_requests 
       WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [req.user.id, targetId]
    );
    if (existing.rows.length) return fail(res, 'Connection request already sent.', 409);

    const result = await pool.query(
      `INSERT INTO connection_requests (sender_id, receiver_id, message, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       RETURNING *`,
      [req.user.id, targetId, message]
    );

    // Trigger notification
    await pool.query(
      `INSERT INTO notifications (user_id, sender_id, type, title, message, created_at)
       VALUES ($1, $2, 'connection_request', 'New Connection Request', $3, NOW())`,
      [targetId, req.user.id, `${req.user.username} sent you a connection request.`]
    ).catch(() => {});

    return ok(res, { request: result.rows[0], message: 'Request sent successfully.' }, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// PUT /api/requests/:id/accept - Accept connection request
router.put('/:id/accept', async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);
    const cr = await pool.query(
      `UPDATE connection_requests 
       SET status = 'accepted', responded_at = NOW()
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [reqId, req.user.id]
    );
    if (!cr.rows.length) return fail(res, 'Request not found or unauthorized.', 404);

    const senderId = cr.rows[0].sender_id;

    // Create match and conversation automatically
    await pool.query(
      `INSERT INTO matches (user1_id, user2_id, match_type, created_at)
       VALUES ($1, $2, 'request', NOW())
       ON CONFLICT DO NOTHING`,
      [Math.min(req.user.id, senderId), Math.max(req.user.id, senderId)]
    ).catch(() => {});

    await pool.query(
      `INSERT INTO conversations (user1_id, user2_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING`,
      [Math.min(req.user.id, senderId), Math.max(req.user.id, senderId)]
    ).catch(() => {});

    return ok(res, { message: 'Connection request accepted.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// PUT /api/requests/:id/reject - Reject connection request
router.put('/:id/reject', async (req, res) => {
  try {
    const reqId = parseInt(req.params.id, 10);
    const cr = await pool.query(
      `UPDATE connection_requests 
       SET status = 'rejected', responded_at = NOW()
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [reqId, req.user.id]
    );
    if (!cr.rows.length) return fail(res, 'Request not found or unauthorized.', 404);

    return ok(res, { message: 'Connection request rejected.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

module.exports = router;
