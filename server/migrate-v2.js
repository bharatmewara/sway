/**
 * SWAY Dating App - Database Migration v2
 * Applies schema_v2.sql to an existing database
 * Run: node migrate-v2.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sway_dating',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const schema = fs.readFileSync(path.join(__dirname, 'schema_v2.sql'), 'utf8');
    
    // Run the whole file as one transaction
    await client.query('BEGIN');
    try {
      await client.query(schema);
      await client.query('COMMIT');
      console.log('✅ Migration v2 applied successfully!');
      console.log('');
      console.log('New tables added:');
      console.log('  - user_privacy_settings');
      console.log('  - user_sessions, user_devices, login_alerts, otp_codes');
      console.log('  - likes, matches, favorites');
      console.log('  - blocks, mutes, followers');
      console.log('  - stories, story_views');
      console.log('  - gift_catalog, gifts');
      console.log('  - boosts, subscriptions, subscription_plans');
      console.log('  - call_logs, events, event_attendees');
      console.log('  - ai_suggestions, saved_searches');
      console.log('');
      console.log('Gift catalog seeded with 10 gifts.');
      console.log('Subscription plans seeded (Monthly/Quarterly/Yearly).');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
