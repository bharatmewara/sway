'use strict';

const conversationRepo = require('../repositories/conversation.repository');
const messageRepo = require('../repositories/message.repository');
const reportRepo = require('../repositories/report.repository');

class ChatService {
  async getConversations(userId) {
    return conversationRepo.getUserConversations(userId);
  }

  async getMessages(conversationId, userId, limit = 50, offset = 0) {
    const conv = await conversationRepo.findById(conversationId);
    if (!conv || (conv.user1_id !== userId && conv.user2_id !== userId)) {
      throw new Error('Conversation not found or access denied.');
    }

    const messages = await messageRepo.getMessages(conversationId, limit, offset);
    await messageRepo.markAsRead(conversationId, userId);
    return messages;
  }

  async sendMessage(senderId, receiverId, content, messageType = 'text', mediaUrl = null) {
    const blocked = await reportRepo.isBlocked(senderId, receiverId);
    if (blocked) throw new Error('Cannot send message to this user.');

    const conv = await conversationRepo.findOrCreate(senderId, receiverId);
    const message = await messageRepo.createMessage({
      conversationId: conv.id,
      senderId,
      receiverId,
      content,
      messageType,
      mediaUrl
    });

    return { conversation: conv, message };
  }

  async markRead(conversationId, userId) {
    await messageRepo.markAsRead(conversationId, userId);
  }
}

module.exports = new ChatService();
