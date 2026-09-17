'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/', ctrl.reportUser);
router.post('/block', ctrl.blockUser);

module.exports = router;
