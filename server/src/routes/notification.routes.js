'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/read-all', ctrl.markAllAsRead);
router.post('/read-all', ctrl.markAllAsRead);
router.put('/:id/read', ctrl.markAsRead);
router.post('/:id/read', ctrl.markAsRead);

module.exports = router;
