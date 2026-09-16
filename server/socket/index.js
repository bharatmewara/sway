'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sway_secret_key_change_in_production';

// Online users map: userId -> Set<socketId>
const onlineUsers = new Map();

const addOnlineSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId) || new Set();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
  return sockets.size === 1;
};

const removeOnlineSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return true;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }

  return false;
};

/**
 * Authenticate socket using JWT from handshake.auth.token
 */
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = {
      id: decoded.id,
      role: decoded.role,
      gender: decoded.gender,
      username: decoded.username,
    };
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token.'));
  }
};

/**
 * Setup Socket.io handlers
 * @param {http.Server} server
 * @param {Pool} db - PostgreSQL pool
 */
const setupSocket = (server, db) => {
  const { Server } = require('socket.io');

  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        process.env.ADMIN_URL  || 'http://localhost:3001',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    const username = socket.user.username;

    console.log(`[SOCKET] User ${username} (${userId}) connected. Socket: ${socket.id}`);

    // Track online user. A user can have multiple tabs/devices connected.
    const becameOnline = addOnlineSocket(userId, socket.id);

    // Join personal room
    socket.join(`user_${userId}`);

    // Join admin room if applicable
    if (socket.user.role === 'admin' || socket.user.role === 'superadmin') {
      socket.join('admin_room');
      console.log(`[SOCKET] User ${username} joined admin_room`);
    }

    if (becameOnline) {
      // Update DB: set is_online = true
      try {
        await db.query(
          `UPDATE users SET is_online = true, last_seen = NOW(), updated_at = NOW() WHERE id = $1`,
          [userId]
        );
      } catch (err) {
        console.error('[SOCKET] Failed to update online status:', err.message);
      }

      // Broadcast online status to all clients
      io.emit('user_online', { user_id: userId });
      io.emit('online_status', {
        userId,
        user_id: userId,
        isOnline: true,
        is_online: true,
        lastSeen: null,
        last_seen: null,
      });
    }

    // ── on: send_message ────────────────────────────────────────────────────

    socket.on('send_message', async (data) => {
      try {
        const { receiver_id, content, message_type, conversation_id } = data;
        if (!receiver_id || !content) return;

        // Emit to receiver's room
        io.to(`user_${receiver_id}`).emit('new_message', {
          conversation_id,
          sender_id: userId,
          sender_username: username,
          content,
          message_type: message_type || 'text',
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[SOCKET] send_message error:', err.message);
      }
    });

    // ── on: typing ──────────────────────────────────────────────────────────

    socket.on('typing', (data) => {
      const { receiver_id, conversation_id } = data;
      if (!receiver_id) return;
      io.to(`user_${receiver_id}`).emit('typing', {
        sender_id: userId,
        sender_username: username,
        conversation_id,
      });
    });

    // ── on: stop_typing ─────────────────────────────────────────────────────

    socket.on('stop_typing', (data) => {
      const { receiver_id, conversation_id } = data;
      if (!receiver_id) return;
      io.to(`user_${receiver_id}`).emit('stop_typing', {
        sender_id: userId,
        conversation_id,
      });
    });

    // ── on: mark_read ───────────────────────────────────────────────────────

    socket.on('mark_read', async (data) => {
      try {
        const { conversation_id, sender_id } = data;
        if (!conversation_id) return;

        // Check if there are actually unread messages from a female
        const unreadMsgs = await db.query(
          `SELECT m.id, u.gender 
           FROM messages m
           JOIN users u ON u.id = m.sender_id
           WHERE m.conversation_id = $1 AND m.sender_id = $2 AND m.is_read = false AND m.is_deleted = false`,
          [conversation_id, sender_id || 0]
        );

        if (unreadMsgs.rows.length > 0) {
          const senderGender = unreadMsgs.rows[0].gender;

          if (socket.user.gender === 'male' && senderGender === 'female') {
            const creditCheck = await db.query(
              `SELECT connect_credits as credits FROM users WHERE id = $1 FOR UPDATE`,
              [userId]
            );
            const currentCredits = creditCheck.rows[0]?.credits || 0;
            if (currentCredits < 5) {
              io.to(`user_${userId}`).emit('error', { message: 'Insufficient credits to read this message.' });
              return; 
            }

            await db.query(`UPDATE users SET connect_credits = connect_credits - 5, updated_at = NOW() WHERE id = $1`, [userId]);
            await db.query(
              `INSERT INTO credit_logs (user_id, action, credits_delta, balance_after, description, created_at)
               VALUES ($1, 'message_read', -5, $2, 'Read message from female', NOW())`,
              [userId, currentCredits - 5]
            );
          }
        }

        await db.query(
          `UPDATE messages
           SET is_read = true, read_at = NOW()
           WHERE conversation_id = $1
             AND sender_id = $2
             AND is_read = false
             AND is_deleted = false`,
          [conversation_id, sender_id || 0]
        );

        // Notify sender that messages were read
        if (sender_id) {
          io.to(`user_${sender_id}`).emit('messages_read', {
            conversation_id,
            read_by: userId,
          });
        }
      } catch (err) {
        console.error('[SOCKET] mark_read error:', err.message);
      }
    });

    // ── on: join_conversation ────────────────────────────────────────────────

    socket.on('join_conversation', (data) => {
      const { conversation_id } = data;
      if (conversation_id) {
        socket.join(`conversation_${conversation_id}`);
      }
    });

    // ── on: leave_conversation ───────────────────────────────────────────────

    socket.on('leave_conversation', (data) => {
      const { conversation_id } = data;
      if (conversation_id) {
        socket.leave(`conversation_${conversation_id}`);
      }
    });

    // ── on: disconnect ───────────────────────────────────────────────────────

    socket.on('disconnect', async (reason) => {
      console.log(`[SOCKET] User ${username} (${userId}) disconnected. Reason: ${reason}`);

      const wentOffline = removeOnlineSocket(userId, socket.id);
      if (!wentOffline) return;

      const lastSeen = new Date().toISOString();

      try {
        await db.query(
          `UPDATE users SET is_online = false, last_seen = NOW(), updated_at = NOW() WHERE id = $1`,
          [userId]
        );
      } catch (err) {
        console.error('[SOCKET] Failed to update offline status:', err.message);
      }

      // Broadcast offline status
      io.emit('user_offline', {
        user_id: userId,
        last_seen: lastSeen,
      });
      io.emit('online_status', {
        userId,
        user_id: userId,
        isOnline: false,
        is_online: false,
        lastSeen,
        last_seen: lastSeen,
      });
    });

    // ── on: error ────────────────────────────────────────────────────────────

    socket.on('error', (err) => {
      console.error(`[SOCKET] Error for user ${userId}:`, err.message);
    });
  });

  console.log('[SOCKET] Socket.io server initialized.');
  return io;
};

module.exports = { setupSocket, onlineUsers };
