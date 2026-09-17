'use strict';

const logger = require('../utils/logger');
const pool = require('../config/database');

async function cleanupStaleSessions() {
  try {
    const res = await pool.query(
      `DELETE FROM user_sessions WHERE expires_at < NOW() RETURNING id`
    );
    logger.info(`[JOB:Cleanup] Purged ${res.rowCount} expired sessions.`);
  } catch (err) {
    logger.error('[JOB:Cleanup] Error running session cleanup', { error: err.message });
  }
}

async function markInactiveUsersOffline() {
  try {
    const res = await pool.query(
      `UPDATE users SET is_online = false WHERE is_online = true AND last_seen < NOW() - INTERVAL '15 minutes' RETURNING id`
    );
    if (res.rowCount > 0) {
      logger.info(`[JOB:Cleanup] Marked ${res.rowCount} inactive users offline.`);
    }
  } catch (err) {
    logger.error('[JOB:Cleanup] Error running offline sweep', { error: err.message });
  }
}

module.exports = { cleanupStaleSessions, markInactiveUsersOffline };
