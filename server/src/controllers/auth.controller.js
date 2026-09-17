'use strict';

const authService = require('../services/auth.service');
const { ok, fail } = require('../utils/response');

exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    req.app.get('io')?.to('admin_room').emit('admin_update', {
      type: 'new_user',
      user: { id: result.user.id, username: result.user.username }
    });
    return ok(res, { message: 'Registration successful.', ...result }, 201);
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    return ok(res, { message: 'Login successful.', ...result });
  } catch (err) {
    return fail(res, err.message, 401);
  }
};

exports.logout = async (req, res) => {
  try {
    await authService.logout(req.user.id);
    return ok(res, { message: 'Logged out successfully.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.me = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return ok(res, { user });
  } catch (err) {
    return fail(res, err.message, 404);
  }
};

exports.forgotPassword = async (req, res) => {
  return ok(res, { message: 'If this email exists, password reset instructions have been sent.' });
};
