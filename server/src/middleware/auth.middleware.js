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

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user?.role === 'admin' || req.user?.role === 'superadmin') return next();
    return fail(res, 'Access denied. Admins only.', 403);
  });
};

module.exports = { verifyToken, verifyAdmin };
