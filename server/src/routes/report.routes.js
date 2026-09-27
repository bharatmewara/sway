'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/', ctrl.reportUser);
router.get('/blocks', ctrl.getBlockedUsers);
router.post('/block', ctrl.blockUser);
router.delete('/block/:blockedId', ctrl.unblockUser);

module.exports = router;
