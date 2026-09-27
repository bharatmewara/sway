'use strict';

const { verify } = require('../utils/jwt');
const { fail }   = require('../utils/response');

const verifyToken = (req, res, next) => {
  try {
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) return fail(res, 'Access denied. No token provided.', 401);

    const token = header.split(' ')[1];
    req.user = verify(token);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
    return fail(res, msg, 401);
  }
};

const ADMIN_ROLES = ['super_admin', 'superadmin', 'admin', 'moderator', 'finance_admin', 'support_admin', 'analyst'];

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (ADMIN_ROLES.includes(String(req.user?.role || '').toLowerCase())) return next();
    return fail(res, 'Access denied. Admins only.', 403);
  });
};

module.exports = { verifyToken, verifyAdmin, ADMIN_ROLES };

