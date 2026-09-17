'use strict';

const pool = require('../config/database');

class MessageRepository {
  async createMessage({ conversationId, senderId, receiverId, content, messageType = 'text', mediaUrl = null }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, media_url, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW()) RETURNING *`,
        [conversationId, senderId, receiverId, content, messageType, mediaUrl]
      );
      const msg = res.rows[0];

      await client.query(
        `UPDATE conversations SET last_message_id = $1, last_message_at = NOW() WHERE id = $2`,
        [msg.id, conversationId]
      );

      await client.query('COMMIT');
      return msg;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getMessages(conversationId, limit = 50, offset = 0) {
    const res = await pool.query(
      `SELECT m.*, u.username AS sender_username, u.profile_photo AS sender_photo
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );
    return res.rows;
  }

  async markAsRead(conversationId, receiverId) {
    await pool.query(
      `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false`,
      [conversationId, receiverId]
    );
  }
}

module.exports = new MessageRepository();
