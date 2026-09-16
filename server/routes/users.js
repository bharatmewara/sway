'use strict';

const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// All routes require auth
router.use(verifyToken);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeInt = (val, def) => {
  const n = parseInt(val, 10);
  return isNaN(n) ? def : n;
};

const safeFloat = (val, def) => {
  const n = parseFloat(val);
  return isNaN(n) ? def : n;
};

// ─── GET /members ─────────────────────────────────────────────────────────────

router.get('/members', async (req, res) => {
  try {
    const page      = safeInt(req.query.page, 1);
    const limit     = Math.min(safeInt(req.query.limit, 20), 100);
    const offset    = (page - 1) * limit;

    const { city, state, gender, marital_status, is_online } = req.query;
    const min_age   = safeInt(req.query.min_age, 18);
    const max_age   = safeInt(req.query.max_age, 100);
    const lat       = safeFloat(req.query.lat, null);
    const lon       = safeFloat(req.query.lon, null);
    const radius    = safeFloat(req.query.radius, null);

    const conditions = [
      `u.is_active = true`,
      `u.is_banned = false`,
      `u.id != $1`,
      `DATE_PART('year', AGE(u.date_of_birth)) BETWEEN $2 AND $3`,
    ];
    const params = [req.user.id, min_age, max_age];
    let paramIdx = 4;

    if (city) {
      conditions.push(`u.city ILIKE $${paramIdx}`);
      params.push(`%${city}%`);
      paramIdx++;
    }
    if (state) {
      conditions.push(`u.state ILIKE $${paramIdx}`);
      params.push(`%${state}%`);
      paramIdx++;
    }
    if (gender) {
      conditions.push(`u.gender = $${paramIdx}`);
      params.push(gender);
      paramIdx++;
    } else if (req.user && req.user.gender) {
      const oppositeGender = req.user.gender === 'male' ? 'female' : 'male';
      conditions.push(`u.gender = $${paramIdx}`);
      params.push(oppositeGender);
      paramIdx++;
    }
    if (is_online === 'true') {
      conditions.push(`u.is_online = true`);
    }
    if (marital_status) {
      conditions.push(`u.marital_status = $${paramIdx}`);
      params.push(marital_status);
      paramIdx++;
    }
    if (lat !== null && lon !== null && radius !== null) {
      conditions.push(
        `calculate_distance($${paramIdx}, $${paramIdx + 1}, u.latitude, u.longitude) <= $${paramIdx + 2}`
      );
      params.push(lat, lon, radius);
      paramIdx += 3;
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM users u
       WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const usersResult = await pool.query(
      `SELECT u.id, u.username, u.gender, u.date_of_birth as dob, u.city, u.state, u.country,
              u.profile_photo, u.is_online, u.last_seen, u.verification_status,
              u.bio, u.marital_status, u.height, u.body_type, u.looking_for,
              DATE_PART('year', AGE(u.date_of_birth)) AS age
       FROM users u
       WHERE ${whereClause}
       ORDER BY u.is_online DESC, u.last_seen DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      users: usersResult.rows,
      total,
      pages,
      page,
    });
  } catch (err) {
    console.error('[USERS] /members error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching members.' });
  }
});

// ─── GET /nearby ──────────────────────────────────────────────────────────────

router.get('/nearby', async (req, res) => {
  try {
    const radius = safeFloat(req.query.radius, 50);
    const page   = safeInt(req.query.page, 1);
    const limit  = Math.min(safeInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;

    // Get current user's location from profile
    const profileResult = await pool.query(
      `SELECT latitude, longitude FROM profiles WHERE user_id = $1`,
      [req.user.id]
    );

    if (profileResult.rows.length === 0 || !profileResult.rows[0].latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please update your location in your profile to use nearby feature.',
      });
    }

    const { latitude, longitude } = profileResult.rows[0];

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM users u
       WHERE u.id != $1
         AND u.is_active = true
         AND u.is_banned = false
         AND p.latitude IS NOT NULL
         AND p.longitude IS NOT NULL
         AND calculate_distance($2, $3, p.latitude, p.longitude) <= $4`,
      [req.user.id, latitude, longitude, radius]
    );

    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const usersResult = await pool.query(
      `SELECT u.id, u.username, u.gender, u.date_of_birth as dob, u.city, u.state, u.country,
              u.profile_photo, u.is_online, u.last_seen, u.verification_status,
              u.bio, u.marital_status, u.height, u.body_type, u.looking_for,
              DATE_PART('year', AGE(u.date_of_birth)) AS age,
              calculate_distance($2, $3, p.latitude, p.longitude) AS distance_km
       FROM users u
       WHERE u.id != $1
         AND u.is_active = true
         AND u.is_banned = false
         AND p.latitude IS NOT NULL
         AND p.longitude IS NOT NULL
         AND calculate_distance($2, $3, p.latitude, p.longitude) <= $4
       ORDER BY distance_km ASC
       LIMIT $5 OFFSET $6`,
      [req.user.id, latitude, longitude, radius, limit, offset]
    );

    return res.status(200).json({
      success: true,
      users: usersResult.rows,
      total,
      pages,
      page,
    });
  } catch (err) {
    console.error('[USERS] /nearby error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching nearby users.' });
  }
});

