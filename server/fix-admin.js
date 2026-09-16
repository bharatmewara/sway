const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function run() {
  const hash = await bcrypt.hash('Admin@123', 12);
  const c = new Client({ user: 'postgres', password: '12345', database: 'sway_dating' });
  await c.connect();
  await c.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@sway.com']);
  console.log('Admin password fixed');
  process.exit(0);
}

run();
