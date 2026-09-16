require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS children VARCHAR(50), 
      ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(50), 
      ADD COLUMN IF NOT EXISTS smoker VARCHAR(50), 
      ADD COLUMN IF NOT EXISTS personality_traits JSONB DEFAULT '[]'::jsonb, 
      ADD COLUMN IF NOT EXISTS sexual_practices JSONB DEFAULT '[]'::jsonb, 
      ADD COLUMN IF NOT EXISTS relationship_expectations JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('Migration successful');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

migrate();
