'use strict';

require('dotenv').config();

const express       = require('express');
const http          = require('http');
const helmet        = require('helmet');
const cors          = require('cors');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');
const path          = require('path');

// ─── Import DB & Socket ───────────────────────────────────────────────────────
const pool              = require('./config/db');
const { setupSocket }   = require('./socket/index');

// ─── Import Routers ───────────────────────────────────────────────────────────
const authRouter          = require('./routes/auth');
const usersRouter         = require('./routes/users');
const verificationRouter  = require('./routes/verification');
const messagesRouter      = require('./routes/messages');
const crushesRouter       = require('./routes/crushes');
const requestsRouter      = require('./routes/requests');
const visitorsRouter      = require('./routes/visitors');
const paymentsRouter      = require('./routes/payments');
const adminRouter         = require('./routes/admin');
const privatePhotosRouter = require('./routes/private-photos');
// ─── New Feature Routers v2 ───────────────────────────────────────────────────
const matchingRouter      = require('./routes/matching');
const giftsRouter         = require('./routes/gifts');
const storiesRouter       = require('./routes/stories');
const boostRouter         = require('./routes/boost');
const premiumRouter       = require('./routes/premium');
const privacyRouter       = require('./routes/privacy');
const socialRouter        = require('./routes/social');
const eventsRouter        = require('./routes/events');
const aiRouter            = require('./routes/ai');
const callsRouter         = require('./routes/calls');
const securityRouter      = require('./routes/security');

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();

const CLIENT_URL  = process.env.CLIENT_URL  || 'http://localhost:3000';
const ADMIN_URL   = process.env.ADMIN_URL   || 'http://localhost:3001';
const PORT        = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV    = process.env.NODE_ENV    || 'development';

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploaded files
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [CLIENT_URL, ADMIN_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed.`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

app.use(generalLimiter);

// ─── Static Files (Uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: err.message,
    });
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',           authLimiter,      authRouter);
app.use('/api/users',                            usersRouter);
app.use('/api/verification',                     verificationRouter);
app.use('/api/messages',                         messagesRouter);
app.use('/api/crushes',                          crushesRouter);
app.use('/api/requests',                         requestsRouter);
app.use('/api/visitors',                         visitorsRouter);
app.use('/api/payments',                         paymentsRouter);
app.use('/api/admin',                            adminRouter);
app.use('/api/private-photos',                   privatePhotosRouter);
// ─── New Feature Routes v2 ────────────────────────────────────────────────────
app.use('/api/matching',                         matchingRouter);
app.use('/api/gifts',                            giftsRouter);
app.use('/api/stories',                          storiesRouter);
app.use('/api/boost',                            boostRouter);
app.use('/api/premium',                          premiumRouter);
app.use('/api/privacy',                          privacyRouter);
app.use('/api/social',                           socialRouter);
app.use('/api/events',                           eventsRouter);
app.use('/api/ai',                               aiRouter);
app.use('/api/calls',                            callsRouter);
app.use('/api/security',                         securityRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);

  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  if (err.name === 'SyntaxError' && err.status === 400) {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body.' });
  }

  const status = err.status || err.statusCode || 500;
  const message = NODE_ENV === 'production'
    ? 'Internal server error.'
    : err.message || 'Internal server error.';

  return res.status(status).json({ success: false, message });
});

// ─── HTTP Server + Socket.io ──────────────────────────────────────────────────
const server = http.createServer(app);
const io     = setupSocket(server, pool);

// Attach io to app for use in routes
app.set('io', io);

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n[SERVER] Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('[SERVER] PostgreSQL pool closed.');
    } catch (err) {
      console.error('[SERVER] Error closing pool:', err.message);
    }
    console.log('[SERVER] HTTP server closed. Exiting.');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[SERVER] Uncaught Exception:', err.message);
  process.exit(1);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`[SERVER] SWAY backend running on port ${PORT} in ${NODE_ENV} mode.`);
  console.log(`[SERVER] API: http://localhost:${PORT}/api`);
  console.log(`[SERVER] Health: http://localhost:${PORT}/health`);
});

module.exports = { app, server };
