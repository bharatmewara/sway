'use strict';

const pool = require('../config/database');

class ReportRepository {
  async createReport(reporterId, reportedId, reason, description) {
    const res = await pool.query(
      `INSERT INTO reports (reporter_id, reported_id, reason, description, status, created_at)
       VALUES ($1, $2, $3, $4, 'open', NOW()) RETURNING *`,
      [reporterId, reportedId, reason, description]
    );
    return res.rows[0];
  }

  async blockUser(blockerId, blockedId, reason = null) {
    await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_id, reason, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [blockerId, blockedId, reason]
    );
    await pool.query(
      `UPDATE connection_requests SET status = 'blocked', responded_at = NOW()
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
      [blockerId, blockedId]
    ).catch(() => {});
  }

  async unblockUser(blockerId, blockedId) {
    await pool.query(
      `DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [blockerId, blockedId]
    );
  }

  async getBlockedUsers(blockerId) {
    const res = await pool.query(
      `SELECT b.id, b.blocked_id, b.reason, b.created_at,
              u.username, u.nickname, u.profile_photo, u.gender, u.age, u.city
       FROM blocks b
       JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id = $1
       ORDER BY b.created_at DESC`,
      [blockerId]
    );
    return res.rows;
  }

  async isBlocked(user1Id, user2Id) {
    const res = await pool.query(
      `SELECT id FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [user1Id, user2Id]
    );
    return res.rows.length > 0;
  }
}

module.exports = new ReportRepository();
