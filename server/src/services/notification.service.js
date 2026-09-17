'use strict';

const pool = require('../config/database');

class NotificationService {
  async getNotifications(userId, limit = 30) {
    const res = await pool.query(
      `SELECT n.*, u.username AS sender_username, u.profile_photo AS sender_photo
       FROM notifications n
       LEFT JOIN users u ON u.id = n.related_user_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  async createNotification(userId, type, title, body, relatedUserId = null, relatedId = null) {
    const res = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, related_user_id, related_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [userId, type, title, body, relatedUserId, relatedId]
    );
    return res.rows[0];
  }

  async markAsRead(notificationId, userId) {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  async markAllAsRead(userId) {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [userId]
    );
  }
}

module.exports = new NotificationService();
