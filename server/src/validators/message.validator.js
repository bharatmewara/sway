'use strict';

const { body } = require('express-validator');

const send = [
  body('receiver_id').isInt({ min: 1 }).withMessage('Valid receiver_id required.'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message content required (max 2000 chars).'),
  body('message_type').optional().isIn(['text', 'image', 'voice', 'sticker']).withMessage('Invalid message type.'),
];

module.exports = { send };
