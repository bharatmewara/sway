'use strict';

const router = require('express').Router();
const pool = require('../config/database');
const reportRepo = require('../repositories/report.repository');
const { verifyToken } = require('../middleware/auth.middleware');
const { ok, fail } = require('../utils/response');

router.use(verifyToken);

// GET /api/visitors - Get users who viewed current user's profile
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '12', 10);
    const offset = (page - 1) * limit;

    const countRes = await pool.query(
      `SELECT COUNT(DISTINCT v.visitor_id) AS count
       FROM visits v
       WHERE v.visited_id = $1
         AND v.visitor_id NOT IN (
           SELECT blocked_id FROM blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM blocks WHERE blocked_id = $1
         )`,
      [req.user.id]
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const result = await pool.query(
      `SELECT MAX(v.id) AS id, v.visitor_id, MAX(v.visited_at) AS visited_at,
              u.username, u.nickname, u.profile_photo, u.gender, u.age, u.city, u.state, u.is_online, u.last_seen
       FROM visits v
       JOIN users u ON u.id = v.visitor_id
       WHERE v.visited_id = $1
         AND v.visitor_id NOT IN (
           SELECT blocked_id FROM blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM blocks WHERE blocked_id = $1
         )
       GROUP BY v.visitor_id, u.username, u.nickname, u.profile_photo, u.gender, u.age, u.city, u.state, u.is_online, u.last_seen
       ORDER BY MAX(v.visited_at) DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return ok(res, {
      visitors: result.rows,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// POST /api/visitors - Record a profile visit
router.post('/', async (req, res) => {
  try {
    const { visited_id } = req.body;
    if (!visited_id) return fail(res, 'visited_id is required.', 400);
    const targetId = parseInt(visited_id, 10);
    if (targetId === req.user.id) return ok(res, { message: 'Self visit ignored.' });

    const isBlocked = await reportRepo.isBlocked(req.user.id, targetId);
    if (isBlocked) return ok(res, { message: 'Blocked visit ignored.' });

    const existing = await pool.query(
      `SELECT id FROM visits WHERE visitor_id = $1 AND visited_id = $2`,
      [req.user.id, targetId]
    );
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE visits SET visited_at = NOW() WHERE visitor_id = $1 AND visited_id = $2`,
        [req.user.id, targetId]
      );
    } else {
      await pool.query(
        `INSERT INTO visits (visitor_id, visited_id, visited_at)
         VALUES ($1, $2, NOW())`,
        [req.user.id, targetId]
      );
    }

    // Notify visited user (throttled to 1 per hour per visitor)
    const recentNotif = await pool.query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND related_user_id = $2
         AND UPPER(type) IN ('PROFILE_VISIT', 'VISIT')
         AND created_at > NOW() - INTERVAL '1 hour'
       LIMIT 1`,
      [targetId, req.user.id]
    ).catch(() => ({ rows: [] }));

    if (recentNotif.rows.length === 0) {
      const notifRes = await pool.query(
        `INSERT INTO notifications (user_id, related_user_id, type, title, body, is_read, created_at)
         VALUES ($1, $2, 'PROFILE_VISIT', 'New Profile Visitor', $3, false, NOW())
         RETURNING *`,
        [targetId, req.user.id, `${req.user.username} visited your profile.`]
      ).catch(() => ({ rows: [] }));

      const io = req.app.get('io');
      if (io && notifRes.rows[0]) {
        io.to(`user_${targetId}`).emit('new_notification', notifRes.rows[0]);
      }
    }

    return ok(res, { message: 'Visit recorded.' }, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// DELETE /api/visitors/:visitorId - Remove visitor entry
router.delete('/:visitorId', async (req, res) => {
  try {
    const visitorId = parseInt(req.params.visitorId, 10);
    await pool.query(
      `DELETE FROM visits WHERE visited_id = $1 AND visitor_id = $2`,
      [req.user.id, visitorId]
    );
    return ok(res, { message: 'Visitor removed.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

module.exports = router;
