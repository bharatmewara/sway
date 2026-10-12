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
    const rawDob = req.body.dob || req.body.date_of_birth;
    if (!rawDob || typeof rawDob !== 'string') {
      throw new Error('Date of birth is required.');
    }
    const dob = rawDob.trim();
    const match = dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error('Date of birth must be in YYYY-MM-DD format.');
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const dateObj = new Date(year, month - 1, day);
    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      throw new Error('Invalid calendar date provided for date of birth.');
    }
    const today = new Date();
    if (dateObj > today) {
      throw new Error('Date of birth cannot be in the future.');
    }
    let age = today.getFullYear() - year;
    const m = today.getMonth() - (month - 1);
    if (m < 0 || (m === 0 && today.getDate() < day)) age--;
    if (age < 18) {
      throw new Error('You must be at least 18 years old to join Sway.');
    }
    if (age > 120) {
      throw new Error('Please enter a valid date of birth.');
    }
    req.body.dob = dob;
    req.body.date_of_birth = dob;
    req.body.age = age;
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


