'use strict';

const logger = require('../utils/logger');
const pool = require('../config/database');

async function recomputeActiveMatchMetrics() {
  try {
    const res = await pool.query(
      `SELECT COUNT(*) FROM matches WHERE is_active = true AND matched_at > NOW() - INTERVAL '30 days'`
    );
    logger.info(`[JOB:Matching] Active matches in last 30 days: ${res.rows[0].count}`);
  } catch (err) {
    logger.error('[JOB:Matching] Error evaluating match metrics', { error: err.message });
  }
}

module.exports = { recomputeActiveMatchMetrics };
