'use strict';

const env = require('../config/env');

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = env.NODE_ENV === 'production' ? levels.info : levels.debug;

const fmt = (level, msg, meta) => {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
};

const logger = {
  error: (msg, meta) => levels.error <= current && console.error(fmt('error', msg, meta)),
  warn:  (msg, meta) => levels.warn  <= current && console.warn(fmt('warn',  msg, meta)),
  info:  (msg, meta) => levels.info  <= current && console.log(fmt('info',   msg, meta)),
  debug: (msg, meta) => levels.debug <= current && console.log(fmt('debug',  msg, meta)),
};

module.exports = logger;
