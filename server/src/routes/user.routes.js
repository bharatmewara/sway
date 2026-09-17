'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const profileCtrl = require('../controllers/profile.controller');
const notifCtrl = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadProfile } = require('../middleware/upload.middleware');

router.use(verifyToken);

router.get('/', ctrl.getUsers);
router.get('/members', ctrl.getUsers);
router.get('/counts', ctrl.getCounts);
router.get('/preferences', ctrl.getPreferences);
router.put('/preferences', ctrl.updatePreferences);
router.get('/privacy', ctrl.getPrivacy);
router.put('/privacy', ctrl.updatePrivacy);

// Profile compatibility aliases
router.get('/profile/:id', profileCtrl.getProfileById);
router.put('/profile', profileCtrl.updateProfile);
router.post('/profile/photo', uploadProfile, profileCtrl.uploadPhoto);

// Notifications compatibility aliases
router.get('/notifications', notifCtrl.getNotifications);
router.put('/notifications/read-all', notifCtrl.markAllAsRead);
router.put('/notifications/:id/read', notifCtrl.markAsRead);

router.get('/:id', ctrl.getUserById);

module.exports = router;
