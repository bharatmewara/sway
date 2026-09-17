'use strict';

const pool = require('../config/database');

class SwipeRepository {
  async recordSwipe(likerId, likedId, type = 'like', message = null) {
    const res = await pool.query(
      `INSERT INTO likes (liker_id, liked_id, like_type, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (liker_id, liked_id)
       DO UPDATE SET like_type = EXCLUDED.like_type, message = EXCLUDED.message, created_at = NOW()
       RETURNING *`,
      [likerId, likedId, type, message]
    );
    return res.rows[0];
  }

  async checkReciprocal(user1Id, user2Id) {
    const res = await pool.query(
      `SELECT * FROM likes
       WHERE liker_id = $1 AND liked_id = $2 AND like_type IN ('like', 'super_like')`,
      [user2Id, user1Id]
    );
    return res.rows.length > 0;
  }

  async getSwipedUserIds(userId) {
    const res = await pool.query(
      `SELECT liked_id FROM likes WHERE liker_id = $1`,
      [userId]
    );
    return res.rows.map(r => r.liked_id);
  }
}

module.exports = new SwipeRepository();
