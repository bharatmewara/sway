'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

const filter = (req, file, cb) =>
  ALLOWED.includes(file.mimetype)
    ? cb(null, true)
    : cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only jpeg/png/webp images allowed.'), false);

const wrap = (fn) => (req, res, next) =>
  fn(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max 5MB.' : err.message;
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(400).json({ success: false, message: err.message || 'Upload error.' });
  });

module.exports = {
  uploadProfile:      wrap(multer({ storage, fileFilter: filter, limits: { fileSize: MAX_SIZE } }).single('photo')),
  uploadPrivate:      wrap(multer({ storage, fileFilter: filter, limits: { fileSize: MAX_SIZE } }).single('photo')),
  uploadVerification: wrap(multer({ storage, fileFilter: filter, limits: { fileSize: MAX_SIZE } }).fields([
    { name: 'selfie',   maxCount: 1 },
    { name: 'document', maxCount: 1 },
  ])),
  uploadStory: wrap(multer({ storage, fileFilter: filter, limits: { fileSize: MAX_SIZE } }).single('media')),
};
