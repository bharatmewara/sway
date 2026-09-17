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
