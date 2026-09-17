'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/discovery.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/feed', ctrl.getFeed);
router.post('/swipe', ctrl.swipe);

module.exports = router;
