'use strict';

const pool = require('../config/database');

class ProfileRepository {
  async getProfile(userId) {
    const res = await pool.query(
      `SELECT u.id, u.uuid, u.username, u.nickname, u.email, u.phone,
              u.instagram, u.facebook, u.telegram,
              u.gender, u.selected_gender,
              u.verified_gender, u.ai_detected_gender, u.gender_match_status, u.profile_status,
              u.date_of_birth, u.age, u.city, u.state, u.country, u.latitude, u.longitude,
              u.bio, u.profile_photo, u.marital_status, u.relationship_type,
              u.looking_for, u.height, u.body_type, u.education, u.profession,
              u.languages, u.interests, u.hobbies, u.smoking, u.smoker, u.drinking, u.religion,
              u.children, u.ethnicity, u.personality_traits, u.sexual_practices, u.relationship_expectations,
              u.verification_status, u.onboarding_status, u.profile_completed, u.connect_required_for_chat,
              u.connect_credits, u.is_online, u.last_seen, u.created_at,
              p.hide_real_name, p.hide_phone, p.hide_email,
              COALESCE(p.hide_instagram, true) AS hide_instagram,
              COALESCE(p.hide_facebook, true) AS hide_facebook,
              COALESCE(p.hide_telegram, true) AS hide_telegram,
              p.blur_face, p.hide_distance, p.hide_age, p.incognito_mode
       FROM users u
       LEFT JOIN user_privacy_settings p ON p.user_id = u.id
       WHERE u.id = $1 AND u.is_active = true`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async updateProfile(userId, fields) {
    // Note: gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
    // verification_status, and connect_required_for_chat are intentionally excluded
    // so users cannot manipulate their verified identity or bypass Connect rules.
    const allowed = [
      'bio', 'city', 'state', 'country', 'latitude', 'longitude',
      'marital_status', 'relationship_type', 'looking_for', 'height',
      'body_type', 'education', 'profession', 'languages', 'interests',
      'hobbies', 'smoking', 'smoker', 'drinking', 'religion', 'nickname',
      'date_of_birth', 'age', 'profile_photo', 'children', 'ethnicity',
      'personality_traits', 'sexual_practices', 'relationship_expectations',
      'phone', 'instagram', 'facebook', 'telegram',
      'profile_completed', 'profile_status', 'onboarding_status'
    ];

    const updates = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        let val = fields[key];
        if (key === 'height' || key === 'age') {
          val = val === '' || val === null ? null : parseInt(val, 10);
          if (isNaN(val)) continue;
        } else if (Array.isArray(val)) {
          val = JSON.stringify(val);
        }
        updates.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (!updates.length) return this.getProfile(userId);

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(query, values);
    const row = res.rows[0];
    if (row) delete row.photo_bytes;
    if (row) delete row.password_hash;
    return row;
  }

  async updatePhoto(userId, photoUrl, photoBytes = null, photoMime = null) {
    if (photoBytes) {
      const res = await pool.query(
        `UPDATE users SET profile_photo = $1, photo_bytes = $2, photo_mime = $3, updated_at = NOW() WHERE id = $4 RETURNING profile_photo`,
        [photoUrl, photoBytes, photoMime, userId]
      );
      return res.rows[0];
    }
    const res = await pool.query(
      `UPDATE users SET profile_photo = $1, updated_at = NOW() WHERE id = $2 RETURNING profile_photo`,
      [photoUrl, userId]
    );
    return res.rows[0];
  }

  async getPhotos(userId) {
    const res = await pool.query(
      `SELECT id, user_id, photo_url, is_blurred, created_at FROM private_photos WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async addPhoto(userId, photoUrl, isBlurred = false, photoBytes = null, photoMime = null) {
    if (photoBytes) {
      const res = await pool.query(
        `INSERT INTO private_photos (user_id, photo_url, is_blurred, photo_bytes, photo_mime) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, photo_url, is_blurred, created_at`,
        [userId, photoUrl, isBlurred, photoBytes, photoMime]
      );
      return res.rows[0];
    }
    const res = await pool.query(
      `INSERT INTO private_photos (user_id, photo_url, is_blurred) VALUES ($1, $2, $3) RETURNING id, user_id, photo_url, is_blurred, created_at`,
      [userId, photoUrl, isBlurred]
    );
    return res.rows[0];
  }

  async getUserAvatarBytes(userId) {
    const res = await pool.query(
      `SELECT photo_bytes, photo_mime FROM users WHERE id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async getPrivatePhotoBytes(photoId) {
    const res = await pool.query(
      `SELECT id, user_id, photo_bytes, photo_mime FROM private_photos WHERE id = $1`,
      [photoId]
    );
    return res.rows[0] || null;
  }

  async deletePhoto(photoId, userId) {
    const res = await pool.query(
      `DELETE FROM private_photos WHERE id = $1 AND user_id = $2 RETURNING id`,
      [photoId, userId]
    );
    return res.rowCount > 0;
  }
}

module.exports = new ProfileRepository();
