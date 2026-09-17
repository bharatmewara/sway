'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', ctrl.getNotifications);
router.put('/read-all', ctrl.markAllAsRead);
router.put('/:id/read', ctrl.markAsRead);

module.exports = router;
