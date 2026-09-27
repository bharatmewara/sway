'use strict';

const logger = require('../utils/logger');
const pool = require('../config/database');

module.exports = function registerChatHandlers(io, socket) {
  const { id: userId, username } = socket.user;

  socket.on('send_message', async ({ receiver_id, content, message_type, communication_type }) => {
    if (!receiver_id || !content) return;
    try {
      const chatService = require('../services/chat.service');
      const commType = communication_type === 'private_message' ? 'private_message' : 'chat';
      const result = await chatService.sendMessage(
        userId,
        parseInt(receiver_id, 10),
        content,
        message_type || 'text',
        null,
        commType
      );
      const isLockedForReceiver = result.message && result.message.is_unlocked === false;
      const payload = {
        ...result.message,
        content: isLockedForReceiver ? null : result.message.content,
        is_locked: isLockedForReceiver,
        is_blurred: isLockedForReceiver,
        required_connects: isLockedForReceiver ? result.config?.chat_message_access_cost || 5 : 0,
        sender_username: username,
      };
      io.to(`user_${receiver_id}`).emit('new_message', payload);
      io.to(`user_${receiver_id}`).emit('receive_message', payload);
    } catch (err) {
      socket.emit('error', {
        message: err.message || 'Failed to send message',
        code: err.code,
        redirect: err.redirect,
      });
    }
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
