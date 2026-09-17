'use strict';

const chatService = require('../services/chat.service');
const { ok, fail } = require('../utils/response');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    return ok(res, { conversations });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId, 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    const messages = await chatService.getMessages(conversationId, req.user.id, limit, offset);
    return ok(res, { messages });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, content, message_type = 'text', media_url = null } = req.body;
    if (!receiver_id || !content) return fail(res, 'receiver_id and content are required.', 400);

    const result = await chatService.sendMessage(
      req.user.id,
      parseInt(receiver_id, 10),
      content,
      message_type,
      media_url
    );

    req.app.get('io')?.to(`user_${receiver_id}`).emit('new_message', {
      ...result.message,
      sender_username: req.user.username
    });

    return ok(res, { message: 'Message sent.', ...result }, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.markRead = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId, 10);
    await chatService.markRead(conversationId, req.user.id);
    return ok(res, { message: 'Messages marked as read.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
