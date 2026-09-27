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
      `SELECT p.*, u.instagram, u.facebook, u.telegram, u.phone
       FROM users u
       LEFT JOIN user_privacy_settings p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    const row = res.rows[0] || {};
    return {
      user_id: userId,
      hide_real_name: row.hide_real_name ?? false,
      hide_phone: row.hide_phone ?? true,
      hide_email: row.hide_email ?? true,
      hide_instagram: row.hide_instagram ?? true,
      hide_facebook: row.hide_facebook ?? true,
      hide_telegram: row.hide_telegram ?? true,
      blur_face: row.blur_face ?? false,
      hide_distance: row.hide_distance ?? false,
      hide_age: row.hide_age ?? false,
      incognito_mode: row.incognito_mode ?? false,
      invisible_browsing: row.invisible_browsing ?? false,
      instagram: row.instagram || '',
      facebook: row.facebook || '',
      telegram: row.telegram || '',
      phone: row.phone || '',
    };
  }

  async updatePrivacySettings(userId, settings) {
    if (
      settings.instagram !== undefined ||
      settings.facebook !== undefined ||
      settings.telegram !== undefined ||
      settings.phone !== undefined
    ) {
      await pool.query(
        `UPDATE users
         SET instagram = COALESCE($1, instagram),
             facebook = COALESCE($2, facebook),
             telegram = COALESCE($3, telegram),
             phone = COALESCE($4, phone),
             updated_at = NOW()
         WHERE id = $5`,
        [
          settings.instagram !== undefined ? settings.instagram : null,
          settings.facebook !== undefined ? settings.facebook : null,
          settings.telegram !== undefined ? settings.telegram : null,
          settings.phone !== undefined ? settings.phone : null,
          userId
        ]
      );
    }

    await pool.query(
      `INSERT INTO user_privacy_settings (
        user_id, hide_real_name, hide_phone, hide_email,
        hide_instagram, hide_facebook, hide_telegram,
        blur_face, hide_distance, hide_age, incognito_mode, invisible_browsing, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        hide_real_name = COALESCE(EXCLUDED.hide_real_name, user_privacy_settings.hide_real_name),
        hide_phone = COALESCE(EXCLUDED.hide_phone, user_privacy_settings.hide_phone),
        hide_email = COALESCE(EXCLUDED.hide_email, user_privacy_settings.hide_email),
        hide_instagram = COALESCE(EXCLUDED.hide_instagram, user_privacy_settings.hide_instagram),
        hide_facebook = COALESCE(EXCLUDED.hide_facebook, user_privacy_settings.hide_facebook),
        hide_telegram = COALESCE(EXCLUDED.hide_telegram, user_privacy_settings.hide_telegram),
        blur_face = COALESCE(EXCLUDED.blur_face, user_privacy_settings.blur_face),
        hide_distance = COALESCE(EXCLUDED.hide_distance, user_privacy_settings.hide_distance),
        hide_age = COALESCE(EXCLUDED.hide_age, user_privacy_settings.hide_age),
        incognito_mode = COALESCE(EXCLUDED.incognito_mode, user_privacy_settings.incognito_mode),
        invisible_browsing = COALESCE(EXCLUDED.invisible_browsing, user_privacy_settings.invisible_browsing),
        updated_at = NOW()`,
      [
        userId,
        settings.hide_real_name,
        settings.hide_phone !== undefined ? settings.hide_phone : true,
        settings.hide_email !== undefined ? settings.hide_email : true,
        settings.hide_instagram !== undefined ? settings.hide_instagram : true,
        settings.hide_facebook !== undefined ? settings.hide_facebook : true,
        settings.hide_telegram !== undefined ? settings.hide_telegram : true,
        settings.blur_face,
        settings.hide_distance,
        settings.hide_age,
        settings.incognito_mode,
        settings.invisible_browsing
      ]
    );
    return this.getPrivacySettings(userId);
  }
}

module.exports = new PreferenceRepository();
