'use strict';

const pool = require('../config/database');

class ConversationRepository {
  async findOrCreate(user1Id, user2Id) {
    const [u1, u2] = [Math.min(user1Id, user2Id), Math.max(user1Id, user2Id)];
    const existing = await pool.query(
      `SELECT * FROM conversations WHERE user1_id = $1 AND user2_id = $2`,
      [u1, u2]
    );
    if (existing.rows.length) return existing.rows[0];

    const res = await pool.query(
      `INSERT INTO conversations (user1_id, user2_id, created_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [u1, u2]
    );
    return res.rows[0];
  }

  async getUserConversations(userId) {
    const res = await pool.query(
      `SELECT c.id, c.id AS conversation_id, c.last_message_at, c.is_pinned,
              m.content AS last_message, m.created_at AS message_time, m.is_read, m.sender_id AS last_sender_id,
              u.id AS other_user_id, u.username, u.username AS other_username,
              u.profile_photo, u.profile_photo AS other_photo,
              u.is_online, u.is_online AS other_is_online,
              u.last_seen, u.last_seen AS other_last_seen,
              (SELECT COUNT(*) FROM messages msg
               WHERE msg.conversation_id = c.id AND msg.receiver_id = $1 AND msg.is_read = false)::int AS unread_count
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
       LEFT JOIN messages m ON m.id = c.last_message_id
       WHERE (c.user1_id = $1 OR c.user2_id = $1)
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [userId]
    );
    return res.rows;
  }

  async findById(conversationId) {
    const res = await pool.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    return res.rows[0] || null;
  }
}

module.exports = new ConversationRepository();
