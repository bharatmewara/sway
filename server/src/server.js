'use strict';

const http = require('http');
const app  = require('./app');
const env  = require('./config/env');
const pool = require('./config/database');
const { setupSocket } = require('./sockets/socket');

const server = http.createServer(app);
const io     = setupSocket(server);

app.set('io', io);

const gracefulShutdown = async (signal) => {
  console.log(`\n[SERVER] ${signal} received. Shutting down...`);
  server.close(async () => {
    try { await pool.end(); console.log('[SERVER] DB pool closed.'); } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('[SERVER] Unhandled Rejection:', reason));
process.on('uncaughtException',  (err)    => { console.error('[SERVER] Uncaught Exception:', err.message); process.exit(1); });

server.listen(env.PORT, () => {
  console.log(`[SERVER] SWAY running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
  console.log(`[SERVER] API:    http://localhost:${env.PORT}/api`);
  console.log(`[SERVER] Health: http://localhost:${env.PORT}/health`);
});

module.exports = { app, server };
