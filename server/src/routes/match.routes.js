'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/match.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', ctrl.getMatches);
router.delete('/:userId', ctrl.unmatch);

module.exports = router;
