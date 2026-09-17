'use strict';

const pool = require('../config/database');

class MatchRepository {
  async createMatch(user1Id, user2Id, score = 85.0) {
    const [u1, u2] = [Math.min(user1Id, user2Id), Math.max(user1Id, user2Id)];
    const res = await pool.query(
      `INSERT INTO matches (user1_id, user2_id, compatibility_score, matched_at, is_active)
       VALUES ($1, $2, $3, NOW(), true)
       ON CONFLICT (user1_id, user2_id) DO UPDATE SET is_active = true, matched_at = NOW()
       RETURNING *`,
      [u1, u2, score]
    );
    return res.rows[0];
  }

  async getMatches(userId) {
    const res = await pool.query(
      `SELECT m.id AS match_id, m.compatibility_score, m.matched_at,
              u.id, u.username, u.profile_photo, u.age, u.city, u.is_online, u.bio
       FROM matches m
       JOIN users u ON (u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END)
       WHERE (m.user1_id = $1 OR m.user2_id = $1)
         AND m.is_active = true
         AND u.is_active = true
       ORDER BY m.matched_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async areMatched(user1Id, user2Id) {
    const [u1, u2] = [Math.min(user1Id, user2Id), Math.max(user1Id, user2Id)];
    const res = await pool.query(
      `SELECT id FROM matches WHERE user1_id = $1 AND user2_id = $2 AND is_active = true`,
      [u1, u2]
    );
    return res.rows.length > 0;
  }

  async unmatch(user1Id, user2Id) {
    const [u1, u2] = [Math.min(user1Id, user2Id), Math.max(user1Id, user2Id)];
    await pool.query(
      `UPDATE matches SET is_active = false WHERE user1_id = $1 AND user2_id = $2`,
      [u1, u2]
    );
  }
}

module.exports = new MatchRepository();
