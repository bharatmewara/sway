'use strict';

const pool = require('../config/database');

class UserRepository {
  async findById(id) {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findByEmailOrUsername(identifier) {
    const res = await pool.query(
      'SELECT * FROM users WHERE (email = $1 OR username = $1) AND is_active = true',
      [identifier]
    );
    return res.rows[0] || null;
  }

  async exists(email, username) {
    const res = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    return res.rows.length > 0;
  }

  async create(userData) {
    const {
      username, email, passwordHash, gender, dob, age,
      city, state, country, role = 'user'
    } = userData;

    const res = await pool.query(
      `INSERT INTO users (
        username, email, password_hash, gender, date_of_birth, age,
        city, state, country, role, connect_credits, is_online,
        verification_status, verified_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, 0, false, 'verified', NOW()) RETURNING *`,
      [username, email, passwordHash, gender, dob, age, city, state, country, role]
    );
    return res.rows[0];
  }

  async updateOnlineStatus(id, isOnline) {
    await pool.query(
      `UPDATE users SET is_online = $1, last_seen = NOW(), updated_at = NOW() WHERE id = $2`,
      [isOnline, id]
    );
  }

  async updateCredits(id, delta) {
    const res = await pool.query(
      `UPDATE users SET connect_credits = GREATEST(0, connect_credits + $1), updated_at = NOW() WHERE id = $2 RETURNING connect_credits`,
      [delta, id]
    );
    return res.rows[0]?.connect_credits;
  }

  async findAll({
    limit = 20,
    offset = 0,
    isOnline = null,
    minAge = null,
    maxAge = null,
    maritalStatus = null,
    gender = null,
    city = null,
    excludeId = null
  } = {}) {
    let query = `SELECT id, username, email, gender, age, city, state, country, profile_photo, verification_status, marital_status, is_online, created_at
       FROM users WHERE is_active = true`;
    const params = [];

    if (excludeId) {
      params.push(excludeId);
      query += ` AND id != $${params.length}`;
    }
    if (isOnline !== null && isOnline !== undefined) {
      params.push(isOnline);
      query += ` AND is_online = $${params.length}`;
    }
    if (minAge) {
      params.push(parseInt(minAge, 10));
      query += ` AND (age IS NULL OR age >= $${params.length})`;
    }
    if (maxAge) {
      params.push(parseInt(maxAge, 10));
      query += ` AND (age IS NULL OR age <= $${params.length})`;
    }
    if (maritalStatus) {
      params.push(maritalStatus.toLowerCase());
      query += ` AND LOWER(marital_status) = $${params.length}`;
    }
    if (gender) {
      params.push(gender.toLowerCase());
      query += ` AND LOWER(gender) = $${params.length}`;
    }
    if (city) {
      params.push(`%${city.toLowerCase()}%`);
      query += ` AND (LOWER(city) LIKE $${params.length} OR LOWER(state) LIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const res = await pool.query(query, params);
    return res.rows;
  }
}

module.exports = new UserRepository();
