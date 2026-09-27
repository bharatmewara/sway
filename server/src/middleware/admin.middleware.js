'use strict';

const pool = require('../config/database');
const { verify } = require('../utils/jwt');
const { fail } = require('../utils/response');

const ADMIN_ROLES = [
  'super_admin',
  'superadmin',
  'admin',
  'moderator',
  'finance_admin',
  'support_admin',
  'analyst',
];

const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  superadmin: ['*'],
  admin: [
    'users.view',
    'users.edit',
    'users.verify',
    'users.status',
    'users.block',
    'users.delete',
    'reports.view',
    'reports.resolve',
    'transactions.view',
    'payments.refund',
    'connects.manage',
    'chats.view',
    'chats.moderate',
    'settings.view',
    'settings.edit',
    'analytics.view',
    'audit.view',
    'notifications.send',
  ],
  moderator: [
    'users.view',
    'users.verify',
    'users.status',
    'users.block',
    'reports.view',
    'reports.resolve',
    'chats.view',
    'chats.moderate',
  ],
  finance_admin: [
    'users.view',
    'transactions.view',
    'payments.refund',
    'connects.manage',
    'analytics.view',
  ],
  support_admin: [
    'users.view',
    'users.status',
    'reports.view',
    'reports.resolve',
    'chats.view',
    'notifications.send',
  ],
  analyst: [
    'users.view',
    'transactions.view',
    'analytics.view',
  ],
};

function getEffectivePermissions(role, customPermissions = []) {
  const base = ROLE_PERMISSIONS[role] || [];
  if (base.includes('*')) return ['*'];
  const extra = Array.isArray(customPermissions) ? customPermissions : [];
  return Array.from(new Set([...base, ...extra]));
}

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return fail(res, 'Authentication required. No admin token provided.', 401);
    }

    const token = header.split(' ')[1];
    let decoded;
    try {
      decoded = verify(token);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Admin session expired. Please sign in again.' : 'Invalid authentication token.';
      return fail(res, msg, 401);
    }

    const { rows } = await pool.query(
      `SELECT id, username, nickname, email, role, is_active, is_banned,
              COALESCE(account_status, 'ACTIVE') AS account_status,
              COALESCE(permissions, '[]'::jsonb) AS permissions
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (!rows.length) {
      return fail(res, 'Admin account not found.', 401);
    }

    const adminUser = rows[0];
    if (
      !adminUser.is_active ||
      adminUser.is_banned ||
      ['BANNED', 'SUSPENDED', 'BLOCKED', 'DEACTIVATED'].includes(String(adminUser.account_status).toUpperCase())
    ) {
      return fail(res, 'Your account has been suspended or deactivated.', 403);
    }

    const role = String(adminUser.role || '').toLowerCase();
    if (!ADMIN_ROLES.includes(role)) {
      return fail(res, 'Forbidden. Admin privileges are required to access this resource.', 403);
    }

    const effectivePermissions = getEffectivePermissions(role, adminUser.permissions);
    req.admin = {
      ...adminUser,
      role,
      effectivePermissions,
    };
    req.user = req.admin;
    next();
  } catch (err) {
    console.error('[ADMIN_AUTH] Error:', err);
    return fail(res, 'Internal authentication error.', 500);
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) {
      return fail(res, 'Authentication required.', 401);
    }
    const perms = req.admin.effectivePermissions || [];
    if (perms.includes('*') || perms.includes(permission)) {
      return next();
    }
    return fail(
      res,
      `Insufficient permissions. Required permission: '${permission}' (current role: '${req.admin.role}').`,
      403
    );
  };
}

async function logAdminAction(req, { actionType, targetType, targetId, previousValue = null, newValue = null, reason = null }, dbClient = null) {
  const executor = dbClient || pool;
  try {
    const adminId = req.admin?.id || req.user?.id || null;
    const adminUsername = req.admin?.username || req.user?.username || 'system';
    const adminRole = req.admin?.role || req.user?.role || 'admin';
    const ipAddress = (req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '').toString().slice(0, 64);
    const userAgent = (req.headers['user-agent'] || '').toString();

    await executor.query(
      `INSERT INTO admin_audit_logs
         (admin_id, admin_username, admin_role, action_type, target_type, target_id, previous_value, new_value, reason, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11)`,
      [
        adminId,
        adminUsername,
        adminRole,
        actionType,
        targetType || null,
        targetId !== undefined && targetId !== null ? String(targetId) : null,
        previousValue !== null ? JSON.stringify(previousValue) : null,
        newValue !== null ? JSON.stringify(newValue) : null,
        reason || null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (err) {
    console.warn('[AUDIT_LOG] Failed to record audit log:', err.message);
  }
}

module.exports = {
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
  getEffectivePermissions,
  requireAdmin,
  requirePermission,
  logAdminAction,
};
