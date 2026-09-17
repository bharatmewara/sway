'use strict';

const pool = require('../config/database');

class PreferenceRepository {
  async getPreferences(userId) {
    const res = await pool.query(
      `SELECT preferred_age_min, preferred_age_max, preferred_distance, interested_in
       FROM users WHERE id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async updatePreferences(userId, prefs) {
    const { minAge, maxAge, distance, interestedIn } = prefs;
    const res = await pool.query(
      `UPDATE users
       SET preferred_age_min = COALESCE($1, preferred_age_min),
           preferred_age_max = COALESCE($2, preferred_age_max),
           preferred_distance = COALESCE($3, preferred_distance),
           interested_in = COALESCE($4, interested_in),
           updated_at = NOW()
       WHERE id = $5 RETURNING preferred_age_min, preferred_age_max, preferred_distance, interested_in`,
      [minAge, maxAge, distance, interestedIn, userId]
    );
    return res.rows[0];
  }

  async getPrivacySettings(userId) {
    const res = await pool.query(
      `SELECT * FROM user_privacy_settings WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async updatePrivacySettings(userId, settings) {
    const res = await pool.query(
      `INSERT INTO user_privacy_settings (
        user_id, hide_real_name, hide_phone, hide_email, blur_face,
        hide_distance, hide_age, incognito_mode, invisible_browsing, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        hide_real_name = COALESCE(EXCLUDED.hide_real_name, user_privacy_settings.hide_real_name),
        hide_phone = COALESCE(EXCLUDED.hide_phone, user_privacy_settings.hide_phone),
        hide_email = COALESCE(EXCLUDED.hide_email, user_privacy_settings.hide_email),
        blur_face = COALESCE(EXCLUDED.blur_face, user_privacy_settings.blur_face),
        hide_distance = COALESCE(EXCLUDED.hide_distance, user_privacy_settings.hide_distance),
        hide_age = COALESCE(EXCLUDED.hide_age, user_privacy_settings.hide_age),
        incognito_mode = COALESCE(EXCLUDED.incognito_mode, user_privacy_settings.incognito_mode),
        invisible_browsing = COALESCE(EXCLUDED.invisible_browsing, user_privacy_settings.invisible_browsing),
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        settings.hide_real_name, settings.hide_phone, settings.hide_email,
        settings.blur_face, settings.hide_distance, settings.hide_age,
        settings.incognito_mode, settings.invisible_browsing
      ]
    );
    return res.rows[0];
  }
}

module.exports = new PreferenceRepository();
