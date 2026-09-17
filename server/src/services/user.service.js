'use strict';

const pool = require('../config/database');
const userRepo = require('../repositories/user.repository');
const preferenceRepo = require('../repositories/preference.repository');

class UserService {
  async getUser(id) {
    const user = await userRepo.findById(id);
    if (!user) throw new Error('User not found.');
    delete user.password_hash;
    return user;
  }

  async listUsers(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    return userRepo.findAll({ limit, offset, ...filters });
  }

  async getCounts(userId) {
    try {
      const [msgRes, reqRes, notifRes] = await Promise.all([
        pool.query('SELECT count(*)::int FROM messages WHERE receiver_id = $1 AND is_read = false', [userId]),
        pool.query('SELECT count(*)::int FROM connection_requests WHERE receiver_id = $1 AND status = \'pending\'', [userId]),
        pool.query('SELECT count(*)::int FROM notifications WHERE user_id = $1 AND is_read = false', [userId]),
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
    return preferenceRepo.getPrivacySettings(userId);
  }

  async updatePrivacy(userId, settings) {
    return preferenceRepo.updatePrivacySettings(userId, settings);
  }
}

module.exports = new UserService();
