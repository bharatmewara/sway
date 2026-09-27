'use strict';

const pool = require('../config/database');
const userRepo = require('../repositories/user.repository');
const reportRepo = require('../repositories/report.repository');
const preferenceRepo = require('../repositories/preference.repository');

class UserService {
  async getUser(id) {
    const user = await userRepo.findById(id);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }
    delete user.password_hash;
    delete user.photo_bytes;
    for (const k of ['personality_traits', 'sexual_practices', 'hobbies', 'relationship_expectations']) {
      if (typeof user[k] === 'string' && user[k].trim()) {
        try {
          user[k] = JSON.parse(user[k]);
        } catch {
          user[k] = user[k].split(',').map((s) => s.trim()).filter(Boolean);
        }
      } else if (!Array.isArray(user[k])) {
        user[k] = [];
      }
    }
    return user;
  }

  async getUserById(targetId, viewerId = null) {
    const user = await this.getUser(targetId);

    const rawPhotosRes = await pool.query(
      `SELECT id, user_id, photo_url, is_blurred, created_at
       FROM private_photos
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [targetId]
    );
    const rawPrivatePhotos = rawPhotosRes.rows || [];

    if (!viewerId || Number(viewerId) === Number(targetId)) {
      user.private_photos = rawPrivatePhotos.map((p) => ({
        ...p,
        is_locked: false,
        is_unlocked: true,
      }));
      user.private_photos_count = rawPrivatePhotos.length;
      user.private_photo_access_granted = true;
      return user;
    }

    // 1. Check Block Status (either direction)
    const blocked = await reportRepo.isBlocked(viewerId, targetId);
    if (blocked) {
      const err = new Error('This profile is unavailable due to blocking.');
      err.status = 403;
      throw err;
    }

    // 2. Check Opposite-Gender Visibility Rule
    const viewer = await userRepo.findById(viewerId);
    const isAdminViewer = viewer && (viewer.role === 'admin' || viewer.role === 'superadmin');

    if (viewer && !isAdminViewer) {
      const viewerGender = (viewer.verified_gender || viewer.selected_gender || viewer.gender || '').toLowerCase();
      const targetGender = (user.verified_gender || user.selected_gender || user.gender || '').toLowerCase();
      if (viewerGender && targetGender && viewerGender === targetGender) {
        const err = new Error('Gender-based visibility rule: You can only view opposite-gender profiles.');
        err.status = 403;
        throw err;
      }

      // 3. Record Profile Visit automatically & create notification (throttled to avoid spam)
      try {
        const existingVisit = await pool.query(
          `SELECT id FROM visits WHERE visitor_id = $1 AND visited_id = $2`,
          [viewerId, targetId]
        );
        if (existingVisit.rows.length > 0) {
          await pool.query(
            `UPDATE visits SET visited_at = NOW() WHERE visitor_id = $1 AND visited_id = $2`,
            [viewerId, targetId]
          );
        } else {
          await pool.query(
            `INSERT INTO visits (visitor_id, visited_id, visited_at) VALUES ($1, $2, NOW())`,
            [viewerId, targetId]
          );
        }

        const recentNotif = await pool.query(
          `SELECT id FROM notifications
           WHERE user_id = $1 AND related_user_id = $2
             AND UPPER(type) IN ('PROFILE_VISIT', 'VISIT')
             AND created_at > NOW() - INTERVAL '1 hour'
           LIMIT 1`,
          [targetId, viewerId]
        );
        if (recentNotif.rows.length === 0) {
          const visitorName = viewer.nickname || viewer.username || 'Someone';
          await pool.query(
            `INSERT INTO notifications (user_id, related_user_id, type, title, body, is_read, created_at)
             VALUES ($1, $2, 'PROFILE_VISIT', 'New Profile Visitor', $3, false, NOW())`,
            [targetId, viewerId, `${visitorName} visited your profile.`]
          );
        }
      } catch (_) {}

      // 4. Enforce Female Privacy Controls on the Backend
      if (targetGender === 'female' && viewerGender === 'male') {
        const permRes = await pool.query(
          `SELECT allow_instagram, allow_facebook, allow_telegram, allow_phone
           FROM female_privacy_permissions
           WHERE female_user_id = $1 AND male_user_id = $2`,
          [targetId, viewerId]
        );
        const perm = permRes.rows[0] || {
          allow_instagram: false,
          allow_facebook: false,
          allow_telegram: false,
          allow_phone: false,
        };

        user.privacy_permissions = {
          allow_instagram: !!perm.allow_instagram,
          allow_facebook: !!perm.allow_facebook,
          allow_telegram: !!perm.allow_telegram,
          allow_phone: !!perm.allow_phone,
        };

        if (!perm.allow_instagram) {
          user.instagram = null;
          user.instagram_restricted = true;
        }
        if (!perm.allow_facebook) {
          user.facebook = null;
          user.facebook_restricted = true;
        }
        if (!perm.allow_telegram) {
          user.telegram = null;
          user.telegram_restricted = true;
        }
        if (!perm.allow_phone) {
          user.phone = null;
          user.phone_restricted = true;
        }
      } else if (viewerGender === 'female' && targetGender === 'male') {
        // Female viewing a male profile: return her current privacy grants for this male user
        const myPermRes = await pool.query(
          `SELECT allow_instagram, allow_facebook, allow_telegram, allow_phone
           FROM female_privacy_permissions
           WHERE female_user_id = $1 AND male_user_id = $2`,
          [viewerId, targetId]
        );
        const myPerm = myPermRes.rows[0] || {
          allow_instagram: false,
          allow_facebook: false,
          allow_telegram: false,
          allow_phone: false,
        };
        user.my_privacy_grants_for_user = {
          allow_instagram: !!myPerm.allow_instagram,
          allow_facebook: !!myPerm.allow_facebook,
          allow_telegram: !!myPerm.allow_telegram,
          allow_phone: !!myPerm.allow_phone,
        };
      }
    }

    // 5. Fetch Interaction Status (Like, Crush, Private Photo Request & Access)
    const [likeRes, crushRes, reqRes, ppaRes, cfgRes] = await Promise.all([
      pool.query(
        `SELECT id, like_type, created_at FROM likes WHERE liker_id = $1 AND liked_id = $2 AND like_type IN ('like', 'super_like')`,
        [viewerId, targetId]
      ),
      pool.query(
        `SELECT id, created_at FROM crushes WHERE sender_id = $1 AND receiver_id = $2`,
        [viewerId, targetId]
      ),
      pool.query(
        `SELECT id, sender_id, receiver_id, status, COALESCE(connects_charged, credits_charged, 0) AS connects_charged, created_at, granted_at
         FROM connection_requests
         WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1`,
        [viewerId, targetId]
      ),
      pool.query(
        `SELECT id, status, COALESCE(connects_charged, credits_charged, 0) AS connects_charged, granted_at
         FROM private_photo_access
         WHERE requester_id = $1 AND owner_id = $2
         LIMIT 1`,
        [viewerId, targetId]
      ),
      pool.query(
        `SELECT COALESCE(private_photo_access_cost, private_photo_cost, 5) AS cost
         FROM admin_communication_settings
         ORDER BY id ASC LIMIT 1`
      ).catch(() => ({ rows: [{ cost: 5 }] })),
    ]);

    const reqRow = reqRes.rows[0];
    const ppaRow = ppaRes.rows[0];
    const photoCost = parseInt(cfgRes.rows[0]?.cost, 10) || 5;

    let normalizedReqStatus = 'NONE';
    if (reqRow) {
      const rawSt = String(reqRow.status || '').toUpperCase();
      if (['ACCEPTED', 'APPROVED', 'ACCESS_GRANTED'].includes(rawSt)) {
        normalizedReqStatus = 'ACCESS_GRANTED';
      } else {
        normalizedReqStatus = rawSt || 'NONE';
      }
    } else if (ppaRow) {
      const rawPpa = String(ppaRow.status || '').toUpperCase();
      if (['ACCEPTED', 'APPROVED', 'ACCESS_GRANTED'].includes(rawPpa)) {
        normalizedReqStatus = 'ACCESS_GRANTED';
      } else {
        normalizedReqStatus = rawPpa || 'NONE';
      }
    }

    const hasPrivatePhotoAccess =
      (normalizedReqStatus === 'ACCESS_GRANTED' && (!reqRow || Number(reqRow.sender_id) === Number(viewerId))) ||
      (ppaRow && ['ACCESS_GRANTED', 'APPROVED', 'ACCEPTED'].includes(String(ppaRow.status || '').toUpperCase()));

    // Enforce strict server-side Private Photo authorization
    user.private_photos_count = rawPrivatePhotos.length;
    user.private_photo_access_granted = !!hasPrivatePhotoAccess;
    user.private_photos = rawPrivatePhotos.map((p) => {
      if (hasPrivatePhotoAccess) {
        return {
          id: p.id,
          user_id: p.user_id,
          photo_url: p.photo_url,
          is_blurred: false,
          is_locked: false,
          is_unlocked: true,
          created_at: p.created_at,
        };
      }
      return {
        id: p.id,
        user_id: p.user_id,
        photo_url: null,
        is_blurred: true,
        is_locked: true,
        is_unlocked: false,
        created_at: p.created_at,
      };
    });

    user.interaction_status = {
      has_liked: likeRes.rows.length > 0,
      has_crushed: crushRes.rows.length > 0,
      request_status: normalizedReqStatus,
      request_id: reqRow?.id || null,
      request_sender_id: reqRow?.sender_id || null,
      request_receiver_id: reqRow?.receiver_id || null,
      private_photo_access_granted: !!hasPrivatePhotoAccess,
      private_photo_access_cost: photoCost,
      is_blocked: false,
    };

    return user;
  }

  async listUsers(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    return userRepo.findAll({ limit, offset, ...filters });
  }

  async updateLocation(userId, locationData) {
    return userRepo.updateLocation(userId, locationData);
  }

  async getCounts(userId) {
    try {
      const [msgRes, reqRes, notifRes] = await Promise.all([
        pool.query(
          `SELECT count(*)::int AS count
           FROM messages m
           WHERE m.receiver_id = $1 AND m.is_read = false
             AND m.sender_id NOT IN (
               SELECT blocked_id FROM blocks WHERE blocker_id = $1
               UNION
               SELECT blocker_id FROM blocks WHERE blocked_id = $1
             )`,
          [userId]
        ),
        pool.query(
          `SELECT count(*)::int AS count
           FROM connection_requests cr
           JOIN users u ON u.id = CASE WHEN cr.receiver_id = $1 THEN cr.sender_id ELSE cr.receiver_id END
           WHERE u.is_active = true
             AND (
               (cr.receiver_id = $1 AND UPPER(cr.status) = 'PENDING')
               OR (cr.sender_id = $1 AND UPPER(cr.status) = 'APPROVED_PENDING_CONNECTS')
             )
             AND u.id NOT IN (
               SELECT blocked_id FROM blocks WHERE blocker_id = $1
               UNION
               SELECT blocker_id FROM blocks WHERE blocked_id = $1
             )`,
          [userId]
        ),
        pool.query(
          `SELECT count(*)::int AS count
           FROM notifications n
           WHERE n.user_id = $1 AND n.is_read = false
             AND (
               n.related_user_id IS NULL
               OR n.related_user_id NOT IN (
                 SELECT blocked_id FROM blocks WHERE blocker_id = $1
                 UNION
                 SELECT blocker_id FROM blocks WHERE blocked_id = $1
               )
             )`,
          [userId]
        ),
      ]);
      return {
        messages: msgRes.rows[0]?.count || 0,
        requests: reqRes.rows[0]?.count || 0,
        notifications: notifRes.rows[0]?.count || 0,
      };
    } catch {
      return { messages: 0, requests: 0, notifications: 0 };
    }
  }

  async getPreferences(userId) {
    return preferenceRepo.getPreferences(userId);
  }

  async updatePreferences(userId, prefs) {
    return preferenceRepo.updatePreferences(userId, prefs);
  }

  async getPrivacy(userId) {
    const settings = await preferenceRepo.getPrivacySettings(userId);
    const permissions = await this.getFemalePrivacyPermissions(userId);
    return { ...settings, permissions };
  }

  async updatePrivacy(userId, settings) {
    return preferenceRepo.updatePrivacySettings(userId, settings);
  }

  async getFemalePrivacyPermissions(femaleUserId) {
    const grantedRes = await pool.query(
      `SELECT fp.*, u.username, u.nickname, u.profile_photo, u.age, u.city, u.state, u.is_online
       FROM female_privacy_permissions fp
       JOIN users u ON u.id = fp.male_user_id
       WHERE fp.female_user_id = $1
       ORDER BY fp.updated_at DESC`,
      [femaleUserId]
    );

    // Also get male users who interacted with this female user (visitors, chats, requests, crushes)
    const candidatesRes = await pool.query(
      `SELECT DISTINCT u.id, u.username, u.nickname, u.profile_photo, u.age, u.city, u.state, u.is_online
       FROM users u
       WHERE LOWER(COALESCE(u.verified_gender, u.gender)) = 'male'
         AND u.is_active = true
         AND u.id IN (
           SELECT visitor_id FROM visits WHERE visited_id = $1
           UNION
           SELECT sender_id FROM connection_requests WHERE receiver_id = $1
           UNION
           SELECT sender_id FROM crushes WHERE receiver_id = $1
           UNION
           SELECT liker_id FROM likes WHERE liked_id = $1
           UNION
           SELECT CASE WHEN user1_id = $1 THEN user2_id ELSE user1_id END FROM conversations WHERE user1_id = $1 OR user2_id = $1
         )
       LIMIT 30`,
      [femaleUserId]
    );

    return {
      granted: grantedRes.rows,
      interacted_male_users: candidatesRes.rows,
    };
  }

  async setFemalePrivacyPermission(femaleUserId, maleUserId, perms = {}) {
    if (!maleUserId) {
      const err = new Error('male_user_id is required.');
      err.status = 400;
      throw err;
    }
    const res = await pool.query(
      `INSERT INTO female_privacy_permissions (
         female_user_id, male_user_id,
         allow_instagram, allow_facebook, allow_telegram, allow_phone,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (female_user_id, male_user_id) DO UPDATE SET
         allow_instagram = COALESCE($3, female_privacy_permissions.allow_instagram),
         allow_facebook = COALESCE($4, female_privacy_permissions.allow_facebook),
         allow_telegram = COALESCE($5, female_privacy_permissions.allow_telegram),
         allow_phone = COALESCE($6, female_privacy_permissions.allow_phone),
         updated_at = NOW()
       RETURNING *`,
      [
        femaleUserId,
        maleUserId,
        perms.allow_instagram !== undefined ? !!perms.allow_instagram : false,
        perms.allow_facebook !== undefined ? !!perms.allow_facebook : false,
        perms.allow_telegram !== undefined ? !!perms.allow_telegram : false,
        perms.allow_phone !== undefined ? !!perms.allow_phone : false,
      ]
    );
    return res.rows[0];
  }

  async revokeFemalePrivacyPermission(femaleUserId, maleUserId) {
    await pool.query(
      `DELETE FROM female_privacy_permissions WHERE female_user_id = $1 AND male_user_id = $2`,
      [femaleUserId, maleUserId]
    );
    return true;
  }
}

module.exports = new UserService();
