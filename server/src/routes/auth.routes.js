'use strict';

const router     = require('express').Router();
const ctrl       = require('../controllers/auth.controller');
const { register, login } = require('../validators/auth.validator');
const { validate } = require('../middleware/validation.middleware');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/register',        register, validate, ctrl.register);
router.post('/login',           login,    validate, ctrl.login);
router.post('/logout',          verifyToken,        ctrl.logout);
router.post('/forgot-password',                     ctrl.forgotPassword);
router.get('/me',               verifyToken,        ctrl.me);

module.exports = router;
