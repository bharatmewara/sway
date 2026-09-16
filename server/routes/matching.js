'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Calculate compatibility score between two users (0–100)
function calcCompatibility(u1, u2) {
  let score = 50;
  if (u1.city === u2.city) score += 15;
  if (u1.interests && u2.interests) {
    const a = (u1.interests || '').toLowerCase().split(',').map(s => s.trim());
    const b = (u2.interests || '').toLowerCase().split(',').map(s => s.trim());
    const common = a.filter(x => b.includes(x)).length;
    score += Math.min(common * 5, 20);
  }
  if (u1.religion && u2.religion && u1.religion === u2.religion) score += 5;
  if (u1.drinking && u2.drinking && u1.drinking === u2.drinking) score += 5;
  if (u1.smoking && u2.smoking && u1.smoking === u2.smoking) score += 5;
  return Math.min(Math.round(score), 100);
}

// GET /api/matching/feed - Get discovery feed (unseen profiles)
router.get('/feed', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { limit = 20 } = req.query;
  try {
    // Get users not yet liked/passed, not blocked, not self
    const result = await pool.query(`
      SELECT u.id, u.username, u.nickname, u.age, u.gender, u.city, u.state,
             u.bio, u.profile_photo, u.is_online, u.last_seen, u.height, u.body_type,
             u.verification_status, u.is_premium, u.boost_active_until,
             u.interests, u.religion, u.drinking, u.smoking, u.marital_status,
             u.looking_for, u.latitude, u.longitude,
             COALESCE(ps.hide_age, false) as hide_age,
             COALESCE(ps.hide_distance, false) as hide_distance
      FROM users u
      LEFT JOIN user_privacy_settings ps ON ps.user_id = u.id
      WHERE u.id != $1
        AND u.is_active = true
        AND u.is_banned = false
        AND u.verification_status = 'verified'
        AND u.id NOT IN (
          SELECT liked_id FROM likes WHERE liker_id = $1
        )
        AND u.id NOT IN (
          SELECT blocked_id FROM blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM blocks WHERE blocked_id = $1
        )
      ORDER BY
        CASE WHEN u.boost_active_until > NOW() THEN 0 ELSE 1 END,
        u.is_premium DESC,
        u.is_online DESC,
        RANDOM()
      LIMIT $2
    `, [userId, limit]);

    // Attach compatibility score to each
    const me = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const myProfile = me.rows[0];
    const feed = result.rows.map(u => ({
      ...u,
      compatibility: calcCompatibility(myProfile, u),
      profile_photo_url: u.profile_photo ? `/uploads/profiles/${u.profile_photo}` : null,
    }));

    res.json({ feed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/matching/like - Like a user
router.post('/like', verifyToken, async (req, res) => {
  const likerId = req.user.id;
  const { liked_id, like_type = 'like', message } = req.body;
  if (!liked_id) return res.status(400).json({ error: 'liked_id required' });
  
  try {
    // Check if already liked
    const existing = await pool.query('SELECT id FROM likes WHERE liker_id=$1 AND liked_id=$2', [likerId, liked_id]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Already liked' });

    // Super like costs 3 credits for males
    let creditsCharged = 0;
    if (like_type === 'super_like' && req.user.gender === 'male') {
      const user = await pool.query('SELECT connect_credits FROM users WHERE id=$1', [likerId]);
      if (user.rows[0].connect_credits < 3) return res.status(402).json({ error: 'Not enough credits' });
      await pool.query('UPDATE users SET connect_credits = connect_credits - 3 WHERE id=$1', [likerId]);
      await pool.query(`INSERT INTO credit_logs (user_id, action, credits_delta, description)
        VALUES ($1, 'super_like_sent', -3, $2)`, [likerId, `Super like to user ${liked_id}`]);
      creditsCharged = 3;
    }

    // Insert like
    await pool.query(`
      INSERT INTO likes (liker_id, liked_id, like_type, message, credits_charged)
      VALUES ($1, $2, $3, $4, $5)
    `, [likerId, liked_id, like_type, message || null, creditsCharged]);

    // Update total_likes_received
    await pool.query('UPDATE users SET total_likes_received = total_likes_received + 1 WHERE id=$1', [liked_id]);

    // Check for mutual match
    let isMatch = false;
    let matchData = null;
    if (like_type !== 'pass') {
      const mutualCheck = await pool.query(
        'SELECT id FROM likes WHERE liker_id=$1 AND liked_id=$2 AND like_type != $3',
        [liked_id, likerId, 'pass']
      );
      if (mutualCheck.rows.length > 0) {
        // Create match
        const uid1 = Math.min(likerId, liked_id);
        const uid2 = Math.max(likerId, liked_id);
        const me = await pool.query('SELECT * FROM users WHERE id=$1', [likerId]);
        const them = await pool.query('SELECT * FROM users WHERE id=$1', [liked_id]);
        const compat = calcCompatibility(me.rows[0], them.rows[0]);

        await pool.query(`
          INSERT INTO matches (user1_id, user2_id, compatibility_score)
          VALUES ($1, $2, $3) ON CONFLICT (user1_id, user2_id) DO NOTHING
        `, [uid1, uid2, compat]);

        // Create conversation if not exists
        await pool.query(`
          INSERT INTO conversations (user1_id, user2_id)
          VALUES ($1, $2) ON CONFLICT (user1_id, user2_id) DO NOTHING
        `, [uid1, uid2]);

        // Notify both
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, body, related_user_id)
          VALUES ($1, 'match', 'New Match! 🎉', 'You matched with someone!', $2),
                 ($3, 'match', 'New Match! 🎉', 'You matched with someone!', $4)
        `, [likerId, liked_id, liked_id, likerId]);

        isMatch = true;
        matchData = { compatibility: compat };
      } else {
        // Notify of like (premium: see who liked you)
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, body, related_user_id)
          VALUES ($1, 'like', 'Someone liked you! 💛', 'Check who liked your profile', $2)
        `, [liked_id, likerId]);
      }
    }

    res.json({ success: true, isMatch, match: matchData, like_type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matching/matches - Get mutual matches
router.get('/matches', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END AS match_user_id,
        u.username, u.nickname, u.age, u.city, u.profile_photo, u.is_online, u.last_seen,
        u.gender, u.verification_status, u.is_premium,
        c.id as conversation_id
      FROM matches m
      JOIN users u ON u.id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
      LEFT JOIN conversations c ON (
        (c.user1_id = m.user1_id AND c.user2_id = m.user2_id) OR
        (c.user1_id = m.user2_id AND c.user2_id = m.user1_id)
      )
      WHERE (m.user1_id = $1 OR m.user2_id = $1)
        AND m.is_active = true
        AND u.is_active = true
      ORDER BY m.matched_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json({ matches: result.rows.map(r => ({ ...r, profile_photo_url: r.profile_photo ? `/uploads/profiles/${r.profile_photo}` : null })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matching/who-liked-me - Premium feature
router.get('/who-liked-me', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const isPremium = req.user.is_premium;
    const result = await pool.query(`
      SELECT l.id, l.like_type, l.created_at,
        CASE WHEN $2 THEN u.id ELSE NULL END as user_id,
        CASE WHEN $2 THEN u.username ELSE 'Hidden' END as username,
        CASE WHEN $2 THEN u.profile_photo ELSE NULL END as profile_photo,
        CASE WHEN $2 THEN u.age ELSE NULL END as age,
        CASE WHEN $2 THEN u.city ELSE NULL END as city
      FROM likes l
      JOIN users u ON u.id = l.liker_id
      WHERE l.liked_id = $1 AND l.like_type != 'pass'
      ORDER BY l.created_at DESC
      LIMIT 50
    `, [userId, isPremium]);
    res.json({ likes: result.rows, is_premium: isPremium });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/matching/favorite - Toggle favorite
router.post('/favorite', verifyToken, async (req, res) => {
  const { user_id } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM favorites WHERE user_id=$1 AND favorited_id=$2', [req.user.id, user_id]);
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM favorites WHERE user_id=$1 AND favorited_id=$2', [req.user.id, user_id]);
      return res.json({ favorited: false });
    }
    await pool.query('INSERT INTO favorites (user_id, favorited_id) VALUES ($1,$2)', [req.user.id, user_id]);
    res.json({ favorited: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matching/favorites
router.get('/favorites', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.age, u.city, u.profile_photo, u.is_online, f.created_at
      FROM favorites f JOIN users u ON u.id = f.favorited_id
      WHERE f.user_id = $1 AND u.is_active = true
      ORDER BY f.created_at DESC
    `, [req.user.id]);
    res.json({ favorites: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matching/ai-suggestions
router.get('/ai-suggestions', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // Check for today's suggestions
    const today = new Date().toISOString().split('T')[0];
    let suggestions = await pool.query(`
      SELECT s.*, u.username, u.age, u.city, u.profile_photo, u.is_online
      FROM ai_suggestions s JOIN users u ON u.id = s.suggested_user_id
      WHERE s.user_id = $1 AND s.date = $2
      ORDER BY s.compatibility_score DESC
    `, [userId, today]);

    if (suggestions.rows.length === 0) {
      // Generate suggestions (simplified AI logic)
      const me = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
      const myProfile = me.rows[0];
      
      const candidates = await pool.query(`
        SELECT u.* FROM users u
        WHERE u.id != $1
          AND u.is_active = true AND u.is_banned = false
          AND u.verification_status = 'verified'
          AND u.id NOT IN (SELECT liked_id FROM likes WHERE liker_id = $1)
          AND u.id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $1)
        ORDER BY
          CASE WHEN u.city = $2 THEN 0 ELSE 1 END,
          u.is_online DESC
        LIMIT 100
      `, [userId, myProfile.city]);

      // Score and insert top 10
      const scored = candidates.rows
        .map(u => ({ user: u, score: calcCompatibility(myProfile, u) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      for (const { user, score } of scored) {
        await pool.query(`
          INSERT INTO ai_suggestions (user_id, suggested_user_id, compatibility_score, reasons, date)
          VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
        `, [userId, user.id, score, JSON.stringify({ 
          same_city: user.city === myProfile.city,
          shared_interests: true 
        }), today]);
      }

      suggestions = await pool.query(`
        SELECT s.*, u.username, u.age, u.city, u.profile_photo, u.is_online
        FROM ai_suggestions s JOIN users u ON u.id = s.suggested_user_id
        WHERE s.user_id = $1 AND s.date = $2
        ORDER BY s.compatibility_score DESC
      `, [userId, today]);
    }

    res.json({ suggestions: suggestions.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
