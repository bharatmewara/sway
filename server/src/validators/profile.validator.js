'use strict';

const { body } = require('express-validator');

const update = [
  body('bio').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Bio max 500 chars.'),
  body('height').optional({ nullable: true }).custom(v => {
    if (v === null || v === '') return true;
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 100 || n > 250) throw new Error('Height must be 100–250 cm.');
    return true;
  }),
  body('preferred_age_min').optional({ nullable: true }).isInt({ min: 18 }).withMessage('Min age must be 18+.'),
  body('preferred_age_max').optional({ nullable: true }).isInt({ max: 100 }).withMessage('Max age must be ≤100.'),
  body('date_of_birth').optional({ nullable: true }).custom(v => {
    if (!v) return true;
    if (isNaN(Date.parse(v))) throw new Error('Invalid date of birth.');
    return true;
  }),
  body('marital_status').optional({ nullable: true }).isString(),
  body('smoking').optional({ nullable: true }).isString(),
  body('drinking').optional({ nullable: true }).isString(),
  body('relationship_type').optional({ nullable: true }).isString(),
  body('looking_for').optional({ nullable: true }).isString(),
  body('hobbies').optional({ nullable: true }).isString(),
  body('interests').optional({ nullable: true }).isString(),
  body('body_type').optional({ nullable: true }).isString(),
  body('education').optional({ nullable: true }).isString(),
  body('profession').optional({ nullable: true }).isString(),
  body('city').optional({ nullable: true }).isString(),
  body('state').optional({ nullable: true }).isString(),
  body('country').optional({ nullable: true }).isString(),
];

module.exports = { update };
