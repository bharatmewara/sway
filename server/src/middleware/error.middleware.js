'use strict';

const logger = require('../utils/logger');
const env    = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.originalUrl });

  if (err.message?.startsWith('CORS:'))
    return res.status(403).json({ success: false, message: err.message });

  if (err.name === 'SyntaxError' && err.status === 400)
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body.' });

  const status  = err.status || err.statusCode || 500;
  const message = env.NODE_ENV === 'production' ? 'Internal server error.' : err.message;

  return res.status(status).json({ success: false, message });
};

module.exports = errorMiddleware;
