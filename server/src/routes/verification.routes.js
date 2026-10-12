'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/verification.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');
const { uploadVerification, uploadProfile } = require('../middleware/upload.middleware');

const adminCtrl = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/admin.middleware');

const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

router.use(noCache);

router.post('/selfie', verifyToken, uploadProfile, ctrl.submitSelfie);
router.post('/submit', verifyToken, uploadVerification, ctrl.submitSelfie);
router.get('/status', verifyToken, ctrl.getStatus);
router.get('/admin/list', requireAdmin, adminCtrl.getVerifications);
router.put('/admin/:id/approve', requireAdmin, (req, res) => {
  req.params.action = 'approve';
  return adminCtrl.reviewVerificationRequest(req, res);
});
router.put('/admin/:id/reject', requireAdmin, (req, res) => {
  req.params.action = 'reject';
  return adminCtrl.reviewVerificationRequest(req, res);
});

module.exports = router;

