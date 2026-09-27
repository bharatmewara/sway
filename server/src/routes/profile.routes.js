'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/profile.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadProfile, uploadPrivate } = require('../middleware/upload.middleware');
const { update } = require('../validators/profile.validator');
const { validate } = require('../middleware/validation.middleware');

// Public bytecode raw image routes
router.get('/raw/:photoId', ctrl.getPrivatePhotoRaw);
router.get('/avatar/:userId/raw', ctrl.getAvatarRaw);

router.use(verifyToken);

router.get('/', ctrl.getPhotos);
router.put('/', update, validate, ctrl.updateProfile);
router.post('/upload', uploadPrivate, ctrl.uploadPhoto);
router.get('/me', ctrl.getMyProfile);
router.put('/me', update, validate, ctrl.updateProfile);
router.post('/photo', uploadProfile, ctrl.uploadAvatar);
router.get('/photos', ctrl.getPhotos);
router.get('/photos/:userId', ctrl.getPhotos);
router.get('/user/:userId', ctrl.getPhotos);
router.delete('/photos/:photoId', ctrl.deletePhoto);
router.delete('/:photoId', ctrl.deletePhoto);
router.get('/:id', ctrl.getProfileById);

module.exports = router;
