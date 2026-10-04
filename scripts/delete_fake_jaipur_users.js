'use strict';

/**
 * Script to delete all profiles tagged with 'fakeid'.
 * Run with:
 *   node scripts/delete_fake_jaipur_users.js
 */

const { deleteFakeJaipurUsers } = require('./manage_fake_users');

deleteFakeJaipurUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
