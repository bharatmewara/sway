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
      city, state, country, role = 'user',
      terms_accepted = true,
      privacy_policy_accepted = true,
      terms_version = '1.0',
      privacy_policy_version = '1.0',
    } = userData;
    const selectedGender = String(gender || '').toLowerCase().trim();

    const res = await pool.query(
      `INSERT INTO users (
        username, email, password_hash, gender, selected_gender, date_of_birth, age,
        city, state, country, role, connect_credits, is_online,
        verification_status, gender_match_status, profile_status,
        onboarding_status, profile_completed,
        connect_required_for_chat, verified_at,
        terms_accepted, privacy_policy_accepted, terms_version, privacy_policy_version, consent_accepted_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, 0, false, 'NOT_VERIFIED', 'PENDING', 'INCOMPLETE', 'NOT_VERIFIED', false, true, NULL, $12, $13, $14, $15, NOW()) RETURNING *`,
      [
        username, email, passwordHash, selectedGender, selectedGender, dob, age,
        city, state, country, role,
        terms_accepted, privacy_policy_accepted, terms_version, privacy_policy_version
      ]
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

  async updateLocation(userId, { latitude, longitude, city = null, state = null, country = null }) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      const err = new Error('Invalid latitude. Must be between -90 and 90.');
      err.status = 400;
      throw err;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      const err = new Error('Invalid longitude. Must be between -180 and 180.');
      err.status = 400;
      throw err;
    }

    const res = await pool.query(
      `UPDATE users
       SET latitude = $1,
           longitude = $2,
           city = COALESCE($3, city),
           state = COALESCE($4, state),
           country = COALESCE($5, country),
           location_updated_at = NOW(),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, username, city, state, country, latitude, longitude, location_updated_at`,
      [lat, lng, city || null, state || null, country || null, userId]
    );
    return res.rows[0] || null;
  }

  async findAll({
    limit = 20,
    offset = 0,
    isOnline = null,
    minAge = null,
    maxAge = null,
    maritalStatus = null,
    relationshipType = null,
    verifiedOnly = false,
    gender = null,
    city = null,
    excludeId = null,
    latitude = null,
    longitude = null,
    maxDistanceKm = null,
    nearbyOnly = false,
  } = {}) {
    let enforcedGender = gender ? gender.toLowerCase() : null;
    let viewerLat = latitude !== null && latitude !== undefined && latitude !== '' ? parseFloat(latitude) : null;
    let viewerLng = longitude !== null && longitude !== undefined && longitude !== '' ? parseFloat(longitude) : null;

    if (excludeId) {
      const viewerRes = await pool.query(
        `SELECT COALESCE(verified_gender, selected_gender, gender) AS effective_gender,
                latitude, longitude
         FROM users WHERE id = $1`,
        [excludeId]
      );
      const viewerRow = viewerRes.rows[0];
      const viewerGender = (viewerRow?.effective_gender || '').toLowerCase();
      if (viewerGender === 'male') {
        enforcedGender = 'female';
      } else if (viewerGender === 'female') {
        enforcedGender = 'male';
      }
      if ((viewerLat === null || isNaN(viewerLat)) && viewerRow?.latitude !== null && viewerRow?.latitude !== undefined) {
        viewerLat = parseFloat(viewerRow.latitude);
      }
      if ((viewerLng === null || isNaN(viewerLng)) && viewerRow?.longitude !== null && viewerRow?.longitude !== undefined) {
        viewerLng = parseFloat(viewerRow.longitude);
      }
    }

    const hasViewerCoords =
      viewerLat !== null && !isNaN(viewerLat) && viewerLat >= -90 && viewerLat <= 90 &&
      viewerLng !== null && !isNaN(viewerLng) && viewerLng >= -180 && viewerLng <= 180;

    if (nearbyOnly && !hasViewerCoords) {
      return [];
    }

    // Fetch freshness window from admin settings (default 168 hours = 7 days)
    let freshnessHours = 168;
    try {
      const cfg = await pool.query(
        `SELECT COALESCE(location_freshness_hours, 168) AS hours FROM admin_communication_settings ORDER BY id ASC LIMIT 1`
      );
      if (cfg.rows[0]?.hours) freshnessHours = parseInt(cfg.rows[0].hours, 10) || 168;
    } catch (_) {}

    const params = [];
    let distanceSelectSql = `NULL::float AS distance_km`;
    let haversineExpr = null;

    if (hasViewerCoords) {
      params.push(viewerLat, viewerLng);
      const latIdx = params.length - 1;
      const lngIdx = params.length;
      haversineExpr = `(
        6371.0 * 2.0 * ASIN(LEAST(1.0, SQRT(
          POWER(SIN(RADIANS(u.latitude - $${latIdx}::float) / 2.0), 2) +
          COS(RADIANS($${latIdx}::float)) * COS(RADIANS(u.latitude)) *
          POWER(SIN(RADIANS(u.longitude - $${lngIdx}::float) / 2.0), 2)
        )))
      )`;
      distanceSelectSql = `CASE
        WHEN u.latitude IS NOT NULL AND u.longitude IS NOT NULL
        THEN ROUND((${haversineExpr})::numeric, 1)::float
        ELSE NULL
      END AS distance_km`;
    }

    let query = `
      SELECT u.id, u.username, u.nickname, u.gender, u.verified_gender,
             u.age, u.city, u.state, u.country, u.profile_photo,
             u.verification_status, u.marital_status, u.relationship_type,
             u.is_online, u.last_seen, u.location_updated_at, u.created_at,
             ${distanceSelectSql}
      FROM users u
      WHERE u.is_active = true
        AND COALESCE(u.is_banned, false) = false
    `;

    if (excludeId) {
      params.push(excludeId);
      query += ` AND u.id != $${params.length}`;
      query += ` AND u.id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = $${params.length}
        UNION
        SELECT blocker_id FROM blocks WHERE blocked_id = $${params.length}
      )`;
    }
    if (isOnline !== null && isOnline !== undefined) {
      params.push(isOnline);
      query += ` AND u.is_online = $${params.length}`;
    }
    if (verifiedOnly) {
      query += ` AND LOWER(COALESCE(u.verification_status, '')) = 'verified'`;
    }
    if (minAge) {
      params.push(parseInt(minAge, 10));
      query += ` AND (u.age IS NULL OR u.age >= $${params.length})`;
    }
    if (maxAge) {
      params.push(parseInt(maxAge, 10));
      query += ` AND (u.age IS NULL OR u.age <= $${params.length})`;
    }
    if (maritalStatus) {
      params.push(maritalStatus.toLowerCase());
      query += ` AND LOWER(COALESCE(u.marital_status, '')) = $${params.length}`;
    }
    if (relationshipType) {
      params.push(relationshipType.toLowerCase());
      query += ` AND LOWER(COALESCE(u.relationship_type, '')) = $${params.length}`;
    }
    if (enforcedGender) {
      params.push(enforcedGender.toLowerCase());
      query += ` AND LOWER(COALESCE(u.verified_gender, u.gender)) = $${params.length}`;
    }
    if (city) {
      params.push(`%${city.toLowerCase()}%`);
      query += ` AND (LOWER(COALESCE(u.city, '')) LIKE $${params.length} OR LOWER(COALESCE(u.state, '')) LIKE $${params.length})`;
    }

    const parsedDistance =
      maxDistanceKm !== null && maxDistanceKm !== undefined && maxDistanceKm !== '' && maxDistanceKm !== 'all'
        ? parseFloat(maxDistanceKm)
        : null;

    if (hasViewerCoords && (nearbyOnly || (parsedDistance !== null && !isNaN(parsedDistance) && parsedDistance > 0))) {
      query += ` AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL`;
      params.push(freshnessHours);
      query += ` AND (u.location_updated_at IS NULL OR u.location_updated_at >= NOW() - ($${params.length}::int || ' hours')::interval)`;

      if (parsedDistance !== null && !isNaN(parsedDistance) && parsedDistance > 0) {
        params.push(parsedDistance);
        query += ` AND (${haversineExpr}) <= $${params.length}::float`;
      }

      query += ` ORDER BY distance_km ASC NULLS LAST, u.is_online DESC, u.last_seen DESC NULLS LAST`;
    } else if (hasViewerCoords) {
      query += ` ORDER BY u.is_online DESC, distance_km ASC NULLS LAST, u.created_at DESC`;
    } else {
      query += ` ORDER BY u.is_online DESC, u.created_at DESC`;
    }

    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const res = await pool.query(query, params);
    return res.rows;
  }
}

module.exports = new UserRepository();
