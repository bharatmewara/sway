'use strict';

const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { sign } = require('../utils/jwt');
const { ok, fail } = require('../utils/response');
const {
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
  getEffectivePermissions,
  logAdminAction,
} = require('../middleware/admin.middleware');

// ── Helper: parse date range query ────────────────────────────────────────────
function resolveDateRange(range = '30d', fromStr = null, toStr = null) {
  const now = new Date();
  let start = new Date();
  let end = new Date(now);

  if (range === 'custom' && fromStr) {
    start = new Date(fromStr);
    if (toStr) end = new Date(toStr);
  } else if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    start.setDate(now.getDate() - 7);
  } else if (range === '90d') {
    start.setDate(now.getDate() - 90);
  } else if (range === '12m') {
    start.setFullYear(now.getFullYear() - 1);
  } else {
    // default 30d
    start.setDate(now.getDate() - 30);
  }

  return { start, end };
}

// ── 1. Health & Auth ──────────────────────────────────────────────────────────
exports.health = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      success: true,
      status: 'ok',
      service: 'admin-api',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'admin-api',
      error: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const identifier = (req.body.identifier || req.body.email || req.body.username || '').trim();
    const password = req.body.password || '';

    if (!identifier || !password) {
      return fail(res, 'Email/username and password are required.', 400);
    }

    const { rows } = await pool.query(
      `SELECT id, username, nickname, email, password_hash, role, is_active, is_banned,
              COALESCE(account_status, 'ACTIVE') AS account_status,
              COALESCE(permissions, '[]'::jsonb) AS permissions
       FROM users
       WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)
       LIMIT 1`,
      [identifier]
    );

    if (!rows.length) {
      return fail(res, 'Invalid admin credentials.', 401);
    }

    const user = rows[0];
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return fail(res, 'Invalid admin credentials.', 401);
    }

    const role = String(user.role || '').toLowerCase();
    if (!ADMIN_ROLES.includes(role)) {
      return fail(res, 'Access denied. Admin privileges required.', 403);
    }

    if (!user.is_active || user.is_banned || ['BANNED', 'SUSPENDED', 'DEACTIVATED'].includes(user.account_status)) {
      return fail(res, 'This admin account has been disabled.', 403);
    }

    const effectivePermissions = getEffectivePermissions(role, user.permissions);
    const token = sign({
      id: user.id,
      username: user.username,
      email: user.email,
      role,
    });

    req.admin = { id: user.id, username: user.username, role };
    await logAdminAction(req, {
      actionType: 'ADMIN_LOGIN',
      targetType: 'admin',
      targetId: user.id,
      newValue: { email: user.email, role },
    });

    return ok(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        role,
        account_status: user.account_status,
        permissions: effectivePermissions,
      },
    });
  } catch (err) {
    console.error('[ADMIN] login error:', err);
    return fail(res, err.message, 500);
  }
};

exports.getMe = async (req, res) => {
  return ok(res, {
    user: req.admin,
    rolePermissions: ROLE_PERMISSIONS,
  });
};

