'use strict';

/**
 * Script to create 10 Jaipur Female Profiles tagged with 'fakeid'.
 * Run with:
 *   node scripts/create_fake_jaipur_users.js
 */

const { createFakeJaipurUsers } = require('./manage_fake_users');

createFakeJaipurUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
