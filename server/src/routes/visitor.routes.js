'use strict';

const router = require('express').Router();
const pool = require('../config/database');
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
      `SELECT count(*) FROM visits WHERE visited_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const result = await pool.query(
      `SELECT v.id, v.visitor_id, v.visited_at,
              u.username, u.profile_photo, u.gender, u.age, u.city, u.state, u.is_online, u.last_seen
       FROM visits v
       JOIN users u ON u.id = v.visitor_id
       WHERE v.visited_id = $1
       ORDER BY v.visited_at DESC
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

    await pool.query(
      `INSERT INTO visits (visitor_id, visited_id, visited_at)
       VALUES ($1, $2, NOW())`,
      [req.user.id, targetId]
    );

    // Notify visited user
    await pool.query(
      `INSERT INTO notifications (user_id, sender_id, type, title, message, created_at)
       VALUES ($1, $2, 'profile_visit', 'New Profile Visitor', $3, NOW())`,
      [targetId, req.user.id, `${req.user.username} viewed your profile.`]
    ).catch(() => {});

    return ok(res, { message: 'Visit recorded.' }, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

module.exports = router;
