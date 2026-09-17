'use strict';

const { body, param } = require('express-validator');

const sendRequest = [
  param('id').isInt({ min: 1 }).withMessage('Valid user ID required.'),
  body('message').optional().isLength({ max: 300 }).withMessage('Message max 300 chars.'),
];

module.exports = { sendRequest };
