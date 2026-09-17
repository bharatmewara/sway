'use strict';

const logger = require('../utils/logger');

module.exports = function registerNotificationHandlers(io, socket) {
  const { id: userId, username } = socket.user;

  socket.on('notification_read', (notificationId) => {
    logger.info(`[SOCKET] User ${username} marked notification ${notificationId} as read`);
  });

  socket.on('subscribe_notifications', () => {
    socket.join(`notifications_${userId}`);
  });
};
