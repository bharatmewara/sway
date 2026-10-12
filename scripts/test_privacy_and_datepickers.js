'use strict';

const pool = require('../server/src/config/database');
const authService = require('../server/src/services/auth.service');
const profileService = require('../server/src/services/profile.service');
const jwt = require('../server/src/utils/jwt');

async function runRegressionTests() {
  console.log('====================================================');
  console.log('🧪 SWAY PRIVACY, SELFIE ISOLATION & DATEPICKER TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- TEST SUITE 1: Date of Birth & 18+ Validation ---
  console.log('📌 Test Suite 1: DOB & 18+ Age Validation Logic');
  {
    // Test under 18
    const underageDob = '2010-01-01';
    let underageFailed = false;
    try {
      await authService.register({
        username: 'underage_test',
        email: 'underage@test.com',
        password: 'password123',
        selected_gender: 'female',
        dob: underageDob,
        terms_accepted: true,
      });
    } catch (err) {
      underageFailed = err.message.includes('18');
    }
    assert(underageFailed, 'Reject registration for user under 18 years old');

    // Test leap year calculation: 2024 is leap, 2023 is not
    const leapDate = new Date(2024, 1, 29);
    assert(leapDate.getDate() === 29, 'Leap year 2024-02-29 is valid date');
    const nonLeapDate = new Date(2023, 1, 29);
    assert(nonLeapDate.getDate() === 1, 'Non-leap year 2023-02-29 correctly overflows to March 1');

    // Test valid 18+ user (e.g. 25 years old)
    const validDob = '2000-05-15';
    const age = authService.calcAge(validDob);
    assert(age >= 18, `Valid DOB ${validDob} calculated as ${age} years old (>= 18)`);
  }

  // --- TEST SUITE 2: Verification Selfie Isolation & Profile Photo Separation ---
  console.log('\n📌 Test Suite 2: Verification Selfie Isolation & Zero Retention');
  {
    // Check superadmin/users table in database
    const userRes = await pool.query(
      `SELECT id, username, profile_photo, photo_bytes FROM users WHERE id = 1`
    );
    const user = userRes.rows[0];
    const isLeakedDataUri = user?.profile_photo && user.profile_photo.startsWith('data:');
    assert(!isLeakedDataUri, 'User profile_photo does NOT contain raw data: selfie URI');

    // Check verification_requests table
    const vrRes = await pool.query(
      `SELECT COUNT(*)::int AS leaked_selfies FROM verification_requests WHERE selfie_photo IS NOT NULL OR selfie_bytes IS NOT NULL`
    );
    const leakedCount = vrRes.rows[0].leaked_selfies;
    assert(leakedCount === 0, `No verification selfies retained in verification_requests table (${leakedCount} leaked entries)`);
  }

  // --- TEST SUITE 3: Private Photos & Static Route Shielding ---
  console.log('\n📌 Test Suite 3: Private Photos & Static Route Shielding');
  {
    const fs = require('fs');
    const path = require('path');
    const appSource = fs.readFileSync(path.resolve(__dirname, '../server/src/app.js'), 'utf8');

    // Verify static routes in app.js
    const servesVerificationStatic = appSource.includes("express.static(path.join(uploadsDir, 'verification'))");
    const servesPrivateStatic = appSource.includes("express.static(path.join(uploadsDir, 'private'))");
    const servesUploadsRoot = appSource.includes("app.use('/uploads', express.static(uploadsDir))");

    assert(!servesVerificationStatic, 'app.js does NOT serve /uploads/verification statically');
    assert(!servesPrivateStatic, 'app.js does NOT serve /uploads/private statically');
    assert(!servesUploadsRoot, 'app.js does NOT serve generic /uploads root directory statically');

    // Verify verification controller does not assign selfie to profile photo
    const verifyCtrlSource = fs.readFileSync(path.resolve(__dirname, '../server/src/controllers/verification.controller.js'), 'utf8');
    const assignsSelfieToProfile = verifyCtrlSource.includes("profile_photo = COALESCE(NULLIF(profile_photo, ''), $4)");
    assert(!assignsSelfieToProfile, 'verification.controller.js does NOT assign selfie to profile_photo');

    const setsNoCache = verifyCtrlSource.includes("res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')");
    assert(setsNoCache, 'verification.controller.js enforces strict no-cache headers');
  }

  // --- TEST SUITE 4: Client DatePicker Component & Theme Integration ---
  console.log('\n📌 Test Suite 4: Client DatePicker Component & Theme Integration');
  {
    const fs = require('fs');
    const path = require('path');
    const dpSource = fs.readFileSync(path.resolve(__dirname, '../client/src/components/common/DatePicker/DatePicker.jsx'), 'utf8');
    const dpCss = fs.readFileSync(path.resolve(__dirname, '../client/src/components/common/DatePicker/DatePicker.css'), 'utf8');

    assert(dpSource.includes('minAge = 18'), 'DatePicker defaults minAge to 18');
    assert(dpSource.includes('calculateAge'), 'DatePicker calculates age and validates minAge');
    assert(dpSource.includes('MONTH_NAMES'), 'DatePicker includes fast month selector dropdown');
    assert(dpSource.includes('availableYears'), 'DatePicker includes fast year selector dropdown');
    assert(dpCss.includes('#76000b'), 'DatePicker CSS matches Sway primary wine #76000b design token');
    assert(dpCss.includes('z-index: 9999'), 'DatePicker popup has high z-index (9999) to prevent overflow clipping');

    const regSource = fs.readFileSync(path.resolve(__dirname, '../client/src/components/auth/RegisterForm.jsx'), 'utf8');
    assert(regSource.includes('<DatePicker'), 'RegisterForm.jsx uses standardized DatePicker');

    const profSource = fs.readFileSync(path.resolve(__dirname, '../client/src/pages/app/Profile/Profile.jsx'), 'utf8');
    assert(profSource.includes('<DatePicker'), 'Profile.jsx uses standardized DatePicker');
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runRegressionTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
