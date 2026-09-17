'use strict';

const path = require('path');
// Enable resolving server dependencies (pg, dotenv)
module.paths.push(path.join(__dirname, '../server/node_modules'));

const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
};

async function ensureDatabaseExists() {
  const adminClient = new Client({
    ...config,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('[1/4] Connected to PostgreSQL server.');

    const dbName = process.env.DB_NAME || 'sway';
    const checkRes = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkRes.rowCount === 0) {
      console.log(`[2/4] Database "${dbName}" not found. Creating...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[2/4] Database "${dbName}" created.`);
    } else {
      console.log(`[2/4] Database "${dbName}" exists.`);
    }
  } finally {
    await adminClient.end();
  }
}

async function runMigrations() {
  const dbName = process.env.DB_NAME || 'sway';
  const client = new Client({
    ...config,
    database: dbName,
  });

  try {
    await client.connect();
    console.log(`[3/4] Connected to database "${dbName}". Running schema migration...`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schemaSql);
    console.log('[3/4] Schema migration executed successfully.');

    // Seed data
    const seedPath = path.join(__dirname, 'seeds/001_demo_seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('[4/4] Applying demo seed data...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedSql);
      console.log('[4/4] Demo seeds applied successfully.');
    }

    // Report table count
    const tableRes = await client.query(`
      SELECT count(*) FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    console.log(`\nMigration completed successfully! Total tables in "${dbName}": ${tableRes.rows[0].count}`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

(async () => {
  try {
    await ensureDatabaseExists();
    await runMigrations();
  } catch (err) {
    console.error('Fatal error during migration:', err.message);
    process.exit(1);
  }
})();
