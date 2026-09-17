'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/profile.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadProfile } = require('../middleware/upload.middleware');
const { update } = require('../validators/profile.validator');
const { validate } = require('../middleware/validation.middleware');

router.use(verifyToken);

router.get('/me', ctrl.getMyProfile);
router.put('/me', update, validate, ctrl.updateProfile);
router.post('/photo', uploadProfile, ctrl.uploadPhoto);
router.get('/photos', ctrl.getPhotos);
router.delete('/photos/:photoId', ctrl.deletePhoto);
router.get('/:id', ctrl.getProfileById);

module.exports = router;
