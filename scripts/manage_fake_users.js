'use strict';

/**
 * Sway Dating App - Jaipur Female Fake Profiles Manager
 * 
 * Usage:
 *   node scripts/manage_fake_users.js          (creates/updates the 10 Jaipur female fake profiles)
 *   node scripts/manage_fake_users.js --create (creates/updates the 10 Jaipur female fake profiles)
 *   node scripts/manage_fake_users.js --delete (deletes all profiles tagged with 'fakeid')
 *   node scripts/manage_fake_users.js --list   (lists all profiles tagged with 'fakeid')
 */

const path = require('path');
const fs = require('fs');

// Ensure node_modules from server directory are available
const serverNodeModules = path.resolve(__dirname, '../server/node_modules');
if (fs.existsSync(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

// Ensure environment variables are loaded
const rootEnvPath = path.resolve(__dirname, '../.env');
const serverEnvPath = path.resolve(__dirname, '../server/.env');

try {
  const dotenv = require('dotenv');
  if (fs.existsSync(serverEnvPath)) {
    dotenv.config({ path: serverEnvPath });
  } else if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  } else {
    dotenv.config();
  }
} catch (_) {}

let pool;
try {
  pool = require(path.resolve(__dirname, '../server/src/config/database'));
} catch (err) {
  const { Pool } = require('pg');
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'sway',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
  });
}

const bcrypt = require('bcryptjs');

const TAG = 'fakeid';
const DEFAULT_PASSWORD = 'Password@123';


