'use strict';

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const arr = errors.array();
    return res.status(422).json({ success: false, message: arr[0]?.msg || 'Validation error.', errors: arr });
  }
  next();
};

module.exports = { validate };
