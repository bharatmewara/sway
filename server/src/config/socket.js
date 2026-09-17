'use strict';

const env = require('./env');

module.exports = {
  cors: {
    origin:      [env.CLIENT_URL, env.ADMIN_URL],
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout:  60000,
  pingInterval: 25000,
};
