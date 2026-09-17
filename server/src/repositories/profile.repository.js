'use strict';

const pool = require('../config/database');

class ProfileRepository {
  async getProfile(userId) {
    const res = await pool.query(
      `SELECT u.id, u.uuid, u.username, u.email, u.gender, u.date_of_birth, u.age,
              u.city, u.state, u.country, u.latitude, u.longitude,
              u.bio, u.profile_photo, u.marital_status, u.relationship_type,
              u.looking_for, u.height, u.body_type, u.education, u.profession,
              u.languages, u.interests, u.verification_status, u.connect_credits,
              u.is_online, u.last_seen, u.created_at,
              p.hide_real_name, p.hide_phone, p.hide_email, p.blur_face,
              p.hide_distance, p.hide_age, p.incognito_mode
       FROM users u
       LEFT JOIN user_privacy_settings p ON p.user_id = u.id
       WHERE u.id = $1 AND u.is_active = true`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async updateProfile(userId, fields) {
    const allowed = [
      'bio', 'city', 'state', 'country', 'latitude', 'longitude',
      'marital_status', 'relationship_type', 'looking_for', 'height',
      'body_type', 'education', 'profession', 'languages', 'interests',
      'profile_photo'
    ];

    const updates = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = $${idx++}`);
        values.push(fields[key]);
      }
    }

    if (!updates.length) return this.getProfile(userId);

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  async updatePhoto(userId, photoUrl) {
    const res = await pool.query(
      `UPDATE users SET profile_photo = $1, updated_at = NOW() WHERE id = $2 RETURNING profile_photo`,
      [photoUrl, userId]
    );
    return res.rows[0];
  }

  async getPhotos(userId) {
    const res = await pool.query(
      `SELECT id, photo_url, is_blurred, created_at FROM private_photos WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async addPhoto(userId, photoUrl, isBlurred = false) {
    const res = await pool.query(
      `INSERT INTO private_photos (user_id, photo_url, is_blurred) VALUES ($1, $2, $3) RETURNING *`,
      [userId, photoUrl, isBlurred]
    );
    return res.rows[0];
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
