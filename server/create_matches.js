const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  try {
    const adminRes = await pool.query("SELECT id FROM users WHERE username = 'admin' OR email = 'admin@sway.com'");
    if (adminRes.rows.length === 0) {
      console.log('Admin user not found!');
      process.exit(1);
    }
    const adminId = adminRes.rows[0].id;
    console.log('Admin ID:', adminId);

    // Pick 5 random verified users
    const usersRes = await pool.query("SELECT id, username FROM users WHERE id != $1 AND verification_status = 'verified' AND is_active = true ORDER BY RANDOM() LIMIT 5", [adminId]);
    const users = usersRes.rows;

    for (let u of users) {
      const otherId = u.id;
      // Insert likes
      await pool.query("INSERT INTO likes (liker_id, liked_id, like_type) VALUES ($1, $2, 'like') ON CONFLICT DO NOTHING", [adminId, otherId]);
      await pool.query("INSERT INTO likes (liker_id, liked_id, like_type) VALUES ($1, $2, 'like') ON CONFLICT DO NOTHING", [otherId, adminId]);

      // Insert match
      const uid1 = Math.min(adminId, otherId);
      const uid2 = Math.max(adminId, otherId);
      await pool.query("INSERT INTO matches (user1_id, user2_id, compatibility_score) VALUES ($1, $2, 95) ON CONFLICT DO NOTHING", [uid1, uid2]);

      // Insert conversation
      await pool.query("INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [uid1, uid2]);

      console.log(`Created match with ${u.username}`);
    }

    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
