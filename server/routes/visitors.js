'use strict';

const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// ─── GET / - Get visitors list ────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT visitor_id) AS total
       FROM visits
       WHERE visited_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT DISTINCT ON (v.visitor_id)
              v.visitor_id, v.visited_at AS last_visited_at,
              u.username, u.profile_photo, u.gender, u.city, u.state,
              u.is_online, u.verification_status,
              DATE_PART('year', AGE(u.date_of_birth)) AS age
       FROM visits v
       JOIN users u ON u.id = v.visitor_id
       WHERE v.visited_id = $1
         AND u.is_active = true
         AND u.is_banned = false
       ORDER BY v.visitor_id, v.visited_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // Re-sort by last_visited_at after DISTINCT ON
    const sorted = result.rows.sort((a, b) => new Date(b.last_visited_at) - new Date(a.last_visited_at));

    return res.status(200).json({
      success: true,
      visitors: sorted,
      total,
      pages,
      page,
    });
  } catch (err) {
    console.error('[VISITORS] GET / error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching visitors.' });
  }
});

// ─── DELETE /:visitorId - Remove a visitor from your list ────────────────────
router.delete('/:visitorId', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM visits WHERE visited_id = $1 AND visitor_id = $2`,
      [req.user.id, req.params.visitorId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[VISITORS] DELETE error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
