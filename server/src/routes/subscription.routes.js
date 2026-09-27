'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/subscription.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/plans', ctrl.getPlans);
router.get('/packs', ctrl.getCreditPacks);
router.post('/create-order', verifyToken, ctrl.createOrder);
router.post('/verify', verifyToken, ctrl.verifyPayment);
router.post('/purchase', verifyToken, ctrl.purchaseCredits);
router.get('/transactions', verifyToken, ctrl.getTransactions);
router.post('/adjust', verifyToken, ctrl.adjustConnects);

module.exports = router;
