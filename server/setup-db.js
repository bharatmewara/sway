/**
 * Database Setup Script
 * Run: node setup-db.js
 * This creates the database and all tables
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // First connect to postgres to create the database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // connect to default postgres db first
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbCheck = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME || 'sway_dating']
    );

    if (dbCheck.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${process.env.DB_NAME || 'sway_dating'}`);
      console.log(`✅ Database "${process.env.DB_NAME || 'sway_dating'}" created`);
    } else {
      console.log(`ℹ️  Database "${process.env.DB_NAME || 'sway_dating'}" already exists`);
    }

    await adminClient.end();

    // Now connect to the new database and run schema
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'sway_dating',
    });

    await dbClient.connect();
    console.log(`✅ Connected to ${process.env.DB_NAME || 'sway_dating'}`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    try {
      await dbClient.query(schema);
    } catch (err) {
      console.error('❌ Schema execution failed:', err.message);
      throw err;
    }

    console.log('✅ Schema applied successfully');
    console.log('');
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('Default admin credentials:');
    console.log('  Email: admin@sway.com');
    console.log('  Password: Admin@123');
    console.log('');
    console.log('Now run: npm run dev');

    await dbClient.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('');
    console.error('Please check your .env file:');
    console.error('  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
    process.exit(1);
  }
}

setupDatabase();
