'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

const sign = (payload, expiresIn = env.JWT_EXPIRES_IN) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn });

const verify = (token) => jwt.verify(token, env.JWT_SECRET);

module.exports = { sign, verify };
