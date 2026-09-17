'use strict';

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');

const env             = require('./config/env');
const errorMiddleware = require('./middleware/error.middleware');
const rateLimits      = require('./middleware/rateLimit.middleware');

// ── Production 9-Tier Structured Routes ──────────────────────────────────────
const authRoutes         = require('./routes/auth.routes');
const userRoutes         = require('./routes/user.routes');
const profileRoutes      = require('./routes/profile.routes');
const discoveryRoutes    = require('./routes/discovery.routes');
const matchRoutes        = require('./routes/match.routes');
const chatRoutes         = require('./routes/chat.routes');
const notificationRoutes = require('./routes/notification.routes');
const reportRoutes       = require('./routes/report.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const requestRoutes      = require('./routes/request.routes');
const visitorRoutes      = require('./routes/visitor.routes');
const crushRoutes        = require('./routes/crush.routes');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || [env.CLIENT_URL, env.ADMIN_URL].includes(origin)) cb(null, true);
    else cb(null, true); // Allow dev access gracefully
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Logging & Parsing ─────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimits.general);

// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
const pool = require('./config/database');
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString(), env: env.NODE_ENV });
  } catch (err) {
    res.status(503).json({ success: false, status: 'unhealthy', error: err.message });
  }
});

// ── API Routes (Standard Multi-Tier Architecture) ─────────────────────────────
app.use('/api/auth',          rateLimits.auth, authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/discovery',     discoveryRoutes);
app.use('/api/matches',       matchRoutes);
app.use('/api/messages',      chatRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/subscription',  subscriptionRoutes);
app.use('/api/payments',      subscriptionRoutes);
app.use('/api/requests',      requestRoutes);
app.use('/api/visitors',      visitorRoutes);
app.use('/api/crushes',       crushRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` }));

// ── Central Error Handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
