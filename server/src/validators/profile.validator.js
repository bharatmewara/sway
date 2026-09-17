'use strict';

const { body } = require('express-validator');

const update = [
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio max 500 chars.'),
  body('height').optional().isInt({ min: 100, max: 250 }).withMessage('Height must be 100–250 cm.'),
  body('preferred_age_min').optional().isInt({ min: 18 }).withMessage('Min age must be 18+.'),
  body('preferred_age_max').optional().isInt({ max: 100 }).withMessage('Max age must be ≤100.'),
];

module.exports = { update };