// ── 2. Dashboard KPIs & Charts ────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const range = req.query.range || '30d';
    const { start, end } = resolveDateRange(range, req.query.from, req.query.to);

    const [
      userCountsRes,
      engagementCountsRes,
      revenueCountsRes,
      connectsCountsRes,
      reportCountsRes,
      revenueByDayRes,
      userGrowthByDayRes,
      messagesByDayRes,
      genderSplitRes,
      verificationSplitRes,
      connectUsageRes,
      reportsByCategoryRes,
      cityWiseRes,
      recentUsersRes,
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_users,
          COUNT(*) FILTER (WHERE LOWER(COALESCE(verified_gender, gender)) = 'female')::int AS female_users,
          COUNT(*) FILTER (WHERE LOWER(COALESCE(verified_gender, gender)) = 'male')::int AS male_users,
          COUNT(*) FILTER (WHERE LOWER(verification_status) = 'verified')::int AS total_verified,
          COUNT(*) FILTER (WHERE LOWER(verification_status) IN ('pending', 'pending_selfie_verification', 'verification_in_progress'))::int AS pending_verifications,
          COUNT(*) FILTER (WHERE LOWER(verification_status) IN ('rejected', 'verification_resubmission_required') OR gender_match_status IN ('FAILED', 'MISMATCH'))::int AS failed_verifications,
          COUNT(*) FILTER (WHERE profile_completed = true OR UPPER(profile_status) = 'COMPLETED')::int AS completed_profiles,
          COUNT(*) FILTER (WHERE COALESCE(profile_completed, false) = false AND UPPER(COALESCE(profile_status, '')) != 'COMPLETED')::int AS incomplete_profiles,
          COUNT(*) FILTER (WHERE is_online = true)::int AS online_now,
          COUNT(*) FILTER (WHERE last_seen >= CURRENT_DATE OR created_at >= CURRENT_DATE)::int AS active_today,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS new_registrations_today,
          COUNT(*) FILTER (WHERE is_banned = true OR UPPER(account_status) = 'BANNED')::int AS banned_users,
          COUNT(*) FILTER (WHERE UPPER(account_status) = 'SUSPENDED')::int AS suspended_users
        FROM users
      `),
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM likes) AS total_likes,
          (SELECT COUNT(*)::int FROM crushes) AS total_crushes,
          (SELECT COUNT(*)::int FROM visits) AS total_visitors,
          (SELECT COUNT(*)::int FROM connection_requests) AS total_connection_requests,
          (SELECT COUNT(*)::int FROM conversations WHERE COALESCE(communication_type, 'CHAT') = 'CHAT' AND COALESCE(session_status, 'ACTIVE') = 'ACTIVE' AND (expires_at IS NULL OR expires_at > NOW())) AS active_chats,
          (SELECT COUNT(*)::int FROM conversations WHERE COALESCE(communication_type, 'CHAT') = 'CHAT' AND (session_status = 'EXPIRED' OR (expires_at IS NOT NULL AND expires_at <= NOW()))) AS expired_chats,
          (SELECT COUNT(*)::int FROM messages WHERE communication_type = 'PRIVATE_MESSAGE') AS total_private_messages,
          (SELECT COUNT(*)::int FROM messages WHERE COALESCE(is_deleted, false) = false) AS total_messages,
          (SELECT COUNT(*)::int FROM messages WHERE created_at >= CURRENT_DATE AND COALESCE(is_deleted, false) = false) AS messages_today,
          (SELECT COUNT(*)::int FROM blocks) AS total_blocks
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(amount_inr) FILTER (WHERE status IN ('success', 'completed', 'paid')), 0)::numeric AS total_revenue,
          COALESCE(SUM(amount_inr) FILTER (WHERE status IN ('success', 'completed', 'paid') AND created_at >= CURRENT_DATE), 0)::numeric AS today_revenue,
          COALESCE(SUM(amount_inr) FILTER (WHERE status IN ('success', 'completed', 'paid') AND created_at >= NOW() - INTERVAL '7 days'), 0)::numeric AS week_revenue,
          COALESCE(SUM(amount_inr) FILTER (WHERE status IN ('success', 'completed', 'paid') AND created_at >= NOW() - INTERVAL '30 days'), 0)::numeric AS month_revenue,
          COUNT(*) FILTER (WHERE status IN ('success', 'completed', 'paid'))::int AS successful_transactions,
          COUNT(*) FILTER (WHERE status IN ('failed', 'cancelled'))::int AS failed_transactions,
          COUNT(*) FILTER (WHERE status = 'refunded' OR refund_status = 'PROCESSED')::int AS refunded_transactions,
          COUNT(*)::int AS total_transactions
        FROM transactions
      `),
      pool.query(`
        SELECT
          COALESCE((SELECT SUM(connect_credits) FROM users), 0)::int AS total_connects_available,
          COALESCE(SUM(amount) FILTER (WHERE amount > 0 AND transaction_type IN ('PURCHASE', 'ADMIN_ADJUSTMENT', 'PROMOTIONAL')), 0)::int AS total_connects_purchased,
          COALESCE(SUM(ABS(amount)) FILTER (WHERE amount < 0 OR transaction_type IN ('CHAT_START', 'CHAT_MESSAGE_ACCESS', 'CHAT_REINITIATE', 'PRIVATE_MESSAGE_START', 'PRIVATE_MESSAGE_REINITIATE')), 0)::int AS total_connects_spent
        FROM connect_transactions
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE COALESCE(status, 'pending') IN ('pending', 'open', 'under_review'))::int AS open_reports,
          COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_reports,
          COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected_reports,
          COUNT(*) FILTER (WHERE status = 'escalated')::int AS escalated_reports,
          COUNT(*) FILTER (WHERE priority IN ('high', 'critical') AND COALESCE(status, 'pending') != 'resolved')::int AS high_priority_reports,
          (SELECT COUNT(*)::int FROM (SELECT reported_id FROM reports GROUP BY reported_id HAVING COUNT(*) >= 2) sub) AS users_flagged_multiple_times
        FROM reports
      `),
      pool.query(
        `SELECT
           TO_CHAR(DATE(created_at), 'Mon DD') AS day,
           DATE(created_at) AS raw_date,
           COALESCE(SUM(amount_inr) FILTER (WHERE status IN ('success', 'completed', 'paid')), 0)::numeric AS revenue,
           COUNT(*)::int AS tx_count
         FROM transactions
         WHERE created_at >= $1 AND created_at <= $2
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [start, end]
      ),
      pool.query(
        `SELECT
           TO_CHAR(DATE(created_at), 'Mon DD') AS day,
           DATE(created_at) AS raw_date,
           COUNT(*)::int AS registrations,
           COUNT(*) FILTER (WHERE LOWER(COALESCE(verified_gender, gender)) = 'female')::int AS female,
           COUNT(*) FILTER (WHERE LOWER(COALESCE(verified_gender, gender)) = 'male')::int AS male
         FROM users
         WHERE created_at >= $1 AND created_at <= $2
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [start, end]
      ),
      pool.query(
        `SELECT
           TO_CHAR(DATE(created_at), 'Dy, Mon DD') AS day,
           DATE(created_at) AS raw_date,
           COUNT(*)::int AS messages,
           COUNT(*) FILTER (WHERE COALESCE(communication_type, 'CHAT') = 'CHAT')::int AS chat_messages,
           COUNT(*) FILTER (WHERE communication_type = 'PRIVATE_MESSAGE')::int AS private_messages
         FROM messages
         WHERE created_at >= $1 AND created_at <= $2
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [start, end]
      ),
      pool.query(`
        SELECT
          LOWER(COALESCE(verified_gender, gender, 'unknown')) AS gender,
          COUNT(*)::int AS count
        FROM users
        WHERE COALESCE(verified_gender, gender) IS NOT NULL
        GROUP BY LOWER(COALESCE(verified_gender, gender, 'unknown'))
      `),
      pool.query(`
        SELECT
          LOWER(COALESCE(verification_status, 'not_submitted')) AS status,
          COUNT(*)::int AS count
        FROM users
        GROUP BY LOWER(COALESCE(verification_status, 'not_submitted'))
      `),
      pool.query(`
        SELECT
          COALESCE(transaction_type, 'OTHER') AS type,
          COUNT(*)::int AS count,
          COALESCE(SUM(ABS(amount)), 0)::int AS total_connects
        FROM connect_transactions
        GROUP BY COALESCE(transaction_type, 'OTHER')
        ORDER BY total_connects DESC
      `),
      pool.query(`
        SELECT
          COALESCE(reason, 'Other') AS category,
          COUNT(*)::int AS count
        FROM reports
        GROUP BY COALESCE(reason, 'Other')
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT
          COALESCE(NULLIF(TRIM(city), ''), 'Unknown') AS city,
          MAX(state) AS state,
          COUNT(*)::int AS count,
          COUNT(*) FILTER (WHERE is_online = true)::int AS online
        FROM users
        GROUP BY COALESCE(NULLIF(TRIM(city), ''), 'Unknown')
        ORDER BY count DESC
        LIMIT 12
      `),
      pool.query(`
        SELECT
          id, username, nickname, email, gender, selected_gender, ai_detected_gender, verified_gender,
          gender_match_status, city, state, age, verification_status, profile_status, profile_completed,
          connect_credits, connect_credits AS credits, is_online, is_banned,
          COALESCE(account_status, 'ACTIVE') AS account_status,
          created_at, created_at AS "createdAt"
        FROM users
        ORDER BY created_at DESC
        LIMIT 10
      `),
    ]);

    const u = userCountsRes.rows[0] || {};
    const e = engagementCountsRes.rows[0] || {};
    const r = revenueCountsRes.rows[0] || {};
    const c = connectsCountsRes.rows[0] || {};
    const rep = reportCountsRes.rows[0] || {};

    const verificationStats = {};
    verificationSplitRes.rows.forEach((row) => {
      verificationStats[row.status] = row.count;
    });

    const stats = {
      // User KPIs
      totalUsers: u.total_users || 0,
      femaleUsers: u.female_users || 0,
      maleUsers: u.male_users || 0,
      totalVerified: u.total_verified || 0,
      pendingVerifications: u.pending_verifications || 0,
      failedVerifications: u.failed_verifications || 0,
      completedProfiles: u.completed_profiles || 0,
      incompleteProfiles: u.incomplete_profiles || 0,
      onlineNow: u.online_now || 0,
      onlineUsers: u.online_now || 0,
      activeToday: u.active_today || 0,
      newRegistrationsToday: u.new_registrations_today || 0,
      bannedUsers: u.banned_users || 0,
      suspendedUsers: u.suspended_users || 0,

      // Engagement KPIs
      totalLikes: e.total_likes || 0,
      totalCrushes: e.total_crushes || 0,
      totalVisitors: e.total_visitors || 0,
      totalConnectionRequests: e.total_connection_requests || 0,
      activeChats: e.active_chats || 0,
      expiredChats: e.expired_chats || 0,
      totalPrivateMessages: e.total_private_messages || 0,
      totalMessages: e.total_messages || 0,
      messagesToday: e.messages_today || 0,
      totalBlocks: e.total_blocks || 0,

      // Revenue & Connect KPIs
      totalRevenue: parseFloat(r.total_revenue) || 0,
      todayRevenue: parseFloat(r.today_revenue) || 0,
      weekRevenue: parseFloat(r.week_revenue) || 0,
      monthRevenue: parseFloat(r.month_revenue) || 0,
      successfulTransactions: r.successful_transactions || 0,
      failedTransactions: r.failed_transactions || 0,
      refundedTransactions: r.refunded_transactions || 0,
      totalTransactions: r.total_transactions || 0,
      totalConnectsAvailable: c.total_connects_available || 0,
      totalConnectsPurchased: c.total_connects_purchased || 0,
      totalConnectsSpent: c.total_connects_spent || 0,

      // Moderation KPIs
      openReports: rep.open_reports || 0,
      resolvedReports: rep.resolved_reports || 0,
      rejectedReports: rep.rejected_reports || 0,
      escalatedReports: rep.escalated_reports || 0,
      highPriorityReports: rep.high_priority_reports || 0,
      usersFlaggedMultipleTimes: rep.users_flagged_multiple_times || 0,

      // Chart Series
      revenueByDay: revenueByDayRes.rows.map((row) => ({
        day: row.day,
        revenue: parseFloat(row.revenue) || 0,
        tx_count: row.tx_count,
      })),
      userGrowthByDay: userGrowthByDayRes.rows,
      messagesByDay: messagesByDayRes.rows,
      genderSplit: genderSplitRes.rows,
      verificationSplit: verificationSplitRes.rows,
      verificationStats,
      connectUsageBreakdown: connectUsageRes.rows,
      reportsByCategory: reportsByCategoryRes.rows,
      cityWiseUsers: cityWiseRes.rows,
      recentUsers: recentUsersRes.rows,
    };

    return res.status(200).json({
      success: true,
      range,
      stats,
      ...stats,
    });
  } catch (err) {
    console.error('[ADMIN] getDashboard error:', err);
    return fail(res, err.message, 500);
  }
};

// ── 3. User Management ────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 100);
    const offset = (page - 1) * limit;

    const {
      search = '',
      gender = '',
      selected_gender = '',
      ai_detected_gender = '',
      verified_gender = '',
      verification_status = '',
      profile_status = '',
      account_status = '',
      city = '',
      state = '',
      country = '',
      online = '',
      is_banned = '',
      min_connects = '',
      max_connects = '',
      created_from = '',
      created_to = '',
    } = req.query;

    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const idx = params.length;
      conditions.push(`(
        u.username ILIKE $${idx} OR
        u.nickname ILIKE $${idx} OR
        u.email ILIKE $${idx} OR
        u.phone ILIKE $${idx} OR
        u.city ILIKE $${idx} OR
        u.instagram ILIKE $${idx} OR
        u.telegram ILIKE $${idx} OR
        CAST(u.id AS TEXT) = $${idx + 1}
      )`);
      params.push(search.trim());
    }

    if (gender) {
      params.push(gender.toLowerCase().trim());
      conditions.push(`LOWER(COALESCE(u.verified_gender, u.gender)) = $${params.length}`);
    }
    if (selected_gender) {
      params.push(selected_gender.toLowerCase().trim());
      conditions.push(`LOWER(u.selected_gender) = $${params.length}`);
    }
    if (ai_detected_gender) {
      params.push(ai_detected_gender.toLowerCase().trim());
      conditions.push(`LOWER(u.ai_detected_gender) = $${params.length}`);
    }
    if (verified_gender) {
      params.push(verified_gender.toLowerCase().trim());
      conditions.push(`LOWER(u.verified_gender) = $${params.length}`);
    }
    if (verification_status) {
      const vs = verification_status.toLowerCase().trim();
      if (vs === 'pending') {
        conditions.push(`LOWER(u.verification_status) IN ('pending', 'pending_selfie_verification', 'verification_in_progress')`);
      } else if (vs === 'rejected') {
        conditions.push(`LOWER(u.verification_status) IN ('rejected', 'verification_resubmission_required')`);
      } else {
        params.push(vs);
        conditions.push(`LOWER(u.verification_status) = $${params.length}`);
      }
    }
    if (profile_status) {
      const ps = profile_status.toUpperCase().trim();
      if (ps === 'COMPLETED') {
        conditions.push(`(u.profile_completed = true OR UPPER(u.profile_status) = 'COMPLETED')`);
      } else if (ps === 'INCOMPLETE') {
        conditions.push(`(COALESCE(u.profile_completed, false) = false AND UPPER(COALESCE(u.profile_status, '')) != 'COMPLETED')`);
      } else {
        params.push(ps);
        conditions.push(`UPPER(u.profile_status) = $${params.length}`);
      }
    }
    if (account_status) {
      params.push(account_status.toUpperCase().trim());
      conditions.push(`UPPER(COALESCE(u.account_status, 'ACTIVE')) = $${params.length}`);
    }
    if (is_banned === 'true' || is_banned === true) {
      conditions.push(`(u.is_banned = true OR UPPER(u.account_status) = 'BANNED')`);
    }
    if (city && city.trim()) {
      params.push(`%${city.trim()}%`);
      conditions.push(`u.city ILIKE $${params.length}`);
    }
    if (state && state.trim()) {
      params.push(`%${state.trim()}%`);
      conditions.push(`u.state ILIKE $${params.length}`);
    }
    if (country && country.trim()) {
      params.push(`%${country.trim()}%`);
      conditions.push(`u.country ILIKE $${params.length}`);
    }
    if (online === 'true' || online === 'false') {
      params.push(online === 'true');
      conditions.push(`u.is_online = $${params.length}`);
    }
    if (min_connects !== '' && !isNaN(Number(min_connects))) {
      params.push(Number(min_connects));
      conditions.push(`COALESCE(u.connect_credits, 0) >= $${params.length}`);
    }
    if (max_connects !== '' && !isNaN(Number(max_connects))) {
      params.push(Number(max_connects));
      conditions.push(`COALESCE(u.connect_credits, 0) <= $${params.length}`);
    }
    if (created_from) {
      params.push(new Date(created_from));
      conditions.push(`u.created_at >= $${params.length}`);
    }
    if (created_to) {
      params.push(new Date(created_to));
      conditions.push(`u.created_at <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users u ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const listParams = [...params, limit, offset];
    const usersRes = await pool.query(
      `SELECT
         u.id, u.uuid, u.username, u.nickname, u.email, u.phone,
         u.gender, u.selected_gender, u.ai_detected_gender, u.verified_gender,
         u.gender_match_status, u.verification_status, u.verification_type, u.verified_at,
         u.profile_status, u.profile_completed, u.onboarding_status, u.profile_moderation_status,
         u.city, u.state, u.country, u.age, u.date_of_birth, u.bio,
         u.profile_photo, u.instagram, u.facebook, u.telegram,
         COALESCE(u.connect_credits, 0) AS connect_credits,
         COALESCE(u.connect_credits, 0) AS credits,
         u.connect_required_for_chat,
         u.is_online, u.last_seen, u.is_active, u.is_banned, u.ban_reason,
         COALESCE(u.account_status, CASE WHEN u.is_banned THEN 'BANNED' WHEN NOT u.is_active THEN 'DEACTIVATED' ELSE 'ACTIVE' END) AS account_status,
         u.role, u.admin_notes, u.created_at, u.created_at AS "createdAt", u.updated_at,
         (SELECT COUNT(*)::int FROM reports r WHERE r.reported_id = u.id) AS reports_against_count,
         (SELECT COUNT(*)::int FROM blocks b WHERE b.blocked_id = u.id) AS blocks_against_count
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      listParams
    );

    return res.status(200).json({
      success: true,
      users: usersRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[ADMIN] getUsers error:', err);
    return fail(res, err.message, 500);
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId) return fail(res, 'Valid user ID is required.', 400);

    const userRes = await pool.query(
      `SELECT
         u.id, u.uuid, u.username, u.nickname, u.email, u.phone, u.phone_verified,
         u.gender, u.selected_gender, u.ai_detected_gender, u.verified_gender,
         u.gender_match_status, u.verification_status, u.verification_type, u.verified_at,
         u.profile_status, u.profile_completed, u.onboarding_status, u.profile_moderation_status,
         u.country, u.state, u.city, u.age, u.date_of_birth, u.bio,
         u.profile_photo, u.marital_status, u.relationship_type, u.looking_for, u.interested_in,
         u.height, u.weight, u.body_type, u.education, u.profession, u.languages, u.languages_spoken,
         u.interests, u.hobbies, u.hair_color, u.eye_color, u.drinking, u.smoking, u.smoker,
         u.religion, u.children, u.ethnicity, u.personality_traits, u.sexual_practices, u.relationship_expectations,
         u.instagram, u.facebook, u.telegram,
         COALESCE(u.connect_credits, 0) AS connect_credits,
         COALESCE(u.connect_credits, 0) AS credits,
         u.connect_required_for_chat,
         u.is_online, u.last_seen, u.is_active, u.is_banned, u.ban_reason,
         COALESCE(u.account_status, CASE WHEN u.is_banned THEN 'BANNED' WHEN NOT u.is_active THEN 'DEACTIVATED' ELSE 'ACTIVE' END) AS account_status,
         u.role, u.admin_notes, u.created_at, u.updated_at
       FROM users u
       WHERE u.id = $1`,
      [userId]
    );

    if (!userRes.rows.length) {
      return fail(res, 'User not found.', 404);
    }
    const user = userRes.rows[0];

    const [
      verificationsRes,
      privatePhotosRes,
      privacySettingsRes,
      femalePermissionsRes,
      likesGivenRes,
      likesReceivedRes,
      crushesSentRes,
      crushesReceivedRes,
      visitorsRes,
      visitedRes,
      connectLedgerRes,
      transactionsRes,
      conversationsRes,
      reportsAgainstRes,
      reportsSubmittedRes,
      blocksByUserRes,
      blockedByUsersRes,
      auditLogsRes,
    ] = await Promise.all([
      pool.query(
        `SELECT id, verification_type, selfie_photo, document_photo, selected_gender,
                ai_gender_detected, gender_match_status, capture_source,
                ai_confidence_score, ai_liveness_score, face_count, failure_reason,
                status, review_notes, reviewed_by, submitted_at, reviewed_at
         FROM verification_requests
         WHERE user_id = $1
         ORDER BY submitted_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT id, photo_url, is_blurred, created_at
         FROM private_photos
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT * FROM user_privacy_settings WHERE user_id = $1 LIMIT 1`,
        [userId]
      ),
      pool.query(
        `SELECT fpp.*, u.username AS partner_username, u.email AS partner_email
         FROM female_privacy_permissions fpp
         LEFT JOIN users u ON u.id = CASE WHEN fpp.female_user_id = $1 THEN fpp.male_user_id ELSE fpp.female_user_id END
         WHERE fpp.female_user_id = $1 OR fpp.male_user_id = $1
         ORDER BY fpp.updated_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT l.id, l.liked_id AS target_id, u.username, u.gender, u.city, l.created_at
         FROM likes l JOIN users u ON u.id = l.liked_id
         WHERE l.liker_id = $1 ORDER BY l.created_at DESC LIMIT 30`,
        [userId]
      ),
      pool.query(
        `SELECT l.id, l.liker_id AS actor_id, u.username, u.gender, u.city, l.created_at
         FROM likes l JOIN users u ON u.id = l.liker_id
         WHERE l.liked_id = $1 ORDER BY l.created_at DESC LIMIT 30`,
        [userId]
      ),
      pool.query(
        `SELECT c.id, c.receiver_id AS target_id, u.username, u.gender, c.is_mutual, c.created_at
         FROM crushes c JOIN users u ON u.id = c.receiver_id
         WHERE c.sender_id = $1 ORDER BY c.created_at DESC LIMIT 30`,
        [userId]
      ),
      pool.query(
        `SELECT c.id, c.sender_id AS actor_id, u.username, u.gender, c.is_mutual, c.created_at
         FROM crushes c JOIN users u ON u.id = c.sender_id
         WHERE c.receiver_id = $1 ORDER BY c.created_at DESC LIMIT 30`,
        [userId]
      ),
      pool.query(
        `SELECT v.id, v.visitor_id AS actor_id, u.username, u.gender, u.city, v.visited_at
         FROM visits v JOIN users u ON u.id = v.visitor_id
         WHERE v.visited_id = $1 ORDER BY v.visited_at DESC LIMIT 30`,
        [userId]
      ),
      pool.query(
        `SELECT v.id, v.visited_id AS target_id, u.username, u.gender, u.city, v.visited_at
         FROM visits v JOIN users u ON u.id = v.visited_id
         WHERE v.visitor_id = $1 ORDER BY v.visited_at DESC LIMIT 30`,
        [userId]
      ),
      pool.query(
        `SELECT ct.*, ru.username AS related_username
         FROM connect_transactions ct
         LEFT JOIN users ru ON ru.id = ct.related_user_id
         WHERE ct.user_id = $1
         ORDER BY ct.created_at DESC
         LIMIT 50`,
        [userId]
      ),
      pool.query(
        `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      ),
      pool.query(
        `SELECT c.*,
                u1.username AS user1_username, u1.gender AS user1_gender,
                u2.username AS user2_username, u2.gender AS user2_gender,
                (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id) AS message_count,
                (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_preview
         FROM conversations c
         LEFT JOIN users u1 ON u1.id = c.user1_id
         LEFT JOIN users u2 ON u2.id = c.user2_id
         WHERE c.user1_id = $1 OR c.user2_id = $1
         ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
         LIMIT 50`,
        [userId]
      ),
      pool.query(
        `SELECT r.*, u.username AS reporter_username, u.email AS reporter_email
         FROM reports r
         LEFT JOIN users u ON u.id = r.reporter_id
         WHERE r.reported_id = $1
         ORDER BY r.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT r.*, u.username AS reported_username, u.email AS reported_email
         FROM reports r
         LEFT JOIN users u ON u.id = r.reported_id
         WHERE r.reporter_id = $1
         ORDER BY r.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT b.*, u.username AS blocked_username, u.email AS blocked_email, u.gender AS blocked_gender
         FROM blocks b
         LEFT JOIN users u ON u.id = b.blocked_id
         WHERE b.blocker_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT b.*, u.username AS blocker_username, u.email AS blocker_email, u.gender AS blocker_gender
         FROM blocks b
         LEFT JOIN users u ON u.id = b.blocker_id
         WHERE b.blocked_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT * FROM admin_audit_logs
         WHERE target_id = $1 OR admin_id = $2
         ORDER BY created_at DESC
         LIMIT 50`,
        [String(userId), userId]
      ),
    ]);

    const chats = conversationsRes.rows.filter((c) => (c.communication_type || 'CHAT') === 'CHAT');
    const privateMessages = conversationsRes.rows.filter((c) => c.communication_type === 'PRIVATE_MESSAGE');

    return res.status(200).json({
      success: true,
      user,
      verificationHistory: verificationsRes.rows,
      photos: {
        profilePhoto: user.profile_photo,
        privatePhotos: privatePhotosRes.rows,
      },
      privacy: {
        settings: privacySettingsRes.rows[0] || null,
        femalePermissions: femalePermissionsRes.rows,
      },
      activity: {
        likesGiven: likesGivenRes.rows,
        likesReceived: likesReceivedRes.rows,
        crushesSent: crushesSentRes.rows,
        crushesReceived: crushesReceivedRes.rows,
        visitors: visitorsRes.rows,
        visited: visitedRes.rows,
      },
      connects: {
        currentBalance: user.connect_credits,
        connectRequiredForChat: user.connect_required_for_chat,
        ledger: connectLedgerRes.rows,
      },
      transactions: transactionsRes.rows,
      chats,
      privateMessages,
      reports: {
        againstUser: reportsAgainstRes.rows,
        submittedByUser: reportsSubmittedRes.rows,
      },
      blocks: {
        blockedByUser: blocksByUserRes.rows,
        blockedByOthers: blockedByUsersRes.rows,
      },
      auditHistory: auditLogsRes.rows,
    });
  } catch (err) {
    console.error('[ADMIN] getUserDetail error:', err);
    return fail(res, err.message, 500);
  }
};

