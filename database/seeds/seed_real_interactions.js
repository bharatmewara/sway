const pool = require('d:/sway/server/src/config/database');

async function seedRealInteractions() {
  console.log('Seeding real interactions into PostgreSQL...');

  // Get all users
  const usersRes = await pool.query('SELECT id, username FROM users ORDER BY id ASC');
  const users = usersRes.rows;
  if (users.length < 2) {
    console.log('Not enough users to seed interactions.');
    process.exit(0);
  }

  const admin = users[0]; // id: 1
  const memberUsers = users.slice(1); // other members

  console.log(`Setting up interactions for user ${admin.username} (id: ${admin.id}) with ${memberUsers.length} members...`);

  // 1. Seed Real Visits
  for (let i = 0; i < Math.min(memberUsers.length, 8); i++) {
    const visitor = memberUsers[i];
    await pool.query(
      `INSERT INTO visits (visitor_id, visited_id, visited_at)
       VALUES ($1, $2, NOW() - interval '${i * 35 + 10} minutes')`,
      [visitor.id, admin.id]
    );
  }
  console.log('✓ Visits seeded.');

  // 2. Seed Real Connection Requests (Pending)
  const reqSenders = memberUsers.slice(0, 3);
  for (let i = 0; i < reqSenders.length; i++) {
    const sender = reqSenders[i];
    await pool.query(
      `INSERT INTO connection_requests (sender_id, receiver_id, status, message, created_at)
       VALUES ($1, $2, 'pending', $3, NOW() - interval '${i * 2 + 1} hours')
       ON CONFLICT DO NOTHING`,
      [sender.id, admin.id, `Hi ${admin.username}, I saw your profile and loved your vibe. Let's connect!`]
    );
  }
  console.log('✓ Connection requests seeded.');

  // 3. Seed Real Conversations and Messages
  const chatPartners = memberUsers.slice(3, 7);
  for (let i = 0; i < chatPartners.length; i++) {
    const partner = chatPartners[i];
    const u1 = Math.min(admin.id, partner.id);
    const u2 = Math.max(admin.id, partner.id);

    // Insert conversation
    const convRes = await pool.query(
      `INSERT INTO conversations (user1_id, user2_id, created_at, last_message_at)
       VALUES ($1, $2, NOW() - interval '2 days', NOW() - interval '${i * 45 + 5} minutes')
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [u1, u2]
    );

    let convId = convRes.rows[0]?.id;
    if (!convId) {
      const existing = await pool.query('SELECT id FROM conversations WHERE user1_id = $1 AND user2_id = $2', [u1, u2]);
      convId = existing.rows[0]?.id;
    }

    if (convId) {
      // Add previous message from admin
      await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, is_read, created_at)
         VALUES ($1, $2, $3, 'Hey there! How is your week going?', true, NOW() - interval '${i * 60 + 90} minutes')`,
        [convId, admin.id, partner.id]
      );

      // Add latest message from partner
      const replies = [
        'Hey! It is going great, thank you for asking :) How about yours?',
        'I saw your photos from Jaipur, they look amazing!',
        'Would love to grab coffee sometime this weekend.',
        'Always good to hear from you!'
      ];
      const replyMsg = replies[i % replies.length];

      const msgRes = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - interval '${i * 45 + 5} minutes')
         RETURNING id`,
        [convId, partner.id, admin.id, replyMsg, i > 1]
      );

      const lastMsgId = msgRes.rows[0]?.id;
      if (lastMsgId) {
        await pool.query(
          `UPDATE conversations SET last_message_id = $1, last_message_at = NOW() - interval '${i * 45 + 5} minutes' WHERE id = $2`,
          [lastMsgId, convId]
        );
      }
    }
  }
  console.log('✓ Conversations & messages seeded.');

  // 4. Seed Crushes
  for (let i = 0; i < Math.min(memberUsers.length, 3); i++) {
    const target = memberUsers[i];
    await pool.query(
      `INSERT INTO crushes (sender_id, receiver_id, is_mutual, created_at)
       VALUES ($1, $2, $3, NOW() - interval '${i + 1} days')
       ON CONFLICT DO NOTHING`,
      [admin.id, target.id, i === 0]
    );
  }
  console.log('✓ Crushes seeded.');

  console.log('All real interaction data seeded successfully!');
  process.exit(0);
}

seedRealInteractions().catch(err => {
  console.error('Error seeding interactions:', err);
  process.exit(1);
});
