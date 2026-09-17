'use strict';

const userService = require('../services/user.service');
const { ok, fail } = require('../utils/response');

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const isOnline = req.query.is_online !== undefined ? req.query.is_online === 'true' : null;
    const minAge = req.query.min_age || req.query.minAge || null;
    const maxAge = req.query.max_age || req.query.maxAge || null;
    const maritalStatus = req.query.marital_status || req.query.maritalStatus || null;
    const gender = req.query.gender || null;
    const city = req.query.city || req.query.location || null;
    const excludeId = req.user?.id || null;

    const users = await userService.listUsers(page, limit, {
      isOnline,
      minAge,
      maxAge,
      maritalStatus,
      gender,
      city,
      excludeId
    });
    return ok(res, { users, page, limit });
  } catch (err) {
    return fail(res, err.message, 500);
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
    const user = await userService.getUser(id);
    return ok(res, { user });
  } catch (err) {
    return fail(res, err.message, 404);
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
