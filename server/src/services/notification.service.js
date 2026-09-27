'use strict';

const pool = require('../config/database');

class NotificationService {
  async getNotifications(userId, limit = 50) {
    const res = await pool.query(
      `SELECT n.*,
              n.related_user_id AS sender_id,
              u.username AS sender_username,
              u.nickname AS sender_nickname,
              u.profile_photo AS sender_photo,
              COALESCE(u.verified_gender, u.gender) AS sender_gender,
              u.is_online AS sender_online
       FROM notifications n
       LEFT JOIN users u ON u.id = n.related_user_id
       WHERE n.user_id = $1
         AND (
           n.related_user_id IS NULL
           OR n.related_user_id NOT IN (
             SELECT blocked_id FROM blocks WHERE blocker_id = $1
             UNION
             SELECT blocker_id FROM blocks WHERE blocked_id = $1
           )
         )
       ORDER BY n.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  async getUnreadCount(userId) {
    const res = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications n
       WHERE n.user_id = $1
         AND n.is_read = false
         AND (
           n.related_user_id IS NULL
           OR n.related_user_id NOT IN (
             SELECT blocked_id FROM blocks WHERE blocker_id = $1
             UNION
             SELECT blocker_id FROM blocks WHERE blocked_id = $1
           )
         )`,
      [userId]
    );
    return res.rows[0]?.count || 0;
  }

  async createNotification(userId, type, title, body, relatedUserId = null, relatedId = null) {
    const res = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, related_user_id, related_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW()) RETURNING *`,
      [userId, type, title, body, relatedUserId, relatedId]
    );
    return res.rows[0];
  }

  async markAsRead(notificationId, userId) {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
    return this.getUnreadCount(userId);
  }

  async markAllAsRead(userId) {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return 0;
  }
}

module.exports = new NotificationService();
