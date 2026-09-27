'use strict';

const chatService = require('../services/chat.service');
const { ok, fail } = require('../utils/response');

exports.getConfig = async (req, res) => {
  try {
    const config = await chatService.getAdminConfig();
    return ok(res, { config });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const config = await chatService.updateAdminConfig(req.body);
    return ok(res, { message: 'Communication settings updated.', config });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

exports.getConversations = async (req, res) => {
  try {
    const type = req.query.type || req.query.communication_type || null;
    const includeExpired = req.query.include_expired === 'true';
    const [conversations, config] = await Promise.all([
      chatService.getConversations(req.user.id, type, includeExpired),
      chatService.getAdminConfig(),
    ]);
    return ok(res, { conversations, config });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.startSession = async (req, res) => {
  try {
    const targetUserId = parseInt(req.body.receiver_id || req.body.user_id || req.body.target_user_id, 10);
    const commType = req.body.communication_type || req.body.type || 'chat';
    if (!targetUserId || isNaN(targetUserId)) return fail(res, 'receiver_id is required.', 400);

    const result = await chatService.startSession(req.user.id, targetUserId, commType);
    return ok(res, {
      message: commType === 'private_message' ? 'Private Messages session started.' : 'Chat session started.',
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 400;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to start session.',
      code: err.code || undefined,
      redirect: err.redirect || undefined,
      required_connects: err.required_connects,
      credits: err.credits,
    });
  }
};

exports.reinitiateSession = async (req, res) => {
  try {
    const targetUserId = parseInt(req.body.receiver_id || req.body.user_id || req.body.target_user_id, 10);
    const commType = req.body.communication_type || req.body.type || 'chat';
    if (!targetUserId || isNaN(targetUserId)) return fail(res, 'receiver_id is required.', 400);

    const result = await chatService.reinitiateSession(req.user.id, targetUserId, commType);
    return ok(res, {
      message: commType === 'private_message' ? 'Private Messages session reinitiated (72h).' : 'Chat session reinitiated.',
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 400;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to reinitiate session.',
      code: err.code || undefined,
      redirect: err.redirect || undefined,
      required_connects: err.required_connects,
      credits: err.credits,
    });
  }
};

exports.unlockMessages = async (req, res) => {
  try {
    const rawUserId = req.body.user_id || req.body.receiver_id || req.body.other_user_id || req.body.target_user_id;
    const targetUserId = rawUserId ? parseInt(rawUserId, 10) : null;
    const conversationId = req.body.conversation_id ? parseInt(req.body.conversation_id, 10) : null;
    const rawMsgId = req.params.messageId || req.body.message_id || req.body.id;
    const messageId = rawMsgId ? parseInt(rawMsgId, 10) : null;
    const commType = req.body.communication_type || req.body.type || null;

    if (!targetUserId && !conversationId && !messageId) {
      return fail(res, 'user_id, conversation_id, or message_id is required.', 400);
    }

    const result = await chatService.unlockMessages(
      req.user.id,
      targetUserId,
      conversationId,
      messageId,
      commType
    );
    return ok(res, {
      message: 'Message unlocked successfully!',
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 400;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to unlock message.',
      code: err.code || undefined,
      redirect: err.redirect || undefined,
      redirect_to: err.redirect || undefined,
      required_connects: err.required_connects,
      available_connects: err.available_connects ?? err.credits,
      credits: err.credits,
    });
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
    return fail(res, err.message, err.statusCode || 500);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const {
      receiver_id,
      content,
      message_type = 'text',
      media_url = null,
      communication_type = 'chat',
      type,
    } = req.body;
    if (!receiver_id || !content) return fail(res, 'receiver_id and content are required.', 400);

    const commType = (type || communication_type) === 'private_message' ? 'private_message' : 'chat';

    const result = await chatService.sendMessage(
      req.user.id,
      parseInt(receiver_id, 10),
      content,
      message_type,
      media_url,
      commType
    );

    const isLockedForReceiver = result.message && result.message.is_unlocked === false;
    const accessCost =
      commType === 'private_message'
        ? (result.config?.private_message_access_cost ?? 5)
        : (result.config?.chat_message_access_cost ?? 5);

    const socketPayload = {
      ...result.message,
      content: isLockedForReceiver ? null : result.message.content,
      media_url: isLockedForReceiver ? null : result.message.media_url,
      is_locked: isLockedForReceiver,
      is_blurred: isLockedForReceiver,
      required_connects: isLockedForReceiver ? accessCost : 0,
      sender_username: req.user.username,
    };

    req.app.get('io')?.to(`user_${receiver_id}`).emit('new_message', socketPayload);
    req.app.get('io')?.to(`user_${receiver_id}`).emit('receive_message', socketPayload);

    // Increment notification badge and push real-time notification payload for receiver
    req.app.get('io')?.to(`user_${receiver_id}`).emit('new_notification', {
      type: commType === 'private_message' ? 'PRIVATE_MESSAGE' : 'CHAT_MESSAGE',
      related_user_id: req.user.id,
      related_id: result.conversation?.id,
      sender_username: req.user.username,
      title: commType === 'private_message' ? 'New Private Message' : 'New Chat Message',
      body: `${req.user.username || 'Someone'} sent you a ${commType === 'private_message' ? 'Private Message' : 'Chat message'}.`,
    });

    return ok(res, { message: 'Message sent.', ...result }, 201);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to send message.',
      code: err.code || undefined,
      redirect: err.redirect || undefined,
      required_connects: err.required_connects,
      reinitiate_cost: err.reinitiate_cost,
      credits: err.credits !== undefined ? err.credits : undefined,
    });
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

exports.getMessagesByUserId = async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId, 10);
    if (isNaN(otherUserId)) return fail(res, 'Invalid user ID.', 400);

    const commType = (req.query.type || req.query.communication_type) === 'private_message' ? 'private_message' : 'chat';
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    const data = await chatService.getMessagesWithUser(req.user.id, otherUserId, commType, limit, offset);
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message, err.statusCode || 500);
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId, 10);
    if (isNaN(conversationId)) return fail(res, 'Invalid conversation ID.', 400);

    const success = await chatService.deleteConversation(conversationId, req.user.id);
    if (!success) return fail(res, 'Conversation not found.', 404);
    return ok(res, { message: 'Conversation deleted.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
