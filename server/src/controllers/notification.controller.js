'use strict';

const notificationService = require('../services/notification.service');
const { ok, fail } = require('../utils/response');

exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '30', 10);
    const notifications = await notificationService.getNotifications(req.user.id, limit);
    return ok(res, { notifications });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await notificationService.markAsRead(parseInt(req.params.id, 10), req.user.id);
    return ok(res, { message: 'Notification marked as read.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return ok(res, { message: 'All notifications marked as read.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
