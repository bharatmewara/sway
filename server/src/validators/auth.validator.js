'use strict';

const { body } = require('express-validator');

const register = [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3–30 alphanumeric characters or underscores.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/)
    .withMessage('Password: min 8 chars, one uppercase, one number.'),
  body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female.'),
  body('dob').isISO8601().withMessage('Date of birth must be YYYY-MM-DD.'),
  body('city').trim().notEmpty().withMessage('City is required.'),
  body('state').trim().notEmpty().withMessage('State is required.'),
  body('country').trim().notEmpty().withMessage('Country is required.'),
];

const login = [
  body('identifier').trim().notEmpty().withMessage('Email or username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

module.exports = { register, login };