const JAIPUR_FEMALE_PROFILES = [
  {
    username: 'shreya_malhotra_delhi',
    nickname: 'Shreya',
    email: 'test_shreya_delhi@sway.local',
    age: 24,
    dob: '2002-04-15',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6328,
    longitude: 77.2197, // Connaught Place
    profile_photo: '/img/m1.jpg',
    bio: 'Architect by day, coffee lover by evening. Love discovering hidden cafes, art spaces and beautiful corners of Delhi.',
    profession: 'Architect',
    education: 'B.Arch',
    marital_status: 'single',
    relationship_type: 'Long-term relationship',
    looking_for: 'Looking for a genuine, creative and open-minded person.',
    height: 165,
    is_online: true,
    interests: JSON.stringify(['Architecture', 'Coffee', 'Art & Design', 'Photography', 'Jazz']),
    hobbies: JSON.stringify(['Pottery', 'Cafe Hopping', 'Sketching', 'Weekend Trips']),
    personality_traits: JSON.stringify(['Creative', 'Ambitious', 'Warm', 'Thoughtful']),
  },
  {
    username: 'ritika_verma_delhi',
    nickname: 'Ritika',
    email: 'test_ritika_delhi@sway.local',
    age: 26,
    dob: '2000-08-20',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5672,
    longitude: 77.2100, // Greater Kailash
    profile_photo: '/img/m2.jpg',
    bio: 'Fashion enthusiast who loves modern design, good food and exploring the vibrant culture of Delhi.',
    profession: 'Fashion Designer',
    education: 'NIFT Graduate',
    marital_status: 'single',
    relationship_type: 'Meaningful connection',
    looking_for: 'Looking for positive conversations and someone with a good sense of humor.',
    height: 163,
    is_online: false,
    interests: JSON.stringify(['Fashion', 'Street Food', 'Textile Arts', 'Travel', 'Indie Pop']),
    hobbies: JSON.stringify(['Designing', 'Cooking', 'Baking', 'Shopping']),
    personality_traits: JSON.stringify(['Bubbly', 'Expressive', 'Passionate', 'Kind']),
  },
  {
    username: 'palak_agarwal_delhi',
    nickname: 'Palak',
    email: 'test_palak_delhi@sway.local',
    age: 25,
    dob: '2001-02-10',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6280,
    longitude: 77.3649, // Mayur Vihar
    profile_photo: '/img/m3.jpg',
    bio: 'Product designer and weekend explorer. Love photography, technology, sunsets and discovering new places.',
    profession: 'Product Designer',
    education: 'B.Des',
    marital_status: 'single',
    relationship_type: 'Long-term relationship',
    looking_for: 'Someone passionate about life and always curious to learn new things.',
    height: 167,
    is_online: true,
    interests: JSON.stringify(['UI/UX', 'Sunsets', 'Hiking', 'Podcasts', 'Film Photography']),
    hobbies: JSON.stringify(['Trekking', 'Digital Illustration', 'Badminton', 'Reading']),
    personality_traits: JSON.stringify(['Curious', 'Adventurous', 'Easygoing', 'Optimistic']),
  },
  {
    username: 'simran_kapoor_delhi',
    nickname: 'Simran',
    email: 'test_simran_delhi@sway.local',
    age: 27,
    dob: '1999-11-05',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.2090, // Central Delhi
    profile_photo: '/img/m4.jpg',
    bio: 'Marketing professional and book lover. Enjoy great conversations, live music and discovering new restaurants.',
    profession: 'Marketing Lead',
    education: 'MBA - Marketing',
    marital_status: 'single',
    relationship_type: 'Dating leading to marriage',
    looking_for: 'Looking for a driven, articulate, and empathetic companion.',
    height: 164,
    is_online: false,
    interests: JSON.stringify(['Branding', 'Books', 'Specialty Coffee', 'Live Gigs', 'Travel']),
    hobbies: JSON.stringify(['Book Clubs', 'Writing', 'Fitness', 'Boutique Cafes']),
    personality_traits: JSON.stringify(['Articulate', 'Empathetic', 'Driven', 'Sophisticated']),
  },
  {
    username: 'sakshi_yadav_delhi',
    nickname: 'Sakshi',
    email: 'test_sakshi_delhi@sway.local',
    age: 23,
    dob: '2003-06-18',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5355,
    longitude: 77.2490, // Saket
    profile_photo: '/img/m1.jpg',
    bio: 'Software engineer, badminton enthusiast and amateur baker. Always trying a new recipe on weekends.',
    profession: 'Software Engineer',
    education: 'B.Tech Computer Science',
    marital_status: 'single',
    relationship_type: 'Long-term relationship',
    looking_for: 'A genuine connection with someone who loves good food and spontaneous plans.',
    height: 162,
    is_online: true,
    interests: JSON.stringify(['Coding', 'Baking', 'Badminton', 'Board Games', 'Dogs']),
    hobbies: JSON.stringify(['Baking', 'Gaming', 'Workout', 'Pet Care']),
    personality_traits: JSON.stringify(['Cheerful', 'Analytical', 'Friendly', 'Supportive']),
  },
  {
    username: 'tanisha_rajput_delhi',
    nickname: 'Tanisha',
    email: 'test_tanisha_delhi@sway.local',
    age: 28,
    dob: '1998-03-25',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6448,
    longitude: 77.2167, // Civil Lines
    profile_photo: '/img/m2.jpg',
    bio: 'History enthusiast and classical dance lover. Fascinated by Delhi’s heritage, architecture and poetry.',
    profession: 'Heritage Consultant',
    education: 'M.A. History & Museology',
    marital_status: 'married',
    relationship_type: 'Long-term relationship',
    looking_for: 'Looking for depth, good conversations, and someone who appreciates culture.',
    height: 168,
    is_online: true,
    interests: JSON.stringify(['Heritage', 'Classical Dance', 'Poetry', 'Museums', 'Indian Classical']),
    hobbies: JSON.stringify(['Kathak', 'Reading Poetry', 'Heritage Walks']),
    personality_traits: JSON.stringify(['Graceful', 'Artistic', 'Cultured', 'Warm-hearted']),
  },
  {
    username: 'muskan_sharma_delhi',
    nickname: 'Muskan',
    email: 'test_muskan_delhi@sway.local',
    age: 25,
    dob: '2001-09-14',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5677,
    longitude: 77.2433, // Lajpat Nagar
    profile_photo: '/img/m3.jpg',
    bio: 'Content creator and travel enthusiast. Love golden hours, creative projects and late-night conversations.',
    profession: 'Digital Creator',
    education: 'B.A. Journalism & Mass Communication',
    marital_status: 'single',
    relationship_type: 'Dating & companionship',
    looking_for: 'Someone spontaneous, funny, and supportive of creative goals.',
    height: 166,
    is_online: false,
    interests: JSON.stringify(['Content Creation', 'Photography', 'Travel', 'Fashion', 'Cinema']),
    hobbies: JSON.stringify(['Vlogging', 'Exploring New Spots', 'Fitness', 'Cinema']),
    personality_traits: JSON.stringify(['Energetic', 'Spontaneous', 'Creative', 'Sociable']),
  },
  {
    username: 'pooja_bhatia_delhi',
    nickname: 'Pooja',
    email: 'test_pooja_delhi@sway.local',
    age: 26,
    dob: '2000-12-02',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5562,
    longitude: 77.1000, // Vasant Kunj
    profile_photo: '/img/m4.jpg',
    bio: 'Healthcare professional with a love for fitness, animals and peaceful weekend evenings.',
    profession: 'Dentist',
    education: 'BDS - Dental Surgery',
    marital_status: 'single',
    relationship_type: 'Long-term relationship',
    looking_for: 'A respectful, kindhearted companion who loves animals and staying active.',
    height: 163,
    is_online: true,
    interests: JSON.stringify(['Healthcare', 'Pilates', 'Animals', 'Healthy Living', 'Music']),
    hobbies: JSON.stringify(['Dog Walking', 'Pilates', 'Podcasts', 'Cooking']),
    personality_traits: JSON.stringify(['Compassionate', 'Dedicated', 'Caring', 'Balanced']),
  },
  {
    username: 'aishwarya_singh_delhi',
    nickname: 'Aishwarya',
    email: 'test_aishwarya_delhi@sway.local',
    age: 24,
    dob: '2002-07-30',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6517,
    longitude: 77.2219, // Daryaganj
    profile_photo: '/img/m1.jpg',
    bio: 'Psychology researcher and indie music fan. Love art exhibitions, old bookstores and meaningful conversations.',
    profession: 'Psychology Researcher',
    education: 'M.Sc Psychology',
    marital_status: 'single',
    relationship_type: 'Meaningful connection',
    looking_for: 'An emotionally mature partner who enjoys good music and genuine conversations.',
    height: 165,
    is_online: false,
    interests: JSON.stringify(['Psychology', 'Indie Music', 'Art Galleries', 'Mindfulness', 'Coffee']),
    hobbies: JSON.stringify(['Journaling', 'Music', 'Yoga', 'Art Galleries']),
    personality_traits: JSON.stringify(['Empathetic', 'Calm', 'Thoughtful', 'Good Listener']),
  },
  {
    username: 'divya_mehta_delhi',
    nickname: 'Divya',
    email: 'test_divya_delhi@sway.local',
    age: 27,
    dob: '1999-05-12',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6132,
    longitude: 77.3045, // Preet Vihar
    profile_photo: '/img/m2.jpg',
    bio: 'Financial consultant and fitness enthusiast. Enjoy morning runs, travel and relaxed evenings with chai.',
    profession: 'Financial Consultant',
    education: 'Chartered Accountant (CA)',
    marital_status: 'single',
    relationship_type: 'Long-term relationship',
    looking_for: 'Looking for an ambitious, grounded partner with shared values.',
    height: 166,
    is_online: true,
    interests: JSON.stringify(['Finance', 'Fitness', 'Running', 'Economics', 'Tea']),
    hobbies: JSON.stringify(['Running', 'Badminton', 'Traveling', 'Reading Non-fiction']),
    personality_traits: JSON.stringify(['Grounded', 'Ambitious', 'Organized', 'Warm']),
  },
];


