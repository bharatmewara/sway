'use strict';

const logger = require('../utils/logger');
const pool = require('../config/database');

async function processPendingNotifications() {
  try {
    const res = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE is_read = false AND created_at > NOW() - INTERVAL '7 days'`
    );
    logger.info(`[JOB:Notification] Unread notifications in last 7 days: ${res.rows[0].count}`);
  } catch (err) {
    logger.error('[JOB:Notification] Error processing notifications', { error: err.message });
  }
}

module.exports = { processPendingNotifications };
