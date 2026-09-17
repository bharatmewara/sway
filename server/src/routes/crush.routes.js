'use strict';

const router = require('express').Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');
const { ok, fail } = require('../utils/response');

router.use(verifyToken);

// GET /api/crushes - Get user's crushes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.receiver_id AS user_id, c.is_mutual, c.created_at,
              u.username, u.profile_photo, u.gender, u.age, u.city, u.state, u.is_online
       FROM crushes c
       JOIN users u ON u.id = c.receiver_id
       WHERE c.sender_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    return ok(res, { crushes: result.rows });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// POST /api/crushes - Send a crush to a user
router.post('/', async (req, res) => {
  try {
    const { receiver_id, user_id } = req.body;
    const targetId = parseInt(receiver_id || user_id, 10);
    if (!targetId || isNaN(targetId)) return fail(res, 'receiver_id is required.', 400);
    if (targetId === req.user.id) return fail(res, 'Cannot crush on yourself.', 400);

    // Check if reverse crush exists (makes it mutual!)
    const reverse = await pool.query(
      `SELECT * FROM crushes WHERE sender_id = $1 AND receiver_id = $2`,
      [targetId, req.user.id]
    );

    const isMutual = reverse.rows.length > 0;

    const result = await pool.query(
      `INSERT INTO crushes (sender_id, receiver_id, is_mutual, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [req.user.id, targetId, isMutual]
    );

    if (isMutual) {
      await pool.query(
        `UPDATE crushes SET is_mutual = true WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
        [req.user.id, targetId]
      );
      // Create a match
      await pool.query(
        `INSERT INTO matches (user1_id, user2_id, match_type, created_at)
         VALUES ($1, $2, 'crush', NOW())
         ON CONFLICT DO NOTHING`,
        [Math.min(req.user.id, targetId), Math.max(req.user.id, targetId)]
      ).catch(() => {});
    }

    return ok(res, { crush: result.rows[0], is_mutual: isMutual, message: isMutual ? 'It\'s a mutual crush!' : 'Crush sent!' }, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

module.exports = router;
