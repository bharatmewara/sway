'use strict';

const pool = require('../config/database');
const swipeRepo = require('../repositories/swipe.repository');
const matchRepo = require('../repositories/match.repository');
const preferenceRepo = require('../repositories/preference.repository');

class MatchingService {
  async getDiscoveryQueue(userId, limit = 20) {
    const prefs = await preferenceRepo.getPreferences(userId) || {};
    const swipedIds = await swipeRepo.getSwipedUserIds(userId);
    const excludeIds = [userId, ...swipedIds];

    const minAge = prefs.preferred_age_min || 18;
    const maxAge = prefs.preferred_age_max || 65;

    let genderFilter = '';
    if (prefs.interested_in && ['male', 'female'].includes(prefs.interested_in)) {
      genderFilter = `AND u.gender = '${prefs.interested_in}'`;
    }

    const res = await pool.query(
      `SELECT u.id, u.uuid, u.username, u.gender, u.age, u.city, u.state, u.country,
              u.bio, u.profile_photo, u.interests, u.profession, u.education,
              u.verification_status, u.is_online
       FROM users u
       WHERE u.is_active = true
         AND u.is_banned = false
         AND u.id != ALL($1::int[])
         AND (u.age IS NULL OR (u.age >= $2 AND u.age <= $3))
         ${genderFilter}
       ORDER BY u.is_online DESC, u.created_at DESC
       LIMIT $4`,
      [excludeIds, minAge, maxAge, limit]
    );

    return res.rows;
  }

  async processSwipe(likerId, likedId, type, message = null) {
    await swipeRepo.recordSwipe(likerId, likedId, type, message);

    if (type === 'pass') {
      return { matched: false };
    }

    const isMutual = await swipeRepo.checkReciprocal(likerId, likedId);
    if (isMutual) {
      const match = await matchRepo.createMatch(likerId, likedId);
      return { matched: true, match };
    }

    return { matched: false };
  }

  async getMatches(userId) {
    return matchRepo.getMatches(userId);
  }

  async unmatch(userId, targetUserId) {
    return matchRepo.unmatch(userId, targetUserId);
  }
}

module.exports = new MatchingService();
