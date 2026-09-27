'use strict';

const { body } = require('express-validator');

const register = [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3–30 alphanumeric characters or underscores.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters.'),
  body().custom((_, { req }) => {
    const g = (req.body.selected_gender || req.body.gender || '').toLowerCase().trim();
    if (!['female', 'male'].includes(g)) {
      throw new Error('Please select your gender (Female or Male) to register.');
    }
    req.body.gender = g;
    req.body.selected_gender = g;
    return true;
  }),
  body().custom((_, { req }) => {
    const dob = req.body.dob || req.body.date_of_birth;
    if (!dob || isNaN(Date.parse(dob))) {
      throw new Error('Date of birth must be YYYY-MM-DD.');
    }
    return true;
  }),
  body('city').trim().notEmpty().withMessage('City is required.'),
  body('state').optional({ values: 'falsy' }).trim(),
  body('country').optional({ values: 'falsy' }).trim(),
];

const login = [
  body('identifier').trim().notEmpty().withMessage('Email or username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

module.exports = { register, login };


