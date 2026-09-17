'use strict';

const { Server } = require('socket.io');
const { verify } = require('../utils/jwt');
const socketCfg = require('../config/socket');
const pool = require('../config/database');
const logger = require('../utils/logger');
const registerChatHandlers = require('./chat.socket');
const registerNotificationHandlers = require('./notification.socket');

// userId -> Set<socketId>
const onlineUsers = new Map();

const addSocket = (uid, sid) => {
  const s = onlineUsers.get(uid) || new Set();
  s.add(sid);
  onlineUsers.set(uid, s);
  return s.size === 1;
};

const removeSocket = (uid, sid) => {
  const s = onlineUsers.get(uid);
  if (!s) return true;
  s.delete(sid);
  if (!s.size) {
    onlineUsers.delete(uid);
    return true;
  }
  return false;
};

const setupSocket = (server) => {
  const io = new Server(server, socketCfg);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided.'));
      socket.user = verify(token);
      next();
    } catch {
      next(new Error('Invalid token.'));
    }
  });

  io.on('connection', async (socket) => {
    const { id: userId, username } = socket.user;
    logger.info(`[SOCKET] ${username} (${userId}) connected`);

    socket.join(`user_${userId}`);
    if (['admin', 'superadmin'].includes(socket.user.role)) {
      socket.join('admin_room');
    }

    if (addSocket(userId, socket.id)) {
      pool.query(`UPDATE users SET is_online = true, last_seen = NOW(), updated_at = NOW() WHERE id = $1`, [userId]).catch(() => {});
      io.emit('online_status', { userId, user_id: userId, isOnline: true, is_online: true, lastSeen: null });
    }

    // Register modular event handlers
    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);

    socket.on('disconnect', async (reason) => {
      logger.info(`[SOCKET] ${username} (${userId}) disconnected: ${reason}`);
      if (!removeSocket(userId, socket.id)) return;
      const lastSeen = new Date().toISOString();
      pool.query(`UPDATE users SET is_online = false, last_seen = NOW(), updated_at = NOW() WHERE id = $1`, [userId]).catch(() => {});
      io.emit('online_status', { userId, user_id: userId, isOnline: false, is_online: false, lastSeen, last_seen: lastSeen });
    });

    socket.on('error', (err) => logger.error(`[SOCKET] Error for ${userId}`, { message: err.message }));
  });

  logger.info('[SOCKET] Socket.io initialized with chat and notification handlers.');
  return io;
};

module.exports = { setupSocket, onlineUsers };
