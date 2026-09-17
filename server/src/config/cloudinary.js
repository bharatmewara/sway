'use strict';

const env = require('./env');

let cloudinary = null;

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  const { v2 } = require('cloudinary');
  v2.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key:    env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  cloudinary = v2;
  console.log('[CLOUDINARY] Configured.');
}

module.exports = cloudinary;
