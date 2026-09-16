'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Ensure upload directory exists
 */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Generic storage factory
 */
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(__dirname, '../../uploads', destination);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
};

/**
 * File filter: accept only images
 */
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files (jpeg, png, webp, gif) are allowed.'), false);
  }
};

/**
 * uploadProfile - single field 'photo', dest: uploads/profiles
 */
const uploadProfile = multer({
  storage: createStorage('profiles'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('photo');

/**
 * uploadPrivate - single field 'photo', dest: uploads/private
 */
const uploadPrivate = multer({
  storage: createStorage('private'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('photo');

/**
 * uploadVerification - fields: selfie + document, dest: uploads/verification
 */
const uploadVerification = multer({
  storage: createStorage('verification'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).fields([
  { name: 'selfie', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);

/**
 * Multer error handler wrapper
 */
const handleUploadError = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
          }
          return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(400).json({ success: false, message: err.message || 'File upload error.' });
      }
      next();
    });
  };
};

module.exports = {
  uploadProfile: handleUploadError(uploadProfile),
  uploadPrivate: handleUploadError(uploadPrivate),
  uploadVerification: handleUploadError(uploadVerification),
};
