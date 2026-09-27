'use strict';

const pool = require('../config/database');

class ConversationRepository {
  async findByPair(user1Id, user2Id, communicationType = 'chat') {
    const [u1, u2] = [Math.min(Number(user1Id), Number(user2Id)), Math.max(Number(user1Id), Number(user2Id))];
    const commType = String(communicationType).toLowerCase() === 'private_message' ? 'private_message' : 'chat';
    const existing = await pool.query(
      `SELECT * FROM conversations
       WHERE LEAST(user1_id, user2_id) = $1
         AND GREATEST(user1_id, user2_id) = $2
         AND COALESCE(LOWER(communication_type), 'chat') = $3
       ORDER BY COALESCE(last_message_at, session_started_at, created_at) DESC NULLS LAST
       LIMIT 1`,
      [u1, u2, commType]
    );
    return existing.rows[0] || null;
  }

  async findOrCreate(user1Id, user2Id, communicationType = 'chat', defaults = {}) {
    const [u1, u2] = [Math.min(Number(user1Id), Number(user2Id)), Math.max(Number(user1Id), Number(user2Id))];
    const commType = String(communicationType).toLowerCase() === 'private_message' ? 'private_message' : 'chat';

    const existing = await this.findByPair(u1, u2, commType);
    if (existing) return existing;

    const expiresAt = defaults.expiresAt || null;
    const maleUnlocked = defaults.maleUnlocked ?? false;
    const lastFemaleMessageAt = defaults.lastFemaleMessageAt || null;

    const res = await pool.query(
      `INSERT INTO conversations (
         user1_id, user2_id, communication_type, session_status,
         session_started_at, expires_at, last_female_message_at, male_unlocked, created_at
       ) VALUES ($1, $2, $3, 'ACTIVE', NOW(), $4, $5, $6, NOW())
       ON CONFLICT (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id), COALESCE(communication_type, 'chat'))
       DO UPDATE SET session_status = 'ACTIVE',
                     expires_at = COALESCE(EXCLUDED.expires_at, conversations.expires_at)
       RETURNING *`,
      [u1, u2, commType, expiresAt, lastFemaleMessageAt, maleUnlocked]
    );
    return res.rows[0];
  }

  async getUserConversations(userId, communicationType = null) {
    const params = [userId];
    let typeFilter = '';
    if (communicationType) {
      params.push(String(communicationType).toLowerCase());
      typeFilter = `AND COALESCE(LOWER(c.communication_type), 'chat') = $${params.length}`;
    }

    const res = await pool.query(
      `SELECT c.id, c.id AS conversation_id,
              COALESCE(LOWER(c.communication_type), 'chat') AS communication_type,
              COALESCE(c.session_status, 'ACTIVE') AS session_status,
              c.session_started_at, c.expires_at, c.last_female_message_at,
              COALESCE(c.male_unlocked, false) AS male_unlocked,
              c.last_message_at, c.is_pinned,
              m.content AS last_message, m.created_at AS message_time, m.is_read,
              m.sender_id AS last_sender_id, COALESCE(m.is_unlocked, true) AS last_message_unlocked,
              u.id AS other_user_id, u.username, u.username AS other_username, u.nickname AS other_nickname,
              u.profile_photo, u.profile_photo AS other_photo,
              COALESCE(u.verified_gender, u.gender) AS other_gender,
              u.is_online, u.is_online AS other_is_online,
              u.last_seen, u.last_seen AS other_last_seen,
              (SELECT COUNT(*) FROM messages msg
               WHERE msg.conversation_id = c.id AND msg.receiver_id = $1 AND msg.is_read = false)::int AS unread_count,
              (SELECT COUNT(*) FROM messages msg
               WHERE msg.conversation_id = c.id AND msg.receiver_id = $1 AND COALESCE(msg.is_unlocked, true) = false)::int AS locked_count
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
       LEFT JOIN messages m ON m.id = c.last_message_id
       WHERE (c.user1_id = $1 OR c.user2_id = $1)
         AND u.is_active = true
         AND COALESCE(u.is_banned, false) = false
         ${typeFilter}
         AND u.id NOT IN (
           SELECT blocked_id FROM blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM blocks WHERE blocked_id = $1
         )
       ORDER BY COALESCE(c.last_message_at, c.session_started_at, c.created_at) DESC NULLS LAST`,
      params
    );
    return res.rows;
  }

  async findById(conversationId) {
    const res = await pool.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    return res.rows[0] || null;
  }

  async delete(conversationId, userId) {
    const res = await pool.query(
      'DELETE FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2) RETURNING id',
      [conversationId, userId]
    );
    return res.rowCount > 0;
  }
}

module.exports = new ConversationRepository();
