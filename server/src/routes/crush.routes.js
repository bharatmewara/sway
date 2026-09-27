'use strict';

const router = require('express').Router();
const pool = require('../config/database');
const reportRepo = require('../repositories/report.repository');
const { verifyToken } = require('../middleware/auth.middleware');
const { ok, fail } = require('../utils/response');

router.use(verifyToken);

// GET /api/crushes - Get crushes received (and sent) for user, excluding blocked users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.sender_id, c.receiver_id, c.receiver_id AS user_id, c.is_mutual, c.created_at,
              u.username, u.nickname, u.profile_photo, u.gender, u.age, u.city, u.state, u.is_online
       FROM crushes c
       JOIN users u ON u.id = c.sender_id
       WHERE c.receiver_id = $1
         AND c.sender_id NOT IN (
           SELECT blocked_id FROM blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM blocks WHERE blocked_id = $1
         )
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    return ok(res, { crushes: result.rows });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// POST /api/crushes or POST /api/crushes/:id - Send a crush to a user
const sendCrushHandler = async (req, res) => {
  try {
    const { receiver_id, user_id } = req.body || {};
    const targetId = parseInt(req.params.id || receiver_id || user_id, 10);
    if (!targetId || isNaN(targetId)) return fail(res, 'receiver_id is required.', 400);
    if (targetId === req.user.id) return fail(res, 'Cannot crush on yourself.', 400);

    const isBlocked = await reportRepo.isBlocked(req.user.id, targetId);
    if (isBlocked) {
      return fail(res, 'Cannot send a Crush to this user (blocked).', 403);
    }

    const existing = await pool.query(
      `SELECT id FROM crushes WHERE sender_id = $1 AND receiver_id = $2`,
      [req.user.id, targetId]
    );
    if (existing.rows.length > 0) {
      return fail(res, 'You have already sent a Crush to this user.', 400);
    }

    // Check if reverse crush exists (makes it mutual!)
    const reverse = await pool.query(
      `SELECT * FROM crushes WHERE sender_id = $1 AND receiver_id = $2`,
      [targetId, req.user.id]
    );

    const isMutual = reverse.rows.length > 0;

    const result = await pool.query(
      `INSERT INTO crushes (sender_id, receiver_id, is_mutual, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [req.user.id, targetId, isMutual]
    );

    if (isMutual) {
      await pool.query(
        `UPDATE crushes SET is_mutual = true WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
        [req.user.id, targetId]
      );
      await pool.query(
        `INSERT INTO matches (user1_id, user2_id, match_type, created_at)
         VALUES ($1, $2, 'crush', NOW())
         ON CONFLICT DO NOTHING`,
        [Math.min(req.user.id, targetId), Math.max(req.user.id, targetId)]
      ).catch(() => {});
    }

    const notifRes = await pool.query(
      `INSERT INTO notifications (user_id, related_user_id, type, title, body, is_read, created_at)
       VALUES ($1, $2, 'CRUSH_RECEIVED', 'New Crush Alert!', $3, false, NOW())
       RETURNING *`,
      [targetId, req.user.id, `${req.user.username || 'Someone'} sent you a Crush!`]
    ).catch(() => ({ rows: [] }));

    const io = req.app.get('io');
    if (io && notifRes.rows[0]) {
      io.to(`user_${targetId}`).emit('new_notification', notifRes.rows[0]);
    }

    return ok(res, { crush: result.rows[0], is_mutual: isMutual, message: isMutual ? "It's a mutual crush!" : 'Crush sent!' }, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
router.post('/', sendCrushHandler);
router.post('/:id', sendCrushHandler);

// DELETE /api/crushes/:id - Remove a crush
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query(
      `DELETE FROM crushes WHERE id = $1 AND (receiver_id = $2 OR sender_id = $2)`,
      [id, req.user.id]
    );
    return ok(res, { message: 'Crush removed.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

module.exports = router;
