'use strict';

const pool = require('../config/database');
const swipeRepo = require('../repositories/swipe.repository');
const matchRepo = require('../repositories/match.repository');
const reportRepo = require('../repositories/report.repository');
const preferenceRepo = require('../repositories/preference.repository');

class MatchingService {
  async getDiscoveryQueue(userId, limit = 20) {
    const prefs = await preferenceRepo.getPreferences(userId) || {};
    const swipedIds = await swipeRepo.getSwipedUserIds(userId);

    const viewerRes = await pool.query(
      'SELECT COALESCE(verified_gender, selected_gender, gender) AS effective_gender FROM users WHERE id = $1',
      [userId]
    );
    const viewerGender = (viewerRes.rows[0]?.effective_gender || '').toLowerCase();
    const oppositeGender = viewerGender === 'female' ? 'male' : 'female';

    const blockedRes = await pool.query(
      `SELECT blocked_id AS id FROM blocks WHERE blocker_id = $1
       UNION
       SELECT blocker_id AS id FROM blocks WHERE blocked_id = $1`,
      [userId]
    );
    const blockedIds = blockedRes.rows.map(r => r.id);
    const excludeIds = Array.from(new Set([userId, ...swipedIds, ...blockedIds]));

    const minAge = prefs.preferred_age_min || 18;
    const maxAge = prefs.preferred_age_max || 99;

    const res = await pool.query(
      `SELECT u.id, u.uuid, u.username, u.nickname, u.gender, u.verified_gender,
              u.age, u.city, u.state, u.country,
              u.bio, u.profile_photo, u.interests, u.profession, u.education,
              u.verification_status, u.is_online, u.last_seen
       FROM users u
       WHERE u.is_active = true
         AND COALESCE(u.is_banned, false) = false
         AND u.id != ALL($1::int[])
         AND LOWER(COALESCE(u.verified_gender, u.gender)) = $2
         AND (u.age IS NULL OR (u.age >= $3 AND u.age <= $4))
       ORDER BY u.is_online DESC, u.created_at DESC
       LIMIT $5`,
      [excludeIds, oppositeGender, minAge, maxAge, limit]
    );

    return res.rows;
  }

  async processSwipe(likerId, likedId, type = 'like', message = null) {
    if (likerId === likedId) {
      const err = new Error('You cannot like your own profile.');
      err.status = 400;
      throw err;
    }

    const isBlocked = await reportRepo.isBlocked(likerId, likedId);
    if (isBlocked) {
      const err = new Error('Cannot interact with this user (blocked).');
      err.status = 403;
      throw err;
    }

    if (type === 'like' || type === 'super_like') {
      const existing = await pool.query(
        `SELECT id, like_type FROM likes WHERE liker_id = $1 AND liked_id = $2 AND like_type IN ('like', 'super_like')`,
        [likerId, likedId]
      );
      if (existing.rows.length > 0) {
        const err = new Error('You have already liked this user.');
        err.status = 400;
        throw err;
      }
    }

    const record = await swipeRepo.recordSwipe(likerId, likedId, type, message);

    if (type === 'pass') {
      return { matched: false, record };
    }

    // Create notification for receiver
    try {
      const senderRes = await pool.query('SELECT username, nickname FROM users WHERE id = $1', [likerId]);
      const senderName = senderRes.rows[0]?.nickname || senderRes.rows[0]?.username || 'Someone';
      await pool.query(
        `INSERT INTO notifications (user_id, related_user_id, type, title, body, is_read, created_at)
         VALUES ($1, $2, 'LIKE_RECEIVED', 'New Like', $3, false, NOW())`,
        [likedId, likerId, `${senderName} liked your profile!`]
      );
    } catch (_) {}

    const isMutual = await swipeRepo.checkReciprocal(likerId, likedId);
    if (isMutual) {
      const match = await matchRepo.createMatch(likerId, likedId);
      return { matched: true, match, record };
    }

    return { matched: false, liked: true, record };
  }

  async getMatches(userId) {
    return matchRepo.getMatches(userId);
  }

  async unmatch(userId, targetUserId) {
    return matchRepo.unmatch(userId, targetUserId);
  }
}

module.exports = new MatchingService();
