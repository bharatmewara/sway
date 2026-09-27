'use strict';

const notificationService = require('../services/notification.service');
const { ok, fail } = require('../utils/response');

exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const [notifications, unreadCount] = await Promise.all([
      notificationService.getNotifications(req.user.id, limit),
      notificationService.getUnreadCount(req.user.id),
    ]);
    return ok(res, {
      notifications,
      unread_count: unreadCount,
      data: { notifications, unread_count: unreadCount },
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user.id);
    return ok(res, { unread_count: unreadCount });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const unreadCount = await notificationService.markAsRead(parseInt(req.params.id, 10), req.user.id);
    return ok(res, {
      message: 'Notification marked as read.',
      unread_count: unreadCount,
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const unreadCount = await notificationService.markAllAsRead(req.user.id);
    return ok(res, {
      message: 'All notifications marked as read.',
      unread_count: unreadCount,
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
