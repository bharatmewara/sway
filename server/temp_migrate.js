const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:12345@localhost:5432/sway_dating' });
pool.query("ALTER TABLE users ADD COLUMN preferred_gender VARCHAR(10) CHECK (preferred_gender IN ('male', 'female', 'both'))")
  .then(() => console.log('Successfully added preferred_gender column!'))
  .catch(err => {
    if (err.message.includes('already exists')) console.log('Column already exists');
    else console.error('Error:', err.message);
  })
  .finally(() => pool.end());
