'use strict';

const express = require('express');
const pool = require('../config/db');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyAdmin);

// ─── GET /dashboard ───────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsersRes,
      onlineUsersRes,
      totalVerifiedRes,
      pendingVerifRes,
      totalRevenueRes,
      todayRevenueRes,
      totalMessagesRes,
      cityWiseRes,
      revenueByDayRes,
      genderSplitRes,
      verificationStatsRes,
      recentUsersRes,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE 1=1`),
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE is_online = true AND 1=1`),
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE verification_status = 'verified' AND 1=1`),
      pool.query(`SELECT COUNT(*) AS count FROM verification_requests WHERE status = 'pending'`),
      pool.query(`SELECT COALESCE(SUM(amount_inr), 0) AS total FROM transactions WHERE status = 'success'`),
      pool.query(
        `SELECT COALESCE(SUM(amount_inr), 0) AS total FROM transactions
         WHERE status = 'success' AND created_at::date = CURRENT_DATE`
      ),
      pool.query(`SELECT COUNT(*) AS count FROM messages WHERE 1=1`),
      pool.query(
        `SELECT city, COUNT(*) AS user_count
         FROM users WHERE 1=1 AND city IS NOT NULL
         GROUP BY city
         ORDER BY user_count DESC
         LIMIT 10`
      ),
      pool.query(
        `SELECT DATE(created_at) AS day, COALESCE(SUM(amount_inr), 0) AS revenue
         FROM transactions
         WHERE status = 'success' AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY day
         ORDER BY day ASC`
      ),
      pool.query(
        `SELECT gender, COUNT(*) AS count
         FROM users WHERE 1=1
         GROUP BY gender`
      ),
      pool.query(
        `SELECT status, COUNT(*) AS count
         FROM verification_requests
         GROUP BY status`
      ),
      pool.query(
        `SELECT id, username, email, profile_photo, created_at, is_online, verification_status 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT 6`
      ),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers:             parseInt(totalUsersRes.rows[0].count, 10),
        onlineUsers:            parseInt(onlineUsersRes.rows[0].count, 10),
        totalVerified:          parseInt(totalVerifiedRes.rows[0].count, 10),
        pendingVerifications:   parseInt(pendingVerifRes.rows[0].count, 10),
        totalRevenue:           parseFloat(totalRevenueRes.rows[0].total),
        todayRevenue:           parseFloat(todayRevenueRes.rows[0].total),
        totalMessages:          parseInt(totalMessagesRes.rows[0].count, 10),
        cityWiseUsers:          cityWiseRes.rows,
        revenueByDay:           revenueByDayRes.rows,
        genderSplit:            genderSplitRes.rows,
        verificationStats:      verificationStatsRes.rows,
        recentUsers:            recentUsersRes.rows,
      },
    });
  } catch (err) {
    console.error('[ADMIN] /dashboard error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching dashboard data.' });
  }
});

// ─── GET /users ───────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const { city, gender, verification_status, is_banned, search } = req.query;

    const conditions = [`1=1`];
    const params = [];
    let idx = 1;

    if (city) { conditions.push(`u.city ILIKE $${idx++}`); params.push(`%${city}%`); }
    if (gender) { conditions.push(`u.gender = $${idx++}`); params.push(gender); }
    if (verification_status) { conditions.push(`u.verification_status = $${idx++}`); params.push(verification_status); }
    if (is_banned !== undefined) {
      conditions.push(`u.is_banned = $${idx++}`);
      params.push(is_banned === 'true');
    }
    if (search) {
      conditions.push(`(u.username ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM users u WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.gender, u.date_of_birth as dob, u.city, u.state, u.country,
              u.profile_photo, u.is_online, u.is_banned, u.ban_reason, u.verification_status,
              u.connect_credits as credits, u.role, u.created_at, u.last_seen,
              u.age
       FROM users u
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return res.status(200).json({ success: true, users: result.rows, total, pages, page });
  } catch (err) {
    console.error('[ADMIN] GET /users error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /users/:id ───────────────────────────────────────────────────────────

router.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.gender, u.date_of_birth as dob, u.city, u.state, u.country,
              u.profile_photo, u.is_online, u.is_banned, u.ban_reason, u.verification_status,
              u.connect_credits as credits, u.role, u.created_at, u.last_seen, u.verified_at,
              u.bio, u.marital_status, u.height, u.body_type, u.education, u.profession,
              u.looking_for, u.interests,
              (SELECT COUNT(*) FROM messages WHERE sender_id = u.id) AS total_messages_sent,
              (SELECT COUNT(*) FROM transactions WHERE user_id = u.id AND status = 'success') AS total_purchases,
              (SELECT COALESCE(SUM(amount_inr), 0) FROM transactions WHERE user_id = u.id AND status = 'success') AS total_spent,
              u.age
       FROM users u
       WHERE u.id = $1 AND 1=1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('[ADMIN] GET /users/:id error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /users/:id/ban ───────────────────────────────────────────────────────

router.put('/users/:id/ban', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Ban reason is required.' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot ban yourself.' });
    }

    const result = await pool.query(
      `UPDATE users SET is_banned = true, ban_reason = $1, updated_at = NOW()
       WHERE id = $2 AND 1=1
       RETURNING id, username`,
      [reason.trim(), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Kick user from socket if online
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('account_banned', { reason: reason.trim() });
    }

    return res.status(200).json({
      success: true,
      message: `User ${result.rows[0].username} has been banned.`,
    });
  } catch (err) {
    console.error('[ADMIN] PUT /users/:id/ban error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /users/:id/unban ─────────────────────────────────────────────────────

router.put('/users/:id/unban', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    const result = await pool.query(
      `UPDATE users SET is_banned = false, ban_reason = NULL, updated_at = NOW()
       WHERE id = $1 AND 1=1
       RETURNING id, username`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `User ${result.rows[0].username} has been unbanned.`,
    });
  } catch (err) {
    console.error('[ADMIN] PUT /users/:id/unban error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /users/:id/add-credits ───────────────────────────────────────────────

router.put('/users/:id/add-credits', async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    const amount = parseInt(req.body.amount ?? req.body.credits, 10);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive integer.' });
    }

    const { reason } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE users SET connect_credits = connect_credits + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, connect_credits`,
      [amount, userId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await client.query(
      `INSERT INTO credit_logs (user_id, action, credits_delta, balance_after, description, created_at)
       VALUES ($1, 'admin_grant', $2, $3, $4, NOW())`,
      [
        userId,
        amount,
        result.rows[0].connect_credits,
        reason ? reason.trim() : `Admin granted ${amount} credits`,
      ]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `${amount} credits added to ${result.rows[0].username}.`,
      new_balance: result.rows[0].connect_credits,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ADMIN] PUT /users/:id/add-credits error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
});

// ─── DELETE /users/:id ────────────────────────────────────────────────────────

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself.' });
    }

    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id, username`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('account_deleted');
    }

    return res.status(200).json({
      success: true,
      message: `User ${result.rows[0].username} has been deleted.`,
    });
  } catch (err) {
    console.error('[ADMIN] DELETE /users/:id error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /transactions ────────────────────────────────────────────────────────

router.get('/transactions', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const { status, user_id } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
    if (user_id) { conditions.push(`t.user_id = $${idx++}`); params.push(parseInt(user_id, 10)); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT t.id, t.user_id, t.pack_name as plan_id, t.credits_purchased as credits, t.amount_inr, t.status,
              t.razorpay_order_id, t.razorpay_payment_id, t.created_at,
              u.username, u.email
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return res.status(200).json({ success: true, transactions: result.rows, total, pages, page });
  } catch (err) {
    console.error('[ADMIN] GET /transactions error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /reports ─────────────────────────────────────────────────────────────

router.get('/reports', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`r.status = $${idx++}`); params.push(status); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM reports r ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT r.id, r.reporter_id, r.reported_id, r.reason, r.description, r.status,
              r.created_at,
              ru.username AS reporter_username,
              rd.username AS reported_username
       FROM reports r
       JOIN users ru ON ru.id = r.reporter_id
       JOIN users rd ON rd.id = r.reported_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return res.status(200).json({ success: true, reports: result.rows, total, pages, page });
  } catch (err) {
    console.error('[ADMIN] GET /reports error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /reports/:id/resolve ─────────────────────────────────────────────────

router.put('/reports/:id/resolve', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) return res.status(400).json({ success: false, message: 'Invalid report ID.' });

    const { resolution_note } = req.body;

    const result = await pool.query(
      `UPDATE reports
       SET status = 'resolved', reviewed_by = $1
       WHERE id = $2 AND status != 'resolved'
       RETURNING id`,
      [req.user.id, reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found or already resolved.' });
    }

    return res.status(200).json({ success: true, message: 'Report resolved.' });
  } catch (err) {
    console.error('[ADMIN] PUT /reports/:id/resolve error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
