'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/subscription.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/plans', ctrl.getPlans);
router.get('/packs', ctrl.getCreditPacks);
router.post('/purchase', verifyToken, ctrl.purchaseCredits);

module.exports = router;