async function createFakeJaipurUsers() {
  console.log(`\n===============================================================`);
  console.log(`🌸 Creating 10 Jaipur Female IDs (Tagged with: "${TAG}")`);
  console.log(`===============================================================\n`);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const createdOrUpdated = [];

  for (const profile of JAIPUR_FEMALE_PROFILES) {
    // Check if user already exists by email or username
    const existingRes = await pool.query(
      `SELECT id, username, email FROM users WHERE email = $1 OR username = $2`,
      [profile.email, profile.username]
    );

    let userId;
    if (existingRes.rows.length > 0) {
      userId = existingRes.rows[0].id;
      // Update existing record
      await pool.query(
        `UPDATE users SET
          nickname = $1,
          gender = 'female',
          selected_gender = 'female',
          verified_gender = 'female',
          ai_detected_gender = 'female',
          gender_match_status = 'MATCHED',
          date_of_birth = $2,
          age = $3,
          city = $4,
          state = $5,
          country = $6,
          latitude = $7,
          longitude = $8,
          profile_photo = $9,
          bio = $10,
          profession = $11,
          education = $12,
          marital_status = $13,
          relationship_type = $14,
          looking_for = $15,
          height = $16,
          is_online = $17,
          interests = $18,
          hobbies = $19,
          personality_traits = $20,
          languages = 'English, Hindi, Rajasthani',
          languages_spoken = 'English, Hindi, Rajasthani',
          verification_status = 'verified',
          verification_type = 'facial',
          verified_at = NOW(),
          profile_completed = true,
          profile_status = 'COMPLETED',
          onboarding_status = 'COMPLETED',
          profile_moderation_status = 'APPROVED',
          account_status = 'ACTIVE',
          is_active = true,
          is_banned = false,
          admin_notes = $21,
          connect_credits = 50,
          location_updated_at = NOW(),
          updated_at = NOW()
        WHERE id = $22`,
        [
          profile.nickname,
          profile.dob,
          profile.age,
          profile.city,
          profile.state,
          profile.country,
          profile.latitude,
          profile.longitude,
          profile.profile_photo,
          profile.bio,
          profile.profession,
          profile.education,
          profile.marital_status,
          profile.relationship_type,
          profile.looking_for,
          profile.height,
          profile.is_online,
          profile.interests,
          profile.hobbies,
          profile.personality_traits,
          TAG,
          userId,
        ]
      );
      console.log(`[UPDATED] User ID ${userId}: @${profile.username} (${profile.nickname}) - Tagged: "${TAG}"`);
    } else {
      // Insert new record
      const insertRes = await pool.query(
        `INSERT INTO users (
          username, email, password_hash,
          nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
          date_of_birth, age, city, state, country,
          latitude, longitude, profile_photo, bio,
          profession, education, marital_status, relationship_type, looking_for,
          height, is_online, interests, hobbies, personality_traits,
          languages, languages_spoken,
          verification_status, verification_type, verified_at,
          profile_completed, profile_status, onboarding_status, profile_moderation_status,
          account_status, is_active, is_banned,
          admin_notes, connect_credits,
          location_updated_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3,
          $4, 'female', 'female', 'female', 'female', 'MATCHED',
          $5, $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23,
          'English, Hindi, Rajasthani', 'English, Hindi, Rajasthani',
          'verified', 'facial', NOW(),
          true, 'COMPLETED', 'COMPLETED', 'APPROVED',
          'ACTIVE', true, false,
          $24, 50,
          NOW(), NOW(), NOW()
        ) RETURNING id`,
        [
          profile.username,
          profile.email,
          passwordHash,
          profile.nickname,
          profile.dob,
          profile.age,
          profile.city,
          profile.state,
          profile.country,
          profile.latitude,
          profile.longitude,
          profile.profile_photo,
          profile.bio,
          profile.profession,
          profile.education,
          profile.marital_status,
          profile.relationship_type,
          profile.looking_for,
          profile.height,
          profile.is_online,
          profile.interests,
          profile.hobbies,
          profile.personality_traits,
          TAG,
        ]
      );
      userId = insertRes.rows[0].id;
      console.log(`[CREATED] User ID ${userId}: @${profile.username} (${profile.nickname}) - Tagged: "${TAG}"`);
    }

    // Ensure privacy settings record exists
    await pool.query(
      `INSERT INTO user_privacy_settings (
        user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode
      ) VALUES ($1, false, true, true, false, false, false, false)
      ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    createdOrUpdated.push({
      id: userId,
      username: profile.username,
      nickname: profile.nickname,
      email: profile.email,
      age: profile.age,
      city: profile.city,
      tag: TAG,
      password: DEFAULT_PASSWORD,
    });
  }

  console.log(`\n===============================================================`);
  console.log(`✅ Successfully provisioned ${createdOrUpdated.length} Jaipur Female Profiles`);
  console.log(`Default password for all IDs: "${DEFAULT_PASSWORD}"`);
  console.log(`Tag stored in "admin_notes": "${TAG}"`);
  console.log(`===============================================================\n`);
  console.table(createdOrUpdated);
}

async function deleteFakeJaipurUsers() {
  console.log(`\n===============================================================`);
  console.log(`🗑️  Deleting all profiles tagged with "${TAG}"...`);
  console.log(`===============================================================\n`);

  // Find all matching users
  const findRes = await pool.query(
    `SELECT id, username, email, nickname, city, admin_notes
     FROM users
     WHERE admin_notes = $1
        OR email LIKE 'fakeid_%@sway.local'
        OR username LIKE '%_jpr' AND email LIKE 'fakeid_%'`,
    [TAG]
  );

  const fakeUsers = findRes.rows;
  if (fakeUsers.length === 0) {
    console.log(`ℹ️ No users found with tag "${TAG}". Nothing to delete.`);
    return;
  }

  console.log(`Found ${fakeUsers.length} user(s) to delete:`);
  console.table(fakeUsers.map(u => ({ id: u.id, username: u.username, email: u.email, notes: u.admin_notes })));

  const userIds = fakeUsers.map(u => u.id);

  // Safety cascade cleanup if any loose tables exist
  try {
    await pool.query(`DELETE FROM user_privacy_settings WHERE user_id = ANY($1::int[])`, [userIds]);
  } catch (_) {}

  // Delete from users table (cascades to all user tables)
  const delRes = await pool.query(
    `DELETE FROM users WHERE id = ANY($1::int[])`,
    [userIds]
  );

  console.log(`\n✅ Deleted ${delRes.rowCount} user profile(s) with tag "${TAG}".`);
}

async function listFakeJaipurUsers() {
  console.log(`\n===============================================================`);
  console.log(`📋 Listing all profiles tagged with "${TAG}"...`);
  console.log(`===============================================================\n`);

  const res = await pool.query(
    `SELECT id, username, nickname, email, gender, age, city, admin_notes, is_online, created_at
     FROM users
     WHERE admin_notes = $1
        OR email LIKE 'fakeid_%@sway.local'
     ORDER BY id ASC`,
    [TAG]
  );

  if (res.rows.length === 0) {
    console.log(`ℹ️ No fake IDs found with tag "${TAG}".`);
  } else {
    console.table(res.rows);
    console.log(`Total found: ${res.rows.length}`);
  }
}

async function main() {
  const arg = (process.argv[2] || '').toLowerCase().trim();

  try {
    if (arg === '--delete' || arg === '-d' || arg === 'delete') {
      await deleteFakeJaipurUsers();
    } else if (arg === '--list' || arg === '-l' || arg === 'list') {
      await listFakeJaipurUsers();
    } else {
      // Default action is create
      await createFakeJaipurUsers();
    }
  } catch (error) {
    console.error('❌ Error executing script:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createFakeJaipurUsers,
  deleteFakeJaipurUsers,
  listFakeJaipurUsers,
  JAIPUR_FEMALE_PROFILES,
};
