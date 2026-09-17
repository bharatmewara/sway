'use strict';

const logger = require('../utils/logger');
const pool = require('../config/database');

module.exports = function registerChatHandlers(io, socket) {
  const { id: userId, username } = socket.user;

  socket.on('send_message', ({ receiver_id, content, message_type, conversation_id }) => {
    if (!receiver_id || !content) return;
    io.to(`user_${receiver_id}`).emit('new_message', {
      conversation_id,
      sender_id: userId,
      sender_username: username,
      content,
      message_type: message_type || 'text',
      created_at: new Date().toISOString(),
    });
  });

  socket.on('typing', ({ receiver_id, conversation_id }) => {
    if (receiver_id) {
      io.to(`user_${receiver_id}`).emit('typing', { sender_id: userId, sender_username: username, conversation_id });
    }
  });

  socket.on('stop_typing', ({ receiver_id, conversation_id }) => {
    if (receiver_id) {
      io.to(`user_${receiver_id}`).emit('stop_typing', { sender_id: userId, conversation_id });
    }
  });

  socket.on('join_conversation', ({ conversation_id }) => {
    if (conversation_id) socket.join(`conversation_${conversation_id}`);
  });

  socket.on('leave_conversation', ({ conversation_id }) => {
    if (conversation_id) socket.leave(`conversation_${conversation_id}`);
  });

  socket.on('mark_read', async ({ conversation_id, sender_id }) => {
    if (!conversation_id) return;
    try {
      await pool.query(
        `UPDATE messages SET is_read = true, read_at = NOW() WHERE conversation_id = $1 AND sender_id = $2 AND is_read = false`,
        [conversation_id, sender_id || 0]
      );
      if (sender_id) io.to(`user_${sender_id}`).emit('messages_read', { conversation_id, read_by: userId });
    } catch (err) {
      logger.error('[SOCKET] mark_read error', { message: err.message });
    }
  });
};
