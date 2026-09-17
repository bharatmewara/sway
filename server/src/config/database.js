'use strict';

const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host:                    env.DB_HOST,
  port:                    env.DB_PORT,
  database:                env.DB_NAME,
  user:                    env.DB_USER,
  password:                env.DB_PASSWORD,
  max:                     20,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 2000,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  process.exit(-1);
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('[DB] Connection test failed:', err.message);
  else console.log('[DB] PostgreSQL connected at', res.rows[0].now);
});

module.exports = pool;
