'use strict';

require('dotenv').config();

module.exports = {
  NODE_ENV:   process.env.NODE_ENV    || 'development',
  PORT:       parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL  || 'http://localhost:5173',
  ADMIN_URL:  process.env.ADMIN_URL   || 'http://localhost:5174',

  DB_HOST:     process.env.DB_HOST     || 'localhost',
  DB_PORT:     parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME:     process.env.DB_NAME     || 'sway',
  DB_USER:     process.env.DB_USER     || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_SSL:      process.env.DB_SSL      === 'true',

  JWT_SECRET:     process.env.JWT_SECRET     || 'sway_secret_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  RAZORPAY_KEY_ID:     process.env.RAZORPAY_KEY_ID     || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY    || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
};
