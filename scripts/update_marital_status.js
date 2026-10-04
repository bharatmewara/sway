'use strict';

/**
 * Sway Dating App - Update Marital Status by Age
 * 
 * Rules:
 *   - age < 28: marital_status = 'single'
 *   - age >= 28: marital_status = 'married'
 */

const path = require('path');
const fs = require('fs');

const serverNodeModules = path.resolve(__dirname, '../server/node_modules');
if (fs.existsSync(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

const rootEnvPath = path.resolve(__dirname, '../.env');
const serverEnvPath = path.resolve(__dirname, '../server/.env');

try {
  const dotenv = require('dotenv');
  if (fs.existsSync(serverEnvPath)) {
    dotenv.config({ path: serverEnvPath });
  } else if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  } else {
    dotenv.config();
  }
} catch (_) {}

let pool;
try {
  pool = require(path.resolve(__dirname, '../server/src/config/database'));
} catch (err) {
  const { Pool } = require('pg');
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'sway',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
  });
}

async function updateMaritalStatus() {
  console.log('Updating marital status based on age in users table...');

  // Update < 28 to 'single'
  const resSingle = await pool.query(`
    UPDATE users
    SET marital_status = 'single',
        updated_at = NOW()
    WHERE age IS NOT NULL AND age < 28
    RETURNING id, username, age, marital_status
  `);

  // Update >= 28 to 'married'
  const resMarried = await pool.query(`
    UPDATE users
    SET marital_status = 'married',
        updated_at = NOW()
    WHERE age IS NOT NULL AND age >= 28
    RETURNING id, username, age, marital_status
  `);

  console.log(`\n✅ Updated ${resSingle.rowCount} users with age < 28 to 'single'`);
  console.log(`✅ Updated ${resMarried.rowCount} users with age >= 28 to 'married'`);

  if (resMarried.rows.length > 0) {
    console.log('\nUsers set to married (age >= 28):');
    console.table(resMarried.rows);
  }

  // Show full distribution
  const summary = await pool.query(`
    SELECT marital_status, COUNT(*)::int AS total, MIN(age) AS min_age, MAX(age) AS max_age
    FROM users
    WHERE age IS NOT NULL
    GROUP BY marital_status
  `);
  console.log('\nCurrent summary by marital status:');
  console.table(summary.rows);

  await pool.end();
}

updateMaritalStatus()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error updating marital status:', err);
    process.exit(1);
  });