// ─── GET /profile/:id ─────────────────────────────────────────────────────────

router.get('/profile/:id', async (req, res) => {
  try {
    const targetId = safeInt(req.params.id, null);
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.gender, u.date_of_birth as dob, u.city, u.state, u.country,
              u.profile_photo, u.is_online, u.last_seen, u.verification_status, u.created_at,
              u.bio, u.marital_status, u.height, u.body_type, u.education, u.profession,
              u.looking_for, u.interests, u.preferred_age_min, u.preferred_age_max,
              u.preferred_distance, u.preferred_gender,
              u.children, u.ethnicity, u.smoker, u.personality_traits, u.sexual_practices, u.relationship_expectations,
              DATE_PART('year', AGE(u.date_of_birth)) AS age
       FROM users u
       WHERE u.id = $1 AND u.is_active = true AND u.is_banned = false`,
      [targetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = result.rows[0];

    // Log visit (avoid self-visit and duplicate within same hour)
    if (req.user.id !== targetId) {
      await pool.query(
        `INSERT INTO visits (visitor_id, visited_id, visited_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT DO NOTHING`,
        [req.user.id, targetId]
      ).catch(() => {
        // Non-critical: log visit best-effort
        pool.query(
          `INSERT INTO visits (visitor_id, visited_id, visited_at) VALUES ($1, $2, NOW())`,
          [req.user.id, targetId]
        ).catch(() => {});
      });

      // Create notification for profile owner (best-effort)
      pool.query(
        `INSERT INTO notifications (user_id, type, from_user_id, message, is_read, created_at)
         VALUES ($1, 'profile_visit', $2, 'Someone visited your profile.', false, NOW())`,
        [targetId, req.user.id]
      ).catch(() => {});
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[USERS] /profile/:id error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
});

// ─── PUT /profile ─────────────────────────────────────────────────────────────

router.put('/profile', async (req, res) => {
  try {
    const {
      bio, city, state, country, marital_status, height, body_type,
      education, profession, looking_for, interests,
      preferred_age_min, preferred_age_max, preferred_distance, preferred_gender,
      latitude, longitude, children, ethnicity, smoker, 
      personality_traits, sexual_practices, relationship_expectations
    } = req.body;

    // Update users table fields
    const userUpdateFields = [];
    const userParams = [];
    let userIdx = 1;

    const addField = (val, col) => {
      if (val !== undefined) {
        userUpdateFields.push(`${col} = $${userIdx++}`);
        userParams.push(val);
      }
    };

    const addJsonField = (val, col) => {
      if (val !== undefined) {
        userUpdateFields.push(`${col} = $${userIdx++}::jsonb`);
        userParams.push(JSON.stringify(val));
      }
    };

    addField(city, 'city');
    addField(state, 'state');
    addField(country, 'country');
    addField(bio, 'bio');
    addField(marital_status, 'marital_status');
    addField(height, 'height');
    addField(body_type, 'body_type');
    addField(education, 'education');
    addField(profession, 'profession');
    addField(looking_for, 'looking_for');
    addField(interests, 'interests');
    addField(preferred_age_min, 'preferred_age_min');
    addField(preferred_age_max, 'preferred_age_max');
    addField(preferred_distance, 'preferred_distance');
    addField(preferred_gender, 'preferred_gender');
    addField(latitude, 'latitude');
    addField(children, 'children');
    addField(ethnicity, 'ethnicity');
    addField(smoker, 'smoker');
    addJsonField(personality_traits, 'personality_traits');
    addJsonField(sexual_practices, 'sexual_practices');
    addJsonField(relationship_expectations, 'relationship_expectations');
    addField(longitude, 'longitude');

    if (userUpdateFields.length > 0) {
      userUpdateFields.push(`updated_at = NOW()`);
      userParams.push(req.user.id);
      await pool.query(
        `UPDATE users SET ${userUpdateFields.join(', ')} WHERE id = $${userIdx}`,
        userParams
      );
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('[USERS] PUT /profile error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

// ─── POST /profile/photo ──────────────────────────────────────────────────────

router.post('/profile/photo', uploadProfile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded.' });
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    await pool.query(
      `UPDATE users SET profile_photo = $1, updated_at = NOW() WHERE id = $2`,
      [photoUrl, req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile photo updated.',
      photo_url: photoUrl,
    });
  } catch (err) {
    console.error('[USERS] /profile/photo error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error uploading photo.' });
  }
});

// ─── GET /notifications ───────────────────────────────────────────────────────

router.get('/notifications', async (req, res) => {
  try {
    const page  = safeInt(req.query.page, 1);
    const limit = Math.min(safeInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT n.id, n.type, n.body AS message, n.is_read, n.created_at,
              u.id AS from_user_id, u.username AS from_username, u.profile_photo AS from_photo
       FROM notifications n
       LEFT JOIN users u ON u.id = n.related_user_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const unreadCount = await pool.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      notifications: result.rows,
      unread_count: parseInt(unreadCount.rows[0].count, 10),
    });
  } catch (err) {
    console.error('[USERS] /notifications error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
  }
});

// ─── PUT /notifications/:id/read ─────────────────────────────────────────────

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notifId = safeInt(req.params.id, null);
    if (!notifId) return res.status(400).json({ success: false, message: 'Invalid notification ID.' });

    const result = await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id`,
      [notifId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('[USERS] /notifications/:id/read error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /notifications/read-all ─────────────────────────────────────────────

router.put('/notifications/read-all', async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Notifications marked as read.' });
  } catch (err) {
    console.error('[USERS] /notifications/read error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error marking notifications.' });
  }
});

// ─── GET /counts ──────────────────────────────────────────────────────────────
// Get aggregated unread counts for badges
router.get('/counts', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Unread messages
    const msgCount = await pool.query(
      `SELECT COUNT(*) AS count FROM messages m 
       JOIN conversations c ON m.conversation_id = c.id 
       WHERE m.sender_id != $1 AND (c.user1_id = $1 OR c.user2_id = $1) AND m.is_read = false`,
      [userId]
    );
    
    // Pending requests
    const reqCount = await pool.query(
      `SELECT COUNT(*) AS count FROM connection_requests 
       WHERE receiver_id = $1 AND status = 'pending'`,
      [userId]
    );
    
    // Unread notifications
    const notifCount = await pool.query(
      `SELECT COUNT(*) AS count FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      counts: {
        messages: parseInt(msgCount.rows[0].count, 10),
        requests: parseInt(reqCount.rows[0].count, 10),
        notifications: parseInt(notifCount.rows[0].count, 10)
      }
    });
  } catch (err) {
    console.error('[USERS] /counts error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching counts.' });
  }
});

module.exports = router;