exports.updateUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id, 10);
    const prevRes = await client.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    if (!prevRes.rows.length) return fail(res, 'User not found.', 404);
    const prev = prevRes.rows[0];

    const allowedFields = [
      'username', 'nickname', 'email', 'phone', 'city', 'state', 'country',
      'age', 'bio', 'gender', 'selected_gender', 'verified_gender',
      'verification_status', 'profile_status', 'profile_completed',
      'profile_moderation_status', 'connect_required_for_chat',
      'instagram', 'facebook', 'telegram', 'admin_notes', 'role',
    ];

    const updates = [];
    const values = [];
    const changed = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        values.push(req.body[field]);
        updates.push(`${field} = $${values.length}`);
        changed[field] = req.body[field];
      }
    }

    if (updates.length === 0) {
      return fail(res, 'No valid fields provided for update.', 400);
    }

    await client.query('BEGIN');
    values.push(userId);
    const updateRes = await client.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );

    await logAdminAction(
      req,
      {
        actionType: 'USER_EDIT',
        targetType: 'user',
        targetId: userId,
        previousValue: { username: prev.username, email: prev.email, gender: prev.gender, profile_status: prev.profile_status },
        newValue: changed,
        reason: req.body.reason || 'Admin profile edit',
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, { user: updateRes.rows[0], message: 'User updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] updateUser error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

exports.updateUserStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id, 10);
    const rawStatus = String(req.body.account_status || req.body.status || '').toUpperCase().trim();
    const reason = (req.body.reason || req.body.ban_reason || '').trim();

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'BANNED', 'DEACTIVATED', 'PENDING_REVIEW'];
    if (!validStatuses.includes(rawStatus)) {
      return fail(res, `Invalid account status. Allowed: ${validStatuses.join(', ')}`, 400);
    }

    await client.query('BEGIN');
    const prevRes = await client.query(
      `SELECT id, username, account_status, is_active, is_banned, ban_reason FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    if (!prevRes.rows.length) {
      await client.query('ROLLBACK');
      return fail(res, 'User not found.', 404);
    }
    const prev = prevRes.rows[0];

    const isBanned = ['BANNED', 'BLOCKED'].includes(rawStatus);
    const isActive = rawStatus === 'ACTIVE' || rawStatus === 'PENDING_REVIEW';

    const updatedRes = await client.query(
      `UPDATE users
       SET account_status = $1::varchar,
           is_banned = $2::boolean,
           is_active = $3::boolean,
           ban_reason = CASE WHEN $4::text != '' THEN $4::text ELSE ban_reason END,
           updated_at = NOW()
       WHERE id = $5::int
       RETURNING id, username, email, account_status, is_active, is_banned, ban_reason`,
      [rawStatus, isBanned, isActive, reason, userId]
    );

    await logAdminAction(
      req,
      {
        actionType: 'USER_STATUS_CHANGE',
        targetType: 'user',
        targetId: userId,
        previousValue: { account_status: prev.account_status, is_banned: prev.is_banned, is_active: prev.is_active },
        newValue: { account_status: rawStatus, is_banned: isBanned, is_active: isActive },
        reason: reason || `Status changed to ${rawStatus}`,
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, { user: updatedRes.rows[0], message: `User status updated to ${rawStatus}.` });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] updateUserStatus error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

exports.banUser = async (req, res) => {
  req.body.account_status = 'BANNED';
  return exports.updateUserStatus(req, res);
};

exports.unbanUser = async (req, res) => {
  req.body.account_status = 'ACTIVE';
  req.body.reason = req.body.reason || 'Unbanned by admin';
  return exports.updateUserStatus(req, res);
};

exports.verifyUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id, 10);
    const action = String(req.body.action || 'approve').toLowerCase().trim();
    const overrideGender = req.body.verified_gender ? String(req.body.verified_gender).toLowerCase().trim() : null;
    const reason = (req.body.reason || req.body.notes || '').trim();

    await client.query('BEGIN');
    const userRes = await client.query(`SELECT * FROM users WHERE id = $1 FOR UPDATE`, [userId]);
    if (!userRes.rows.length) {
      await client.query('ROLLBACK');
      return fail(res, 'User not found.', 404);
    }
    const prev = userRes.rows[0];
    const targetGender = overrideGender || prev.selected_gender || prev.gender || 'male';
    const connectRequired = targetGender === 'male';

    let newVerStatus = 'verified';
    let newMatchStatus = 'MATCH';
    let newOnboardingStatus = prev.profile_completed ? 'PROFILE_COMPLETED' : 'PROFILE_INCOMPLETE';

    if (action === 'reject') {
      newVerStatus = 'rejected';
      newMatchStatus = 'FAILED';
      newOnboardingStatus = 'VERIFICATION_RESUBMISSION_REQUIRED';
    } else if (action === 'resubmit') {
      newVerStatus = 'VERIFICATION_RESUBMISSION_REQUIRED';
      newMatchStatus = 'FAILED';
      newOnboardingStatus = 'VERIFICATION_RESUBMISSION_REQUIRED';
    }

    const updatedUser = await client.query(
      `UPDATE users
       SET verification_status = $1::varchar,
           gender = $2::varchar,
           selected_gender = $2::varchar,
           verified_gender = CASE WHEN $1::varchar = 'verified' THEN $2::varchar ELSE verified_gender END,
           gender_match_status = $3::varchar,
           connect_required_for_chat = $4::boolean,
           onboarding_status = $5::varchar,
           verified_at = CASE WHEN $1::varchar = 'verified' THEN NOW() ELSE verified_at END,
           updated_at = NOW()
       WHERE id = $6::int
       RETURNING *`,
      [newVerStatus, targetGender, newMatchStatus, connectRequired, newOnboardingStatus, userId]
    );

    await client.query(
      `UPDATE verification_requests
       SET status = $1,
           reviewed_by = $2,
           review_notes = $3,
           reviewed_at = NOW()
       WHERE id = (
         SELECT id FROM verification_requests WHERE user_id = $4 ORDER BY submitted_at DESC LIMIT 1
       )`,
      [action === 'approve' ? 'approved' : 'rejected', req.admin.id, reason || `Admin ${action}`, userId]
    );

    await logAdminAction(
      req,
      {
        actionType: 'USER_VERIFY',
        targetType: 'user',
        targetId: userId,
        previousValue: {
          verification_status: prev.verification_status,
          verified_gender: prev.verified_gender,
          gender_match_status: prev.gender_match_status,
        },
        newValue: {
          action,
          verification_status: newVerStatus,
          verified_gender: targetGender,
          gender_match_status: newMatchStatus,
          connect_required_for_chat: connectRequired,
        },
        reason: reason || `Admin verification ${action}`,
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, {
      user: updatedUser.rows[0],
      message: `User verification ${action}d successfully.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] verifyUser error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

exports.adjustUserConnects = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id || req.body.user_id, 10);
    const rawAmount = parseInt(req.body.amount ?? req.body.credits, 10);
    const operation = String(req.body.operation || req.body.action || 'add').toLowerCase();
    const reason = (req.body.reason || req.body.description || 'Manual admin adjustment').trim();

    if (!userId || isNaN(rawAmount) || rawAmount < 0) {
      return fail(res, 'Valid user_id and non-negative Connect amount are required.', 400);
    }

    await client.query('BEGIN');
    const userRes = await client.query(
      `SELECT id, username, COALESCE(connect_credits, 0) AS connect_credits FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    if (!userRes.rows.length) {
      await client.query('ROLLBACK');
      return fail(res, 'User not found.', 404);
    }

    const user = userRes.rows[0];
    const previousBalance = parseInt(user.connect_credits, 10) || 0;
    let newBalance = previousBalance;
    let delta = 0;

    if (operation === 'deduct' || operation === 'subtract') {
      if (previousBalance < rawAmount) {
        await client.query('ROLLBACK');
        return fail(res, `Cannot deduct ${rawAmount} Connects. User only has ${previousBalance} Connects.`, 400);
      }
      newBalance = previousBalance - rawAmount;
      delta = -rawAmount;
    } else if (operation === 'set') {
      newBalance = rawAmount;
      delta = newBalance - previousBalance;
    } else {
      newBalance = previousBalance + rawAmount;
      delta = rawAmount;
    }

    await client.query(
      `UPDATE users SET connect_credits = $1, updated_at = NOW() WHERE id = $2`,
      [newBalance, userId]
    );

    const txRes = await client.query(
      `INSERT INTO connect_transactions
         (user_id, transaction_type, amount, previous_balance, new_balance, status, description)
       VALUES ($1, 'ADMIN_ADJUSTMENT', $2, $3, $4, 'COMPLETED', $5)
       RETURNING *`,
      [userId, delta, previousBalance, newBalance, reason]
    );

    await logAdminAction(
      req,
      {
        actionType: 'CONNECT_ADJUST',
        targetType: 'user',
        targetId: userId,
        previousValue: { connect_credits: previousBalance },
        newValue: { connect_credits: newBalance, delta, operation },
        reason,
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, {
      user_id: userId,
      username: user.username,
      previous_balance: previousBalance,
      new_balance: newBalance,
      delta,
      transaction: txRes.rows[0],
      message: `Connect balance updated (${previousBalance} → ${newBalance}).`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] adjustUserConnects error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

exports.deleteUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id, 10);
    const hardDelete = req.query.hard === 'true' || req.body?.hard === true;
    const reason = (req.body?.reason || 'Deleted by admin').trim();

    if (userId === req.admin.id) {
      return fail(res, 'You cannot delete your own admin account.', 400);
    }

    await client.query('BEGIN');
    const prevRes = await client.query(`SELECT id, username, email, role FROM users WHERE id = $1 FOR UPDATE`, [userId]);
    if (!prevRes.rows.length) {
      await client.query('ROLLBACK');
      return fail(res, 'User not found.', 404);
    }
    const prev = prevRes.rows[0];

    if (hardDelete) {
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    } else {
      await client.query(
        `UPDATE users
         SET is_active = false,
             is_banned = true,
             account_status = 'DEACTIVATED',
             ban_reason = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [reason, userId]
      );
    }

    await logAdminAction(
      req,
      {
        actionType: 'USER_DELETE',
        targetType: 'user',
        targetId: userId,
        previousValue: prev,
        newValue: { deleted: true, hardDelete },
        reason,
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, { message: hardDelete ? 'User permanently deleted.' : 'User deactivated and removed.' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] deleteUser error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

// ── 4. Verification Queue Management ──────────────────────────────────────────
exports.getVerifications = async (req, res) => {
  try {
    const status = (req.query.status || 'all').toLowerCase();
    const gender = (req.query.gender || '').toLowerCase();
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      if (status === 'mismatch') {
        conditions.push(`vr.gender_match_status = 'MISMATCH'`);
      } else {
        params.push(status);
        conditions.push(`LOWER(vr.status) = $${params.length}`);
      }
    }
    if (gender) {
      params.push(gender);
      conditions.push(`LOWER(COALESCE(vr.selected_gender, u.gender)) = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.username ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM verification_requests vr
       JOIN users u ON u.id = vr.user_id
       ${whereClause}`,
      params
    );

    const listRes = await pool.query(
      `SELECT
         vr.id, vr.user_id, vr.verification_type,
         vr.selfie_photo AS selfie_url, vr.document_photo AS document_url,
         vr.selected_gender, vr.ai_gender_detected AS ai_detected_gender,
         vr.gender_match_status, vr.capture_source,
         vr.ai_confidence_score AS ai_confidence,
         vr.ai_liveness_score AS ai_is_live,
         vr.face_count, vr.failure_reason, vr.status,
         vr.review_notes, vr.submitted_at, vr.reviewed_at,
         u.username, u.nickname, u.email, u.gender, u.verified_gender,
         u.verification_status, u.profile_status, u.city, u.age
       FROM verification_requests vr
       JOIN users u ON u.id = vr.user_id
       ${whereClause}
       ORDER BY vr.submitted_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const summaryRes = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
        COUNT(*) FILTER (WHERE gender_match_status = 'MISMATCH')::int AS mismatch
      FROM verification_requests
    `);

    return ok(res, {
      requests: listRes.rows,
      summary: summaryRes.rows[0] || {},
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[ADMIN] getVerifications error:', err);
    return fail(res, err.message, 500);
  }
};

exports.reviewVerificationRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const reqId = parseInt(req.params.id, 10);
    const action = String(req.body.action || req.params.action || 'approve').toLowerCase();
    const reason = (req.body.reason || req.body.review_notes || '').trim();
    const overrideGender = req.body.verified_gender ? String(req.body.verified_gender).toLowerCase() : null;

    await client.query('BEGIN');
    const vrRes = await client.query(
      `SELECT vr.*, u.selected_gender AS user_selected_gender, u.gender AS user_gender, u.profile_completed
       FROM verification_requests vr
       JOIN users u ON u.id = vr.user_id
       WHERE vr.id = $1
       FOR UPDATE`,
      [reqId]
    );

    if (!vrRes.rows.length) {
      await client.query('ROLLBACK');
      return fail(res, 'Verification request not found.', 404);
    }

    const vr = vrRes.rows[0];
    const verifiedGender = overrideGender || vr.selected_gender || vr.user_selected_gender || vr.user_gender || 'male';
    const isApproved = action === 'approve' || action === 'approved';
    const newReqStatus = isApproved ? 'approved' : 'rejected';
    const newUserVerStatus = isApproved ? 'verified' : 'VERIFICATION_RESUBMISSION_REQUIRED';
    const newMatchStatus = isApproved ? 'MATCH' : (vr.gender_match_status || 'FAILED');
    const connectRequired = verifiedGender === 'male';

    await client.query(
      `UPDATE verification_requests
       SET status = $1,
           gender_match_status = $2,
           reviewed_by = $3,
           review_notes = $4,
           reviewed_at = NOW()
       WHERE id = $5`,
      [newReqStatus, newMatchStatus, req.admin.id, reason || `Admin ${newReqStatus}`, reqId]
    );

    await client.query(
      `UPDATE users
       SET verification_status = $1::varchar,
           verified_gender = CASE WHEN $2::boolean THEN $3::varchar ELSE verified_gender END,
           gender = $3::varchar,
           selected_gender = $3::varchar,
           gender_match_status = $4::varchar,
           connect_required_for_chat = $5::boolean,
           onboarding_status = CASE
             WHEN $2::boolean AND profile_completed = true THEN 'PROFILE_COMPLETED'
             WHEN $2::boolean THEN 'PROFILE_INCOMPLETE'
             ELSE 'VERIFICATION_RESUBMISSION_REQUIRED'
           END,
           verified_at = CASE WHEN $2::boolean THEN NOW() ELSE verified_at END,
           updated_at = NOW()
       WHERE id = $6::int`,
      [newUserVerStatus, isApproved, verifiedGender, newMatchStatus, connectRequired, vr.user_id]
    );

    await logAdminAction(
      req,
      {
        actionType: 'VERIFICATION_REVIEW',
        targetType: 'verification_request',
        targetId: reqId,
        previousValue: { status: vr.status, user_id: vr.user_id },
        newValue: { status: newReqStatus, verified_gender: verifiedGender, user_id: vr.user_id },
        reason: reason || `Verification ${newReqStatus}`,
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, {
      request_id: reqId,
      user_id: vr.user_id,
      status: newReqStatus,
      message: `Verification request ${newReqStatus}.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] reviewVerificationRequest error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

// ── 5. Reports Management ─────────────────────────────────────────────────────
exports.getReports = async (req, res) => {
  try {
    const status = (req.query.status || '').toLowerCase();
    const priority = (req.query.priority || '').toLowerCase();
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`LOWER(COALESCE(r.status, 'pending')) = $${params.length}`);
    }
    if (priority && priority !== 'all') {
      params.push(priority);
      conditions.push(`LOWER(COALESCE(r.priority, 'medium')) = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(
        reporter.username ILIKE $${params.length} OR
        reported.username ILIKE $${params.length} OR
        r.reason ILIKE $${params.length} OR
        r.description ILIKE $${params.length}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM reports r
       LEFT JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN users reported ON reported.id = r.reported_id
       ${whereClause}`,
      params
    );

    const listRes = await pool.query(
      `SELECT
         r.*,
         COALESCE(r.status, 'pending') AS status,
         COALESCE(r.priority, 'medium') AS priority,
         reporter.username AS reporter_name,
         reporter.email AS reporter_email,
         reporter.gender AS reporter_gender,
         reported.username AS reported_name,
         reported.email AS reported_email,
         reported.gender AS reported_gender,
         reported.account_status AS reported_account_status,
         reported.is_banned AS reported_is_banned,
         (SELECT COUNT(*)::int FROM reports r2 WHERE r2.reported_id = r.reported_id) AS reported_total_reports,
         reviewer.username AS reviewed_by_name
       FROM reports r
       LEFT JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN users reported ON reported.id = r.reported_id
       LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
       ${whereClause}
       ORDER BY
         CASE WHEN COALESCE(r.status, 'pending') = 'pending' THEN 0
              WHEN r.status = 'escalated' THEN 1
              ELSE 2 END,
         r.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      reports: listRes.rows,
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[ADMIN] getReports error:', err);
    return fail(res, err.message, 500);
  }
};

exports.getReportDetail = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT
         r.*,
         reporter.username AS reporter_name, reporter.email AS reporter_email, reporter.gender AS reporter_gender, reporter.city AS reporter_city,
         reported.username AS reported_name, reported.email AS reported_email, reported.gender AS reported_gender, reported.city AS reported_city,
         reported.account_status AS reported_account_status, reported.is_banned AS reported_is_banned, reported.connect_credits AS reported_connects
       FROM reports r
       LEFT JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN users reported ON reported.id = r.reported_id
       WHERE r.id = $1`,
      [reportId]
    );

    if (!rows.length) return fail(res, 'Report not found.', 404);
    const report = rows[0];

    const historyRes = await pool.query(
      `SELECT r.id, r.reason, r.description, r.status, r.created_at, u.username AS reporter_name
       FROM reports r
       LEFT JOIN users u ON u.id = r.reporter_id
       WHERE r.reported_id = $1 AND r.id != $2
       ORDER BY r.created_at DESC`,
      [report.reported_id, reportId]
    );

    const recentMessagesRes = await pool.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.communication_type, m.created_at,
              su.username AS sender_name
       FROM messages m
       LEFT JOIN users su ON su.id = m.sender_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at DESC
       LIMIT 20`,
      [report.reporter_id, report.reported_id]
    );

    return ok(res, {
      report,
      priorReportsAgainstUser: historyRes.rows,
      recentMessagesBetweenUsers: recentMessagesRes.rows,
    });
  } catch (err) {
    console.error('[ADMIN] getReportDetail error:', err);
    return fail(res, err.message, 500);
  }
};

exports.handleReportAction = async (req, res) => {
  const client = await pool.connect();
  try {
    const reportId = parseInt(req.params.id, 10);
    if (!reportId || isNaN(reportId)) {
      return fail(res, 'Valid report ID is required.', 400);
    }

    const action = String(req.params.action || req.body.action || 'resolve').toLowerCase().trim();
    const resolutionAction = String(req.body.resolution_action || 'none').trim();
    const adminNotes = String(req.body.admin_notes || req.body.notes || req.body.reason || '').trim();
    const customPriority = req.body.priority ? String(req.body.priority).toLowerCase().trim() : '';

    let newStatus = 'resolved';
    if (req.body.status && (action === 'edit' || action === 'update' || !req.params.action)) {
      newStatus = String(req.body.status).toLowerCase().trim();
    } else if (action === 'reject' || action === 'dismiss' || action === 'dismissed') {
      newStatus = 'rejected';
    } else if (action === 'escalate' || action === 'escalated') {
      newStatus = 'escalated';
    } else if (action === 'investigating' || action === 'review' || action === 'reviewed') {
      newStatus = 'investigating';
    } else if (action === 'pending' || action === 'open' || action === 'reopen') {
      newStatus = 'pending';
    }

    await client.query('BEGIN');
    const repRes = await client.query(`SELECT * FROM reports WHERE id = $1::int FOR UPDATE`, [reportId]);
    if (!repRes.rows.length) {
      await client.query('ROLLBACK');
      return fail(res, 'Report not found.', 404);
    }
    const report = repRes.rows[0];

    const updatedRes = await client.query(
      `UPDATE reports
       SET status = $1::varchar,
           priority = CASE
             WHEN $6::varchar != '' THEN $6::varchar
             WHEN $1::varchar = 'escalated' THEN 'critical'
             ELSE COALESCE(priority, 'medium')
           END,
           resolution_action = $2::varchar,
           admin_notes = COALESCE(NULLIF($3::text, ''), admin_notes),
           reviewed_by = $4::int,
           resolved_at = CASE WHEN $1::varchar IN ('resolved', 'rejected', 'dismissed') THEN NOW() ELSE resolved_at END,
           updated_at = NOW()
       WHERE id = $5::int
       RETURNING *`,
      [newStatus, resolutionAction, adminNotes, req.admin.id, reportId, customPriority]
    );

    // Optional enforcement action against reported user
    if (report.reported_id && ['ban_user', 'suspend_user', 'block_user'].includes(resolutionAction)) {
      const targetAccountStatus = resolutionAction === 'ban_user' ? 'BANNED' : resolutionAction === 'suspend_user' ? 'SUSPENDED' : 'BLOCKED';
      await client.query(
        `UPDATE users
         SET account_status = $1,
             is_banned = $2,
             is_active = false,
             ban_reason = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [targetAccountStatus, targetAccountStatus === 'BANNED', adminNotes || `Action from Report #${reportId}`, report.reported_id]
      );
    } else if (report.reported_id && resolutionAction === 'warn_user') {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body)
         VALUES ($1, 'system_warning', 'Community Guidelines Warning', $2)`,
        [report.reported_id, adminNotes || 'Your account received a moderation warning for violating community guidelines.']
      );
    }

    await logAdminAction(
      req,
      {
        actionType: `REPORT_${newStatus.toUpperCase()}`,
        targetType: 'report',
        targetId: reportId,
        previousValue: { status: report.status },
        newValue: { status: newStatus, resolution_action: resolutionAction, reported_id: report.reported_id },
        reason: adminNotes || `Report ${newStatus}`,
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, {
      report: updatedRes.rows[0],
      message: `Report #${reportId} marked as ${newStatus}.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] handleReportAction error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

// ── 6. Blocks Management ──────────────────────────────────────────────────────
exports.getBlocks = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(blocker.username ILIKE $1 OR blocked.username ILIKE $1 OR b.reason ILIKE $1)`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes, blocksRes, mostBlockedRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM blocks b
         LEFT JOIN users blocker ON blocker.id = b.blocker_id
         LEFT JOIN users blocked ON blocked.id = b.blocked_id
         ${whereClause}`,
        params
      ),
      pool.query(
        `SELECT
           b.id, b.blocker_id, b.blocked_id, b.reason, b.created_at,
           blocker.username AS blocker_username, blocker.email AS blocker_email, blocker.gender AS blocker_gender,
           blocked.username AS blocked_username, blocked.email AS blocked_email, blocked.gender AS blocked_gender,
           blocked.account_status AS blocked_account_status
         FROM blocks b
         LEFT JOIN users blocker ON blocker.id = b.blocker_id
         LEFT JOIN users blocked ON blocked.id = b.blocked_id
         ${whereClause}
         ORDER BY b.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(`
        SELECT u.id, u.username, u.email, u.gender, u.account_status, COUNT(b.id)::int AS blocked_count
        FROM blocks b
        JOIN users u ON u.id = b.blocked_id
        GROUP BY u.id
        ORDER BY blocked_count DESC
        LIMIT 10
      `),
    ]);

    return ok(res, {
      blocks: blocksRes.rows,
      mostBlockedUsers: mostBlockedRes.rows,
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[ADMIN] getBlocks error:', err);
    return fail(res, err.message, 500);
  }
};

exports.removeBlock = async (req, res) => {
  try {
    const blockId = parseInt(req.params.id, 10);
    const prevRes = await pool.query(`DELETE FROM blocks WHERE id = $1 RETURNING *`, [blockId]);
    if (!prevRes.rows.length) return fail(res, 'Block record not found.', 404);

    await logAdminAction(req, {
      actionType: 'BLOCK_REMOVE',
      targetType: 'block',
      targetId: blockId,
      previousValue: prevRes.rows[0],
      reason: req.body?.reason || 'Block removed by admin',
    });

    return ok(res, { message: 'Block removed successfully.' });
  } catch (err) {
    console.error('[ADMIN] removeBlock error:', err);
    return fail(res, err.message, 500);
  }
};

// ── 7. Transactions, Payments & Refunds ───────────────────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const status = (req.query.status || '').toLowerCase();
    const search = (req.query.search || '').trim();
    const type = (req.query.transaction_type || '').toUpperCase();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const txConditions = [];
    const txParams = [];
    if (status && status !== 'all') {
      txParams.push(status);
      txConditions.push(`LOWER(t.status) = $${txParams.length}`);
    }
    if (search) {
      txParams.push(`%${search}%`);
      txConditions.push(`(u.username ILIKE $${txParams.length} OR u.email ILIKE $${txParams.length} OR t.pack_name ILIKE $${txParams.length} OR COALESCE(t.razorpay_payment_id, '') ILIKE $${txParams.length})`);
    }
    const txWhere = txConditions.length ? `WHERE ${txConditions.join(' AND ')}` : '';

    const ledgerConditions = [];
    const ledgerParams = [];
    if (type && type !== 'ALL') {
      ledgerParams.push(type);
      ledgerConditions.push(`UPPER(ct.transaction_type) = $${ledgerParams.length}`);
    }
    if (search) {
      ledgerParams.push(`%${search}%`);
      ledgerConditions.push(`(u.username ILIKE $${ledgerParams.length} OR ct.description ILIKE $${ledgerParams.length})`);
    }
    const ledgerWhere = ledgerConditions.length ? `WHERE ${ledgerConditions.join(' AND ')}` : '';

    const [paymentsRes, paymentsCountRes, ledgerRes, ledgerCountRes, summaryRes] = await Promise.all([
      pool.query(
        `SELECT
           t.*,
           u.username, u.email, u.gender, u.city
         FROM transactions t
         LEFT JOIN users u ON u.id = t.user_id
         ${txWhere}
         ORDER BY t.created_at DESC
         LIMIT $${txParams.length + 1} OFFSET $${txParams.length + 2}`,
        [...txParams, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM transactions t LEFT JOIN users u ON u.id = t.user_id ${txWhere}`,
        txParams
      ),
      pool.query(
        `SELECT
           ct.*,
           u.username, u.email, u.gender,
           ru.username AS related_username
         FROM connect_transactions ct
         LEFT JOIN users u ON u.id = ct.user_id
         LEFT JOIN users ru ON ru.id = ct.related_user_id
         ${ledgerWhere}
         ORDER BY ct.created_at DESC
         LIMIT $${ledgerParams.length + 1} OFFSET $${ledgerParams.length + 2}`,
        [...ledgerParams, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM connect_transactions ct LEFT JOIN users u ON u.id = ct.user_id ${ledgerWhere}`,
        ledgerParams
      ),
      pool.query(`
        SELECT
          COALESCE(SUM(amount_inr) FILTER (WHERE status IN ('success', 'completed', 'paid')), 0)::numeric AS total_revenue,
          COALESCE(SUM(amount_inr) FILTER (WHERE status IN ('success', 'completed', 'paid') AND created_at >= CURRENT_DATE), 0)::numeric AS today_revenue,
          COUNT(*) FILTER (WHERE status IN ('success', 'completed', 'paid'))::int AS successful_payments,
          COUNT(*) FILTER (WHERE status IN ('failed', 'cancelled'))::int AS failed_payments,
          COUNT(*) FILTER (WHERE status = 'refunded' OR refund_status = 'PROCESSED')::int AS refunded_payments,
          COALESCE(SUM(refund_amount_inr) FILTER (WHERE status = 'refunded' OR refund_status = 'PROCESSED'), 0)::numeric AS total_refunded_amount
        FROM transactions
      `),
    ]);

    return res.status(200).json({
      success: true,
      transactions: paymentsRes.rows,
      payments: paymentsRes.rows,
      connectTransactions: ledgerRes.rows,
      totalPayments: paymentsCountRes.rows[0]?.total || 0,
      totalConnectTransactions: ledgerCountRes.rows[0]?.total || 0,
      summary: summaryRes.rows[0] || {},
      page,
      limit,
    });
  } catch (err) {
    console.error('[ADMIN] getTransactions error:', err);
    return fail(res, err.message, 500);
  }
};

exports.refundPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const txId = parseInt(req.params.id, 10);
    const reason = (req.body.reason || 'Admin initiated refund').trim();
    const reverseConnects = req.body.reverse_connects !== false;

    await client.query('BEGIN');
    const txRes = await client.query(`SELECT * FROM transactions WHERE id = $1 FOR UPDATE`, [txId]);
    if (!txRes.rows.length) {
      await client.query('ROLLBACK');
      return fail(res, 'Transaction not found.', 404);
    }

    const tx = txRes.rows[0];
    if (tx.status === 'refunded' || tx.refund_status === 'PROCESSED') {
      await client.query('ROLLBACK');
      return fail(res, 'This transaction has already been refunded.', 400);
    }

    const refundAmount = parseFloat(req.body.refund_amount_inr || tx.amount_inr || 0);
    let connectsReversed = false;

    if (reverseConnects && tx.user_id && tx.credits_purchased > 0) {
      const uRes = await client.query(
        `SELECT id, COALESCE(connect_credits, 0) AS connect_credits FROM users WHERE id = $1 FOR UPDATE`,
        [tx.user_id]
      );
      if (uRes.rows.length) {
        const prevBal = uRes.rows[0].connect_credits;
        const newBal = Math.max(0, prevBal - tx.credits_purchased);
        const actualReversed = prevBal - newBal;

        await client.query(`UPDATE users SET connect_credits = $1, updated_at = NOW() WHERE id = $2`, [newBal, tx.user_id]);
        await client.query(
          `INSERT INTO connect_transactions
             (user_id, transaction_type, amount, previous_balance, new_balance, payment_reference, status, description)
           VALUES ($1, 'REFUND_REVERSAL', $2, $3, $4, $5, 'COMPLETED', $6)`,
          [tx.user_id, -actualReversed, prevBal, newBal, String(txId), `Refund reversal for Transaction #${txId}: ${reason}`]
        );
        connectsReversed = true;
      }
    }

    const updatedTx = await client.query(
      `UPDATE transactions
       SET status = 'refunded',
           refund_status = 'PROCESSED',
           refund_amount_inr = $1,
           refund_reason = $2,
           refunded_by = $3,
           refunded_at = NOW(),
           connects_reversed = $4
       WHERE id = $5
       RETURNING *`,
      [refundAmount, reason, req.admin.id, connectsReversed, txId]
    );

    await logAdminAction(
      req,
      {
        actionType: 'PAYMENT_REFUND',
        targetType: 'transaction',
        targetId: txId,
        previousValue: { status: tx.status, amount_inr: tx.amount_inr },
        newValue: { status: 'refunded', refund_amount_inr: refundAmount, connects_reversed: connectsReversed },
        reason,
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, {
      transaction: updatedTx.rows[0],
      message: `Transaction #${txId} refunded successfully.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] refundPayment error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

// ── 8. Connects & Connect Packages Management ─────────────────────────────────
exports.getConnectsOverview = async (req, res) => {
  try {
    const [packagesRes, commSettingsRes, breakdownRes, recentLedgerRes] = await Promise.all([
      pool.query(`SELECT * FROM connect_packs ORDER BY display_order ASC, price_inr ASC`),
      pool.query(`SELECT * FROM admin_communication_settings ORDER BY id ASC LIMIT 1`),
      pool.query(`
        SELECT
          transaction_type,
          COUNT(*)::int AS tx_count,
          COALESCE(SUM(ABS(amount)), 0)::int AS total_connects
        FROM connect_transactions
        GROUP BY transaction_type
        ORDER BY total_connects DESC
      `),
      pool.query(`
        SELECT ct.*, u.username, u.email, u.gender, ru.username AS related_username
        FROM connect_transactions ct
        LEFT JOIN users u ON u.id = ct.user_id
        LEFT JOIN users ru ON ru.id = ct.related_user_id
        ORDER BY ct.created_at DESC
        LIMIT 30
      `),
    ]);

    return ok(res, {
      packages: packagesRes.rows,
      communicationSettings: commSettingsRes.rows[0] || {},
      usageBreakdown: breakdownRes.rows,
      recentLedger: recentLedgerRes.rows,
    });
  } catch (err) {
    console.error('[ADMIN] getConnectsOverview error:', err);
    return fail(res, err.message, 500);
  }
};

exports.getConnectPackages = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM connect_packs ORDER BY display_order ASC, price_inr ASC`);
    return ok(res, { packages: rows });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.createConnectPackage = async (req, res) => {
  try {
    const {
      name,
      credits,
      price_inr,
      currency = 'INR',
      discount = 0,
      bonus_connects = 0,
      is_popular = false,
      is_active = true,
      display_order = 0,
    } = req.body;

    if (!name || !credits || price_inr === undefined) {
      return fail(res, 'Package name, credits, and price_inr are required.', 400);
    }

    const { rows } = await pool.query(
      `INSERT INTO connect_packs
         (name, credits, price_inr, currency, discount, bonus_connects, is_popular, is_active, display_order, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        name.trim(),
        parseInt(credits, 10),
        parseInt(price_inr, 10),
        currency,
        parseInt(discount, 10) || 0,
        parseInt(bonus_connects, 10) || 0,
        Boolean(is_popular),
        Boolean(is_active),
        parseInt(display_order, 10) || 0,
      ]
    );

    await logAdminAction(req, {
      actionType: 'PACKAGE_CREATE',
      targetType: 'package',
      targetId: rows[0].id,
      newValue: rows[0],
    });

    return ok(res, { package: rows[0], message: 'Connect package created.' }, 201);
  } catch (err) {
    console.error('[ADMIN] createConnectPackage error:', err);
    return fail(res, err.message, 500);
  }
};

exports.updateConnectPackage = async (req, res) => {
  try {
    const pkgId = parseInt(req.params.id, 10);
    const prevRes = await pool.query(`SELECT * FROM connect_packs WHERE id = $1`, [pkgId]);
    if (!prevRes.rows.length) return fail(res, 'Connect package not found.', 404);
    const prev = prevRes.rows[0];

    const name = req.body.name !== undefined ? req.body.name.trim() : prev.name;
    const credits = req.body.credits !== undefined ? parseInt(req.body.credits, 10) : prev.credits;
    const priceInr = req.body.price_inr !== undefined ? parseInt(req.body.price_inr, 10) : prev.price_inr;
    const currency = req.body.currency !== undefined ? req.body.currency : prev.currency;
    const discount = req.body.discount !== undefined ? parseInt(req.body.discount, 10) : prev.discount;
    const bonusConnects = req.body.bonus_connects !== undefined ? parseInt(req.body.bonus_connects, 10) : prev.bonus_connects;
    const isPopular = req.body.is_popular !== undefined ? Boolean(req.body.is_popular) : prev.is_popular;
    const isActive = req.body.is_active !== undefined ? Boolean(req.body.is_active) : prev.is_active;
    const displayOrder = req.body.display_order !== undefined ? parseInt(req.body.display_order, 10) : prev.display_order;

    const { rows } = await pool.query(
      `UPDATE connect_packs
       SET name = $1, credits = $2, price_inr = $3, currency = $4, discount = $5,
           bonus_connects = $6, is_popular = $7, is_active = $8, display_order = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, credits, priceInr, currency, discount, bonusConnects, isPopular, isActive, displayOrder, pkgId]
    );

    await logAdminAction(req, {
      actionType: 'PACKAGE_UPDATE',
      targetType: 'package',
      targetId: pkgId,
      previousValue: prev,
      newValue: rows[0],
    });

    return ok(res, { package: rows[0], message: 'Connect package updated.' });
  } catch (err) {
    console.error('[ADMIN] updateConnectPackage error:', err);
    return fail(res, err.message, 500);
  }
};

exports.deleteConnectPackage = async (req, res) => {
  try {
    const pkgId = parseInt(req.params.id, 10);
    const delRes = await pool.query(`DELETE FROM connect_packs WHERE id = $1 RETURNING *`, [pkgId]);
    if (!delRes.rows.length) return fail(res, 'Connect package not found.', 404);

    await logAdminAction(req, {
      actionType: 'PACKAGE_DELETE',
      targetType: 'package',
      targetId: pkgId,
      previousValue: delRes.rows[0],
    });

    return ok(res, { message: 'Connect package deleted.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

// ── 9. Chat & Private Message Management ──────────────────────────────────────
exports.getChats = async (req, res) => {
  try {
    const commType = (req.query.communication_type || '').toUpperCase();
    const status = (req.query.session_status || '').toUpperCase();
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    if (commType && commType !== 'ALL') {
      params.push(commType);
      conditions.push(`COALESCE(c.communication_type, 'CHAT') = $${params.length}`);
    }
    if (status && status !== 'ALL') {
      params.push(status);
      conditions.push(`UPPER(COALESCE(c.session_status, 'ACTIVE')) = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u1.username ILIKE $${params.length} OR u2.username ILIKE $${params.length})`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes, listRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM conversations c
         LEFT JOIN users u1 ON u1.id = c.user1_id
         LEFT JOIN users u2 ON u2.id = c.user2_id
         ${whereClause}`,
        params
      ),
      pool.query(
        `SELECT
           c.*,
           u1.username AS user1_username, u1.gender AS user1_gender, u1.email AS user1_email,
           u2.username AS user2_username, u2.gender AS user2_gender, u2.email AS user2_email,
           (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id AND COALESCE(m.is_deleted, false) = false) AS message_count,
           (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
           COALESCE((SELECT SUM(ABS(amount))::int FROM connect_transactions ct WHERE ct.related_conversation_id = c.id AND ct.amount < 0), 0) AS connects_spent
         FROM conversations c
         LEFT JOIN users u1 ON u1.id = c.user1_id
         LEFT JOIN users u2 ON u2.id = c.user2_id
         ${whereClause}
         ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    return ok(res, {
      conversations: listRes.rows,
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[ADMIN] getChats error:', err);
    return fail(res, err.message, 500);
  }
};

exports.getPrivateMessages = async (req, res) => {
  req.query.communication_type = 'PRIVATE_MESSAGE';
  return exports.getChats(req, res);
};

exports.getConversationMessages = async (req, res) => {
  try {
    const convId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT
         m.*,
         su.username AS sender_username, su.gender AS sender_gender,
         ru.username AS receiver_username, ru.gender AS receiver_gender
       FROM messages m
       LEFT JOIN users su ON su.id = m.sender_id
       LEFT JOIN users ru ON ru.id = m.receiver_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [convId]
    );
    return ok(res, { messages: rows });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.moderateConversation = async (req, res) => {
  const client = await pool.connect();
  try {
    const convId = parseInt(req.params.id, 10);
    const action = String(req.body.action || 'expire').toLowerCase();
    const extendMinutes = parseInt(req.body.extend_minutes, 10) || 60;
    const reason = (req.body.reason || `Admin conversation ${action}`).trim();

    await client.query('BEGIN');
    const convRes = await client.query(`SELECT * FROM conversations WHERE id = $1 FOR UPDATE`, [convId]);
    if (!convRes.rows.length) {
      await client.query('ROLLBACK');
      return fail(res, 'Conversation not found.', 404);
    }
    const conv = convRes.rows[0];

    let updatedConv;
    if (action === 'extend') {
      updatedConv = await client.query(
        `UPDATE conversations
         SET session_status = 'ACTIVE',
             expires_at = GREATEST(COALESCE(expires_at, NOW()), NOW()) + ($1 || ' minutes')::interval
         WHERE id = $2
         RETURNING *`,
        [String(extendMinutes), convId]
      );
    } else if (action === 'activate') {
      updatedConv = await client.query(
        `UPDATE conversations SET session_status = 'ACTIVE' WHERE id = $1 RETURNING *`,
        [convId]
      );
    } else {
      const targetStatus = action === 'close' ? 'CLOSED' : 'EXPIRED';
      updatedConv = await client.query(
        `UPDATE conversations
         SET session_status = $1,
             expires_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [targetStatus, convId]
      );
    }

    await logAdminAction(
      req,
      {
        actionType: 'CONVERSATION_MODERATE',
        targetType: 'conversation',
        targetId: convId,
        previousValue: { session_status: conv.session_status, expires_at: conv.expires_at },
        newValue: { action, session_status: updatedConv.rows[0].session_status, expires_at: updatedConv.rows[0].expires_at },
        reason,
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, {
      conversation: updatedConv.rows[0],
      message: `Conversation #${convId} updated (${action}).`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

// ── 10. Central Platform & Communication Settings ─────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    const [commRes, platRes] = await Promise.all([
      pool.query(`SELECT * FROM admin_communication_settings ORDER BY id ASC LIMIT 1`),
      pool.query(`SELECT category, settings, updated_at FROM admin_platform_settings ORDER BY category ASC`),
    ]);

    const platform = {};
    platRes.rows.forEach((r) => {
      platform[r.category] = r.settings;
    });

    return ok(res, {
      communication: commRes.rows[0] || {},
      platform,
    });
  } catch (err) {
    console.error('[ADMIN] getSettings error:', err);
    return fail(res, err.message, 500);
  }
};

exports.updateSettings = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const commFields = [
      'chat_start_cost', 'chat_message_access_cost', 'chat_reinitiate_cost', 'chat_expiry_minutes',
      'private_message_start_cost', 'private_message_access_cost', 'private_message_reinitiate_cost', 'private_message_expiry_hours',
      'promotional_connects', 'refund_enabled', 'female_connect_exemption',
      'like_cost', 'crush_cost', 'connection_request_cost', 'private_photo_cost', 'private_photo_access_cost',
      'location_freshness_hours',
      'chat_enabled', 'private_message_enabled', 'allow_chat_extension',
      'allow_female_initiation', 'allow_male_initiation', 'max_messages_per_session',
      'default_male_connects', 'default_female_connects',
    ];

    const commSource = { ...(req.body.communication || req.body) };
    if (commSource.private_photo_access_cost !== undefined && commSource.private_photo_cost === undefined) {
      commSource.private_photo_cost = commSource.private_photo_access_cost;
    } else if (commSource.private_photo_cost !== undefined && commSource.private_photo_access_cost === undefined) {
      commSource.private_photo_access_cost = commSource.private_photo_cost;
    }

    const commUpdates = [];
    const commValues = [];

    for (const f of commFields) {
      if (commSource[f] !== undefined) {
        commValues.push(commSource[f]);
        commUpdates.push(`${f} = $${commValues.length}`);
      }
    }

    let updatedComm = null;
    if (commUpdates.length > 0) {
      const existing = await client.query(`SELECT id FROM admin_communication_settings ORDER BY id ASC LIMIT 1`);
      if (existing.rows.length) {
        commValues.push(existing.rows[0].id);
        const upRes = await client.query(
          `UPDATE admin_communication_settings
           SET ${commUpdates.join(', ')}, updated_at = NOW()
           WHERE id = $${commValues.length}
           RETURNING *`,
          commValues
        );
        updatedComm = upRes.rows[0];
      }
    }

    // Update platform category settings if provided
    const platformInput = req.body.platform || {};
    for (const [category, settingsObj] of Object.entries(platformInput)) {
      if (settingsObj && typeof settingsObj === 'object') {
        await client.query(
          `INSERT INTO admin_platform_settings (category, settings, updated_by, updated_at)
           VALUES ($1, $2::jsonb, $3, NOW())
           ON CONFLICT (category)
           DO UPDATE SET settings = admin_platform_settings.settings || $2::jsonb, updated_by = $3, updated_at = NOW()`,
          [category, JSON.stringify(settingsObj), req.admin.id]
        );
      }
    }

    await logAdminAction(
      req,
      {
        actionType: 'SETTINGS_UPDATE',
        targetType: 'settings',
        targetId: 'global',
        newValue: req.body,
        reason: req.body.reason || 'Admin updated platform settings',
      },
      client
    );

    await client.query('COMMIT');
    return exports.getSettings(req, res);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] updateSettings error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

// ── 11. Detailed Engagement & City Analytics ──────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const [
      topLikedRes,
      topCrushedRes,
      topVisitedRes,
      cityStatsRes,
      stateStatsRes,
      funnelRes,
    ] = await Promise.all([
      pool.query(`
        SELECT u.id, u.username, u.gender, u.city, COUNT(l.id)::int AS likes_received
        FROM likes l JOIN users u ON u.id = l.liked_id
        GROUP BY u.id ORDER BY likes_received DESC LIMIT 10
      `),
      pool.query(`
        SELECT u.id, u.username, u.gender, u.city,
               COUNT(c.id)::int AS crushes_received,
               COUNT(c.id) FILTER (WHERE c.is_mutual = true)::int AS mutual_crushes
        FROM crushes c JOIN users u ON u.id = c.receiver_id
        GROUP BY u.id ORDER BY crushes_received DESC LIMIT 10
      `),
      pool.query(`
        SELECT u.id, u.username, u.gender, u.city, COUNT(v.id)::int AS profile_visits
        FROM visits v JOIN users u ON u.id = v.visited_id
        GROUP BY u.id ORDER BY profile_visits DESC LIMIT 10
      `),
      pool.query(`
        SELECT
          COALESCE(NULLIF(TRIM(city), ''), 'Unknown') AS city,
          MAX(state) AS state,
          COUNT(*)::int AS count,
          COUNT(*) FILTER (WHERE LOWER(COALESCE(verified_gender, gender)) = 'female')::int AS female_count,
          COUNT(*) FILTER (WHERE LOWER(COALESCE(verified_gender, gender)) = 'male')::int AS male_count,
          COUNT(*) FILTER (WHERE is_online = true)::int AS online_count
        FROM users
        GROUP BY COALESCE(NULLIF(TRIM(city), ''), 'Unknown')
        ORDER BY count DESC
        LIMIT 25
      `),
      pool.query(`
        SELECT
          COALESCE(NULLIF(TRIM(state), ''), 'Unknown') AS state,
          COUNT(*)::int AS count
        FROM users
        GROUP BY COALESCE(NULLIF(TRIM(state), ''), 'Unknown')
        ORDER BY count DESC
        LIMIT 20
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS registered,
          COUNT(*) FILTER (WHERE LOWER(verification_status) = 'verified')::int AS selfie_verified,
          COUNT(*) FILTER (WHERE gender_match_status = 'MATCH')::int AS gender_matched,
          COUNT(*) FILTER (WHERE profile_completed = true OR UPPER(profile_status) = 'COMPLETED')::int AS profile_completed
        FROM users
      `),
    ]);

    return ok(res, {
      topLikedUsers: topLikedRes.rows,
      topCrushedUsers: topCrushedRes.rows,
      topVisitedProfiles: topVisitedRes.rows,
      cityWiseUsers: cityStatsRes.rows,
      stateWiseUsers: stateStatsRes.rows,
      onboardingFunnel: funnelRes.rows[0] || {},
    });
  } catch (err) {
    console.error('[ADMIN] getAnalytics error:', err);
    return fail(res, err.message, 500);
  }
};

// ── 12. Notifications Broadcast & History ─────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        n.id, n.user_id, n.type, n.title, n.body, n.is_read, n.created_at,
        u.username, u.email, u.gender
      FROM notifications n
      LEFT JOIN users u ON u.id = n.user_id
      ORDER BY n.created_at DESC
      LIMIT 100
    `);
    return ok(res, { notifications: rows });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.sendNotification = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      target = 'all',
      user_id = null,
      city = null,
      title,
      body,
      type = 'admin_broadcast',
    } = req.body;

    if (!title || !body) {
      return fail(res, 'Notification title and body are required.', 400);
    }

    await client.query('BEGIN');
    let targetQuery = `SELECT id FROM users WHERE is_active = true AND COALESCE(is_banned, false) = false`;
    const params = [];

    if (target === 'user' && user_id) {
      targetQuery += ` AND id = $1`;
      params.push(parseInt(user_id, 10));
    } else if (target === 'female') {
      targetQuery += ` AND LOWER(COALESCE(verified_gender, gender)) = 'female'`;
    } else if (target === 'male') {
      targetQuery += ` AND LOWER(COALESCE(verified_gender, gender)) = 'male'`;
    } else if (target === 'verified') {
      targetQuery += ` AND LOWER(verification_status) = 'verified'`;
    } else if (target === 'city' && city) {
      targetQuery += ` AND city ILIKE $1`;
      params.push(`%${city.trim()}%`);
    }

    const recipientsRes = await client.query(targetQuery, params);
    const recipientIds = recipientsRes.rows.map((r) => r.id);

    if (recipientIds.length > 0) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, created_at)
         SELECT UNNEST($1::int[]), $2, $3, $4, NOW()`,
        [recipientIds, type, title.trim(), body.trim()]
      );
    }

    await logAdminAction(
      req,
      {
        actionType: 'NOTIFICATION_BROADCAST',
        targetType: 'notification',
        targetId: target,
        newValue: { target, title, body, recipients_count: recipientIds.length },
      },
      client
    );

    await client.query('COMMIT');
    return ok(res, {
      recipients_count: recipientIds.length,
      message: `Notification sent to ${recipientIds.length} user(s).`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[ADMIN] sendNotification error:', err);
    return fail(res, err.message, 500);
  } finally {
    client.release();
  }
};

// ── 13. Admin Users, Roles & Audit Logs ───────────────────────────────────────
exports.getAdmins = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, nickname, email, role, is_active, is_banned,
              COALESCE(account_status, 'ACTIVE') AS account_status,
              COALESCE(permissions, '[]'::jsonb) AS permissions,
              last_seen, created_at
       FROM users
       WHERE LOWER(role) = ANY($1::text[])
       ORDER BY id ASC`,
      [ADMIN_ROLES]
    );
    return ok(res, {
      admins: rows,
      roles: ADMIN_ROLES,
      rolePermissions: ROLE_PERMISSIONS,
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.updateAdminRole = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id || req.body.user_id, 10);
    const role = String(req.body.role || 'admin').toLowerCase().trim();
    const permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];

    const allowed = [...ADMIN_ROLES, 'user'];
    if (!allowed.includes(role)) {
      return fail(res, `Invalid role. Allowed: ${allowed.join(', ')}`, 400);
    }

    const { rows } = await pool.query(
      `UPDATE users
       SET role = $1, permissions = $2::jsonb, updated_at = NOW()
       WHERE id = $3
       RETURNING id, username, email, role, permissions`,
      [role, JSON.stringify(permissions), targetUserId]
    );

    if (!rows.length) return fail(res, 'User not found.', 404);

    await logAdminAction(req, {
      actionType: 'ADMIN_ROLE_UPDATE',
      targetType: 'admin',
      targetId: targetUserId,
      newValue: { role, permissions },
    });

    return ok(res, { admin: rows[0], message: `Role updated to ${role}.` });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const actionType = (req.query.action_type || '').toUpperCase();
    const targetType = (req.query.target_type || '').toLowerCase();
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    if (actionType && actionType !== 'ALL') {
      params.push(actionType);
      conditions.push(`UPPER(action_type) = $${params.length}`);
    }
    if (targetType && targetType !== 'all') {
      params.push(targetType);
      conditions.push(`LOWER(target_type) = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(admin_username ILIKE $${params.length} OR action_type ILIKE $${params.length} OR COALESCE(reason, '') ILIKE $${params.length} OR COALESCE(target_id, '') ILIKE $${params.length})`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes, logsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM admin_audit_logs ${whereClause}`, params),
      pool.query(
        `SELECT * FROM admin_audit_logs
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    return ok(res, {
      logs: logsRes.rows,
      total: countRes.rows[0]?.total || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[ADMIN] getAuditLogs error:', err);
    return fail(res, err.message, 500);
  }
};

// ── 14. Subscriptions & Plans ─────────────────────────────────────────────────
exports.getSubscriptions = async (req, res) => {
  try {
    const [subsRes, plansRes, packsRes] = await Promise.all([
      pool.query(`
        SELECT s.*, u.username, u.email, sp.name AS plan_name, sp.price_inr
        FROM subscriptions s
        LEFT JOIN users u ON u.id = s.user_id
        LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
        ORDER BY s.created_at DESC
        LIMIT 100
      `),
      pool.query(`SELECT * FROM subscription_plans ORDER BY price_inr ASC`),
      pool.query(`SELECT * FROM connect_packs ORDER BY display_order ASC, price_inr ASC`),
    ]);

    return ok(res, {
      subscriptions: subsRes.rows,
      plans: plansRes.rows,
      connectPackages: packsRes.rows,
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
