'use strict';

const userService = require('../services/user.service');
const { ok, fail } = require('../utils/response');

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const connStatus = String(req.query.connection_status || '').toLowerCase();
    const isOnline =
      req.query.is_online !== undefined
        ? req.query.is_online === 'true'
        : connStatus === 'online'
          ? true
          : null;
    const verifiedOnly = connStatus === 'verified' || req.query.verified === 'true';
    const minAge = req.query.min_age || req.query.minAge || null;
    const maxAge = req.query.max_age || req.query.maxAge || null;
    const maritalStatus = req.query.marital_status || req.query.maritalStatus || null;
    const relationshipType = req.query.relationship_type || req.query.relationshipType || null;
    const gender = req.query.gender || null;
    const city = req.query.city || req.query.location || null;
    const latitude = req.query.latitude ?? req.query.lat ?? null;
    const longitude = req.query.longitude ?? req.query.lng ?? null;
    const maxDistanceKm = req.query.distance ?? req.query.radius ?? req.query.max_distance ?? null;
    const nearbyOnly = req.query.nearby === 'true' || req.path === '/nearby';
    const excludeId = req.user?.id || null;

    if (excludeId && latitude !== null && longitude !== null && latitude !== '' && longitude !== '') {
      await userService.updateLocation(excludeId, { latitude, longitude }).catch(() => {});
    }

    const users = await userService.listUsers(page, limit, {
      isOnline,
      verifiedOnly,
      minAge,
      maxAge,
      maritalStatus,
      relationshipType,
      gender,
      city,
      excludeId,
      latitude,
      longitude,
      maxDistanceKm,
      nearbyOnly,
    });
    return ok(res, { users, page, limit });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.getNearbyUsers = async (req, res) => {
  req.query.nearby = 'true';
  if (!req.query.distance && !req.query.radius) {
    req.query.distance = '100';
  }
  return exports.getUsers(req, res);
};

exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, lat, lng, city, state, country } = req.body || {};
    const updated = await userService.updateLocation(req.user.id, {
      latitude: latitude ?? lat,
      longitude: longitude ?? lng,
      city,
      state,
      country,
    });
    return ok(res, {
      message: 'Location updated successfully.',
      location: updated,
    });
  } catch (err) {
    return fail(res, err.message, err.status || 400);
  }
};

exports.getCounts = async (req, res) => {
  try {
    const counts = await userService.getCounts(req.user.id);
    return res.json({ success: true, counts });
  } catch (err) {
    return res.json({ success: true, counts: { messages: 0, requests: 0, notifications: 0 } });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return fail(res, 'Invalid user ID.', 400);
    const user = await userService.getUserById(id, req.user?.id);
    if (req.user?.id && Number(req.user.id) !== Number(id)) {
      req.app.get('io')?.to(`user_${id}`).emit('new_notification', {
        type: 'visit',
        related_user_id: req.user.id,
        sender_username: req.user.username,
      });
    }
    return ok(res, { user });
  } catch (err) {
    return fail(res, err.message, err.status || 404);
  }
};

exports.sendLike = async (req, res) => {
  try {
    const matchingService = require('../services/matching.service');
    const targetId = parseInt(req.params.id || req.body.target_user_id || req.body.receiver_id, 10);
    if (isNaN(targetId)) return fail(res, 'Target user ID is required.', 400);
    const result = await matchingService.processSwipe(req.user.id, targetId, 'like');
    req.app.get('io')?.to(`user_${targetId}`).emit('new_notification', {
      type: 'like',
      related_user_id: req.user.id,
      sender_username: req.user.username,
    });
    return ok(res, { message: result.matched ? "It's a match!" : 'Like sent successfully!', ...result });
  } catch (err) {
    return fail(res, err.message, err.status || 400);
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const preferences = await userService.getPreferences(req.user.id);
    return ok(res, { preferences });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const preferences = await userService.updatePreferences(req.user.id, req.body);
    return ok(res, { message: 'Preferences updated.', preferences });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

exports.getPrivacy = async (req, res) => {
  try {
    const privacy = await userService.getPrivacy(req.user.id);
    return ok(res, { privacy });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const privacy = await userService.updatePrivacy(req.user.id, req.body);
    return ok(res, { message: 'Privacy settings updated.', privacy });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

exports.getPrivacyPermissions = async (req, res) => {
  try {
    const data = await userService.getFemalePrivacyPermissions(req.user.id);
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.setPrivacyPermission = async (req, res) => {
  try {
    const maleUserId = parseInt(req.params.maleUserId || req.body.male_user_id, 10);
    if (isNaN(maleUserId)) return fail(res, 'Valid male_user_id is required.', 400);
    const permission = await userService.setFemalePrivacyPermission(req.user.id, maleUserId, req.body);
    return ok(res, { message: 'Privacy permissions updated for user.', permission });
  } catch (err) {
    return fail(res, err.message, err.status || 400);
  }
};

exports.revokePrivacyPermission = async (req, res) => {
  try {
    const maleUserId = parseInt(req.params.maleUserId, 10);
    if (isNaN(maleUserId)) return fail(res, 'Valid maleUserId is required.', 400);
    await userService.revokeFemalePrivacyPermission(req.user.id, maleUserId);
    return ok(res, { message: 'Privacy permissions revoked for user.' });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const pool = require('../config/database');
    const { username, nickname, email, phone, city, state, country } = req.body || {};

    if (email) {
      const dupEmail = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email.trim(), req.user.id]);
      if (dupEmail.rows.length > 0) {
        return fail(res, 'Email is already in use by another account.', 409);
      }
    }
    if (username) {
      const dupUser = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2', [username.trim(), req.user.id]);
      if (dupUser.rows.length > 0) {
        return fail(res, 'Username is already taken.', 409);
      }
    }

    const upd = await pool.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           nickname = COALESCE($2, nickname),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           city = COALESCE($5, city),
           state = COALESCE($6, state),
           country = COALESCE($7, country),
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, username, nickname, email, phone, city, state, country, gender, verified_gender, verification_status, connect_credits`,
      [
        username ? username.trim() : null,
        nickname !== undefined ? nickname : null,
        email ? email.trim().toLowerCase() : null,
        phone !== undefined ? phone : null,
        city !== undefined ? city : null,
        state !== undefined ? state : null,
        country !== undefined ? country : null,
        req.user.id,
      ]
    );
    return ok(res, { message: 'Account settings updated successfully.', user: upd.rows[0] });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const pool = require('../config/database');
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return fail(res, 'Current password and new password are required.', 400);
    }
    if (String(new_password).length < 6) {
      return fail(res, 'New password must be at least 6 characters.', 400);
    }

    const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const userRow = userRes.rows[0];
    if (!userRow) return fail(res, 'User not found.', 404);

    const valid = await bcrypt.compare(current_password, userRow.password_hash);
    if (!valid) {
      return fail(res, 'Current password is incorrect.', 400);
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);
    return ok(res, { message: 'Password updated successfully.' });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

