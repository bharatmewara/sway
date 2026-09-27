'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const profileCtrl = require('../controllers/profile.controller');
const notifCtrl = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadProfile } = require('../middleware/upload.middleware');

// Public bytecode raw avatar endpoint
router.get('/:id/avatar', profileCtrl.getAvatarRaw);

router.use(verifyToken);

router.get('/', ctrl.getUsers);
router.get('/members', ctrl.getUsers);
router.get('/nearby', ctrl.getNearbyUsers);
router.put('/location', ctrl.updateLocation);
router.post('/location', ctrl.updateLocation);
router.get('/counts', ctrl.getCounts);
router.get('/preferences', ctrl.getPreferences);
router.put('/preferences', ctrl.updatePreferences);
router.put('/account', ctrl.updateAccount);
router.put('/password', ctrl.changePassword);
router.get('/privacy', ctrl.getPrivacy);
router.put('/privacy', ctrl.updatePrivacy);
router.get('/privacy/permissions', ctrl.getPrivacyPermissions);
router.post('/privacy/permissions', ctrl.setPrivacyPermission);
router.put('/privacy/permissions/:maleUserId', ctrl.setPrivacyPermission);
router.delete('/privacy/permissions/:maleUserId', ctrl.revokePrivacyPermission);

// Profile compatibility aliases
router.get('/profile/:id', profileCtrl.getProfileById);
router.put('/profile', profileCtrl.updateProfile);
router.post('/profile/photo', uploadProfile, profileCtrl.uploadAvatar);

// Notifications compatibility aliases
router.get('/notifications', notifCtrl.getNotifications);
router.put('/notifications/read-all', notifCtrl.markAllAsRead);
router.put('/notifications/:id/read', notifCtrl.markAsRead);

router.post('/:id/like', ctrl.sendLike);
router.get('/:id', ctrl.getUserById);

module.exports = router;
