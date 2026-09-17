'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const isDev = env.NODE_ENV !== 'production';

const make = (max, windowMs = 15 * 60 * 1000, skipFn = () => false) =>
  rateLimit({
    windowMs,
    max: isDev ? max * 50 : max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: typeof skipFn === 'function' ? skipFn : () => false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  });

module.exports = {
  general: make(10000),
  auth:    make(100, 15 * 60 * 1000, (req) => req.path === '/me' || req.method === 'GET'),
  upload:  make(100),
};
