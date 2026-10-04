'use strict';

/**
 * ============================================================================
 * SWAY Extramarital Dating Platform - VPS & Local Seeder Script
 * ============================================================================
 * Provisions 30 complete female profiles across Jaipur, Bassi, and Delhi.
 * 
 * Features:
 * - Ages above 27 (28 to 36)
 * - 24 Married profiles, 6 Single profiles (preferring married partners)
 * - Extramarital / discreet dating bios and relationship expectations
 * - Hobbies: Roleplay, Late Night Talks, Dirty Talk, Sensual Massage, etc.
 * - Delhi images mapped strictly to `/img/delhi/...`
 * - Jaipur & Bassi images mapped strictly to unique `/img/...` files
 * - Blank profile photos for discreet profiles
 * - Zero image duplicates across all profiles
 * - Tagged with `admin_notes = 'fakeid'` for easy management and cleanup
 * - Idempotent: safe to run multiple times without duplicating records
 * 
 * Usage on VPS / Local:
 *   node scripts/seed_all_fake_users.js          (Create / Update all 30 profiles)
 *   node scripts/seed_all_fake_users.js --create (Create / Update all 30 profiles)
 *   node scripts/seed_all_fake_users.js --list   (List all 30 fake profiles)
 *   node scripts/seed_all_fake_users.js --delete (Delete all fake profiles)
 */

const path = require('path');
const fs = require('fs');

// Attempt to load node_modules from potential locations (current, parent, server)
const searchNodeModules = [
  path.resolve(__dirname, '../server/node_modules'),
  path.resolve(__dirname, '../node_modules'),
  path.resolve(process.cwd(), 'node_modules'),
  path.resolve(process.cwd(), 'server/node_modules'),
];

for (const nm of searchNodeModules) {
  if (fs.existsSync(nm)) {
    module.paths.unshift(nm);
  }
}

// Attempt to load environment variables (.env, server/.env, etc.)
const searchEnvs = [
  path.resolve(__dirname, '../server/.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '.env'),
];

try {
  const dotenv = require('dotenv');
  for (const envFile of searchEnvs) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
    }
  }
} catch (_) {
  // If dotenv isn't installed, continue with process.env
}

// Setup PostgreSQL pool
let pool;
try {
  pool = require(path.resolve(__dirname, '../server/src/config/database'));
} catch (_) {
  const { Pool } = require('pg');
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  } else {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'sway',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '12345',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
}

const TAG = 'fakeid';
const DEFAULT_PASSWORD = 'Password@123';
// Pre-computed bcrypt hash for 'Password@123' (10 rounds) so script never fails if bcrypt isn't available
const DEFAULT_PASSWORD_HASH = '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm';

// 30 Complete Extramarital Profiles
const USERS = [
  // ==========================================================================
  // 1. JAIPUR (10 Profiles)
  // ==========================================================================
  {
    username: 'ananya_jpr',
    nickname: 'Ananya',
    email: 'fakeid_ananya@sway.local',
    age: 29,
    dob: '1997-04-15',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.9124,
    longitude: 75.7873, // C-Scheme
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A discreet, mature partner who knows how to keep a secret and ignite a spark.',
    bio: 'Married on paper, but missing genuine passion. Looking for an accomplished man for secret coffees, late night talks, and thrilling chemistry. Absolute discretion is a must.',
    profile_photo: '/img/image(10).jpg',
    profession: 'Architect',
    education: 'B.Arch - MNIT Jaipur',
    height: 165,
    is_online: true,
    hobbies: ['Roleplay', 'Late Night Talks', 'Secret Dates', 'Wine & Intimacy', 'Dirty Talk'],
    interests: ['Discreet Romance', 'Sensual Massage', 'Hotel Lounges', 'Roleplay', 'Deep Whispers'],
    personality_traits: ['Seductive', 'Discreet', 'Adventurous', 'Playful'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Sensual Teasing', 'Fantasies'],
  },
  {
    username: 'diya_sharma_jpr',
    nickname: 'Diya',
    email: 'fakeid_diya@sway.local',
    age: 31,
    dob: '1995-08-20',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8528,
    longitude: 75.8236, // Malviya Nagar
    marital_status: 'married',
    relationship_type: 'Secret encounters',
    looking_for: 'A discreet lover who appreciates beauty, excitement, and uninhibited passion.',
    bio: 'Housewife with an adventurous wild side. Craving private excitement away from routine life. Love dressing up, spicy chats, and discreet rendezvous in luxury hotels.',
    profile_photo: '/img/images (1).jpeg',
    profession: 'Fashion Designer',
    education: 'NIFT Graduate',
    height: 163,
    is_online: false,
    hobbies: ['Costume Roleplay', 'Late Night Talk', 'Dirty Talk & Teasing', 'Sensual Massage'],
    interests: ['Kinky Fantasies', 'Discreet Meetups', 'Roleplay', 'Fine Wine', 'Late Night Whispers'],
    personality_traits: ['Passionate', 'Flirtatious', 'Open-Minded', 'Private'],
    sexual_practices: ['Costume Roleplay', 'Dirty Talk', 'BDSM / Teasing', 'Erotic Massages'],
  },
  {
    username: 'kavya_singh_jpr',
    nickname: 'Kavya',
    email: 'fakeid_kavya@sway.local',
    age: 28,
    dob: '1998-02-10',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8915,
    longitude: 75.7423, // Vaishali Nagar
    marital_status: 'single',
    relationship_type: 'Friends with benefits',
    looking_for: 'A generous married gentleman who wants excitement without disrupting home life.',
    bio: 'Single, independent, and prefer mature married men with no emotional drama. Kept private for professional reasons. Let’s share secret thrills and midnight confessions.',
    profile_photo: null, // Blank for discretion
    profession: 'Product Designer',
    education: 'B.Des',
    height: 167,
    is_online: true,
    hobbies: ['Late Night Talks', 'Roleplay', 'Dirty Talk', 'Secret Escapes', 'Cocktails'],
    interests: ['No Drama Romance', 'Roleplay & Fantasies', 'Midnight Calls', 'Luxury Spas'],
    personality_traits: ['Independent', 'Discreet', 'Confident', 'Teasing'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Tease & Denial', 'Sensual Touch'],
  },
  {
    username: 'riya_rathore_jpr',
    nickname: 'Riya',
    email: 'fakeid_riya@sway.local',
    age: 32,
    dob: '1994-11-05',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8920,
    longitude: 75.8267, // Raja Park
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A respectful married gentleman who desires passion and complete confidentiality.',
    bio: 'Corporate lead by day, secret romantic by night. In an empty marriage craving physical and emotional intimacy. Love candlelight, roleplay, and deep late-night desire.',
    profile_photo: '/img/images (2).jpeg',
    profession: 'Marketing Lead',
    education: 'MBA - Marketing',
    height: 164,
    is_online: false,
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Hotel Rendezvous', 'Sensual Massage'],
    interests: ['Discreet Escapes', 'Secret Dinners', 'Kinky Roleplay', 'Romantic Intimacy'],
    personality_traits: ['Sophisticated', 'Sultry', 'Empathetic', 'Daring'],
    sexual_practices: ['Dominance & Submission Lite', 'Dirty Talk', 'Roleplay', 'Slow Sensual Touch'],
  },
  {
    username: 'pooja_choudhary_jpr',
    nickname: 'Pooja',
    email: 'fakeid_pooja@sway.local',
    age: 30,
    dob: '1996-06-18',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8534,
    longitude: 75.7725, // Mansarovar
    marital_status: 'married',
    relationship_type: 'Discreet companionship',
    looking_for: 'An understanding, mature man for mutual excitement and secret moments.',
    bio: 'Private profile for obvious reasons. Married woman seeking a secret escape from monotony. Sweet on the outside, naughty behind closed doors.',
    profile_photo: null, // Blank for discretion
    profession: 'Software Engineer',
    education: 'B.Tech Computer Science',
    height: 162,
    is_online: true,
    hobbies: ['Dirty Talk', 'Late Night Chats', 'Roleplay', 'Secret Road Trips', 'Spicy Banter'],
    interests: ['Discretion First', 'Erotic Roleplay', 'Late Night Calling', 'Private Suites'],
    personality_traits: ['Mysterious', 'Playful', 'Discreet', 'Warm'],
    sexual_practices: ['Spicy Roleplay', 'Dirty Talk', 'Sensual Massages', 'Fantasies'],
  },
  {
    username: 'meera_shekhawat_jpr',
    nickname: 'Meera',
    email: 'fakeid_meera@sway.local',
    age: 33,
    dob: '1993-03-25',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.9298,
    longitude: 75.7951, // Bani Park
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A discerning partner who appreciates grace, discretion, and fiery chemistry.',
    bio: 'Cultured, elegant, and deeply sensual. Married life has turned into just roommates. Seeking a passionate spark, late night talks, and mutual fantasy exploration.',
    profile_photo: '/img/images (3).jpeg',
    profession: 'Heritage Consultant',
    education: 'M.A. History & Museology',
    height: 168,
    is_online: true,
    hobbies: ['Fantasy Roleplay', 'Sensual Dance', 'Late Night Whispers', 'Dirty Talk', 'Fine Dining'],
    interests: ['Romantic Escapes', 'Classical Aesthetics', 'Sensual Intimacy', 'Roleplay'],
    personality_traits: ['Graceful', 'Sensual', 'Intelligent', 'Passionate'],
    sexual_practices: ['Sensual Roleplay', 'Erotic Teasing', 'Dirty Whispering', 'Slow Intimacy'],
  },
  {
    username: 'tanya_mathur_jpr',
    nickname: 'Tanya',
    email: 'fakeid_tanya@sway.local',
    age: 29,
    dob: '1997-09-14',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.9012,
    longitude: 75.8015, // Civil Lines
    marital_status: 'married',
    relationship_type: 'Secret encounters',
    looking_for: 'Someone who knows how to pamper a woman and keep our secret safe.',
    bio: 'Bored of the same daily routine. Looking for secret butterflies, naughty late night talks, and unforgettable private encounters with someone mature.',
    profile_photo: '/img/image(12).jpg',
    profession: 'Digital Creator',
    education: 'B.A. Journalism & Mass Comm',
    height: 166,
    is_online: false,
    hobbies: ['Spicy Roleplay', 'Dirty Talk', 'Late Night Conversations', 'Hotel Stays'],
    interests: ['Discreet Dates', 'Flirting', 'Secret Chemistry', 'Romantic Getaways'],
    personality_traits: ['Bubbly', 'Naughty', 'Discreet', 'Adventurous'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Spicy Sexting', 'Teasing'],
  },
  {
    username: 'isha_bhandari_jpr',
    nickname: 'Isha',
    email: 'fakeid_isha@sway.local',
    age: 34,
    dob: '1992-12-02',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8845,
    longitude: 75.8112, // Bapu Nagar
    marital_status: 'married',
    relationship_type: 'Discreet companionship',
    looking_for: 'A respectful, mature partner for stress-free intimacy and mutual satisfaction.',
    bio: 'Healthcare professional seeking an exclusive discreet connection. Life is too short to live without passion. Love late night talks, sensual massages, and private dates.',
    profile_photo: '/img/image(13).jpg',
    profession: 'Dentist',
    education: 'BDS - Dental Surgery',
    height: 163,
    is_online: true,
    hobbies: ['Sensual Massage', 'Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Pilates'],
    interests: ['Discreet Romance', 'Physical Chemistry', 'Exclusive FWB', 'Luxury Hotels'],
    personality_traits: ['Caring', 'Passionate', 'Private', 'Sophisticated'],
    sexual_practices: ['Sensual Bodywork', 'Roleplay', 'Dirty Talk', 'Intimate Teasing'],
  },
  {
    username: 'sneha_joshi_jpr',
    nickname: 'Sneha',
    email: 'fakeid_sneha@sway.local',
    age: 28,
    dob: '1998-07-30',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.9205,
    longitude: 75.7758, // Shyam Nagar
    marital_status: 'single',
    relationship_type: 'Friends with benefits',
    looking_for: 'A well-settled married man for regular, discreet secret encounters.',
    bio: 'Single girl who finds married men much more mature, respectful, and drama-free. Looking for deep late night calls, roleplay fantasies, and discreet fun.',
    profile_photo: null, // Blank for discretion
    profession: 'Clinical Psychologist',
    education: 'M.Sc Psychology',
    height: 165,
    is_online: false,
    hobbies: ['Late Night Calls', 'Roleplay', 'Dirty Talk', 'Exploring Fantasies', 'Indie Music'],
    interests: ['Discreet Meetups', 'Spicy Banter', 'Sensual Touch', 'No Strings Attached'],
    personality_traits: ['Empathetic', 'Open-Minded', 'Teasing', 'Free-Spirited'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Fantasy Exploration', 'Tease & Please'],
  },
  {
    username: 'aditi_pareek_jpr',
    nickname: 'Aditi',
    email: 'fakeid_aditi@sway.local',
    age: 32,
    dob: '1994-05-12',
    gender: 'female',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8612,
    longitude: 75.8190, // Jawahar Nagar
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A sharp, charming partner who values discretion and intense mutual chemistry.',
    bio: 'Finance executive with a quiet, proper life outside, but seeking fire behind closed doors. Craving dirty late-night talks and exciting hotel meetups.',
    profile_photo: '/img/images (4).jpeg',
    profession: 'Financial Consultant',
    education: 'Chartered Accountant (CA)',
    height: 166,
    is_online: true,
    hobbies: ['Dirty Talk', 'Roleplay', 'Late Night Talks', 'Private Cocktails', 'Sensual Massage'],
    interests: ['Discreet Affairs', 'Hotel Lounges', 'Roleplay Scenarios', 'Romantic Escapes'],
    personality_traits: ['Ambitious', 'Secretive', 'Intense', 'Passionate'],
    sexual_practices: ['Power Dynamic Roleplay', 'Dirty Talk', 'Sensual Teasing'],
  },

  // ==========================================================================
  // 2. BASSI (10 Profiles)
  // ==========================================================================
  {
    username: 'simran_meena_bassi',
    nickname: 'Simran',
    email: 'test_simran_bassi@sway.local',
    age: 29,
    dob: '1997-06-11',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8322,
    longitude: 76.0425,
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'Someone kind, respectful, and adventurous who craves mutual intimacy.',
    bio: 'Married woman longing for romantic attention and secret thrills. Let’s share sweet late night whispers, spicy roleplay, and private stolen moments.',
    profile_photo: '/img/image(14).jpg',
    profession: 'Interior Designer',
    education: 'B.Des Interior Architecture',
    height: 164,
    is_online: true,
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Secret Drives'],
    interests: ['Discreet Flirting', 'Sensual Moments', 'Secret Dating', 'Roleplay'],
    personality_traits: ['Sweet', 'Passionate', 'Discreet', 'Loving'],
    sexual_practices: ['Gentle & Wild Roleplay', 'Dirty Talk', 'Sensual Caressing'],
  },
  {
    username: 'neha_choudhary_bassi',
    nickname: 'Neha',
    email: 'test_neha_bassi@sway.local',
    age: 31,
    dob: '1995-10-18',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8401,
    longitude: 76.0350,
    marital_status: 'married',
    relationship_type: 'Secret encounters',
    looking_for: 'A discreet partner ready for passionate adventures without complications.',
    bio: 'Discreet profile. Married and looking for excitement with a mature partner. In love with kinky hobbies, roleplay, and uninhibited late night talks.',
    profile_photo: null, // Blank for discretion
    profession: 'HR Manager',
    education: 'MBA - Human Resources',
    height: 165,
    is_online: false,
    hobbies: ['Dirty Talk', 'Roleplay', 'Late Night Talk', 'Kinky Fantasies', 'Sensual Massage'],
    interests: ['Secret Rendezvous', 'Discreet Romance', 'BDSM / Teasing', 'Roleplay'],
    personality_traits: ['Adventurous', 'Mysterious', 'Private', 'Unapologetic'],
    sexual_practices: ['Kinky Roleplay', 'Dirty Talk', 'Teasing', 'Sensual Exploration'],
  },
  {
    username: 'pallavi_verma_bassi',
    nickname: 'Pallavi',
    email: 'test_pallavi_bassi@sway.local',
    age: 30,
    dob: '1996-03-22',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8285,
    longitude: 76.0512,
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A married man who understands the need for emotional and physical escape.',
    bio: 'Unhappily married and seeking what’s missing at home: passion, flirtation, and intimacy. Looking for private hotel dates and deep midnight conversations.',
    profile_photo: '/img/images (5).jpeg',
    profession: 'Software QA Engineer',
    education: 'B.Tech IT',
    height: 163,
    is_online: true,
    hobbies: ['Late Night Talks', 'Roleplay', 'Dirty Talk', 'Candlelight Dinners', 'Sensual Touch'],
    interests: ['Discreet Dates', 'Secret Romance', 'Sensual Massage', 'Romantic Intimacy'],
    personality_traits: ['Emotional', 'Sensual', 'Careful', 'Affectionate'],
    sexual_practices: ['Slow Sensual Roleplay', 'Dirty Whispering', 'Intense Intimacy'],
  },
  {
    username: 'ruchi_saini_bassi',
    nickname: 'Ruchi',
    email: 'test_ruchi_bassi@sway.local',
    age: 33,
    dob: '1993-01-14',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8350,
    longitude: 76.0480,
    marital_status: 'married',
    relationship_type: 'Secret encounters',
    looking_for: 'A confident gentleman for hot, secret encounters and mutual chemistry.',
    bio: 'Attractive married woman looking for private indulgence. Sucker for roleplay, naughty conversations, and men who know how to take charge.',
    profile_photo: '/img/images (6).jpeg',
    profession: 'Nutritionist & Wellness Coach',
    education: 'M.Sc Nutrition & Dietetics',
    height: 166,
    is_online: false,
    hobbies: ['Dominance Roleplay', 'Dirty Talk', 'Late Night Talks', 'Sensual Massage'],
    interests: ['Kinky Dating', 'Luxury Stays', 'Secret Meetups', 'Discreet Pleasure'],
    personality_traits: ['Confident', 'Seductive', 'Playful', 'Cautious'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Light Bondage / Teasing', 'Sensual Massage'],
  },
  {
    username: 'komal_yadav_bassi',
    nickname: 'Komal',
    email: 'test_komal_bassi@sway.local',
    age: 28,
    dob: '1998-09-05',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8310,
    longitude: 76.0390,
    marital_status: 'single',
    relationship_type: 'Friends with benefits',
    looking_for: 'A generous, well-mannered married man to spoil me in return for private thrills.',
    bio: 'Single, playful, and no drama. I prefer married men because they value privacy and know how to treat a woman. Love roleplay and spicy late night chats.',
    profile_photo: '/img/image(16).jpg',
    profession: 'Elementary Educator',
    education: 'B.Ed & M.A. English',
    height: 161,
    is_online: true,
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Talk', 'Flirting', 'Baking Treats'],
    interests: ['Casual Fun', 'Roleplay Games', 'Midnight Calls', 'Spoiling Each Other'],
    personality_traits: ['Bubbly', 'Flirty', 'Drama-Free', 'Open-Minded'],
    sexual_practices: ['Playful Roleplay', 'Dirty Talk', 'Tease & Reward'],
  },
  {
    username: 'nidhi_rathore_bassi',
    nickname: 'Nidhi',
    email: 'test_nidhi_bassi@sway.local',
    age: 35,
    dob: '1991-04-20',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8385,
    longitude: 76.0450,
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A mature gentleman looking for passionate, long-term discreet encounters.',
    bio: 'Mature married woman seeking a discreet lover. Looking for genuine chemistry, secret getaways, and thrilling late night phone talks away from routine.',
    profile_photo: '/img/images (7).jpeg',
    profession: 'High School Lecturer',
    education: 'M.Sc Physics',
    height: 167,
    is_online: true,
    hobbies: ['Late Night Talks', 'Sensual Massage', 'Roleplay', 'Dirty Talk', 'Wine Tasting'],
    interests: ['Discreet Escapes', 'Secret Luxury Dates', 'Sensual Intimacy', 'Roleplay'],
    personality_traits: ['Mature', 'Elegant', 'Passionate', 'Discreet'],
    sexual_practices: ['Sensual Roleplay', 'Dirty Talk', 'Erotic Massage', 'Slow Teasing'],
  },
  {
    username: 'sakshi_gupta_bassi',
    nickname: 'Sakshi',
    email: 'test_sakshi_bassi@sway.local',
    age: 30,
    dob: '1996-12-10',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8290,
    longitude: 76.0380,
    marital_status: 'married',
    relationship_type: 'Secret encounters',
    looking_for: 'A discreet partner for exciting, no-strings secret meetups.',
    bio: 'Blank photo for confidentiality. Married and craving physical desire, secret dates, and roleplay fun. Message me if you know how to keep secrets.',
    profile_photo: null, // Blank for discretion
    profession: 'Graphic Designer',
    education: 'B.F.A. Applied Arts',
    height: 163,
    is_online: false,
    hobbies: ['Roleplay', 'Dirty Talk', 'Late Night Talks', 'Exploring Desires', 'Long Drives'],
    interests: ['Complete Discretion', 'Kinky Roleplay', 'Secret Affairs', 'Midnight Fun'],
    personality_traits: ['Secretive', 'Sensual', 'Careful', 'Spontaneous'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Sensual Teasing', 'Uninhibited Intimacy'],
  },
  {
    username: 'payal_sharma_bassi',
    nickname: 'Payal',
    email: 'test_payal_bassi@sway.local',
    age: 32,
    dob: '1994-08-16',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8340,
    longitude: 76.0410,
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A passionate partner who wants a secret girlfriend experience.',
    bio: 'Married life lacks excitement. I’m here for chemistry, flirtation, and dirty late night talks. Seeking someone who makes my heart race again.',
    profile_photo: '/img/images (8).jpeg',
    profession: 'Pharmacist',
    education: 'B.Pharm',
    height: 165,
    is_online: false,
    hobbies: ['Late Night Talks', 'Dirty Talk', 'Roleplay', 'Secret Dinners', 'Sensual Massage'],
    interests: ['Affair Dating', 'Mutual Excitement', 'Sensual Touch', 'Roleplay'],
    personality_traits: ['Warm', 'Passionate', 'Romantic', 'Discreet'],
    sexual_practices: ['Dirty Talk', 'Sensual Roleplay', 'Slow Intimacy', 'Teasing'],
  },
  {
    username: 'harshita_pareek_bassi',
    nickname: 'Harshita',
    email: 'test_harshita_bassi@sway.local',
    age: 29,
    dob: '1997-11-28',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8370,
    longitude: 76.0490,
    marital_status: 'single',
    relationship_type: 'Friends with benefits',
    looking_for: 'A mature married man for regular, private dates and fun times.',
    bio: 'Single girl who loves dating older, married men. No expectations, no jealousy, just pure fun, spicy roleplay, and deep late night banter.',
    profile_photo: '/img/image(18).webp',
    profession: 'Digital Marketing Freelancer',
    education: 'B.Com & Digital Marketing',
    height: 162,
    is_online: true,
    hobbies: ['Roleplay', 'Dirty Talk', 'Late Night Talks', 'Spicy Banter', 'Fitness'],
    interests: ['NSA Fun', 'Roleplay Scenarios', 'Midnight Calls', 'Secret Dinners'],
    personality_traits: ['Confident', 'Direct', 'Teasing', 'Discreet'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Sensual Massages', 'Fantasies'],
  },
  {
    username: 'mansi_mehta_bassi',
    nickname: 'Mansi',
    email: 'test_mansi_bassi@sway.local',
    age: 34,
    dob: '1992-05-19',
    gender: 'female',
    city: 'Bassi',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.8305,
    longitude: 76.0460,
    marital_status: 'married',
    relationship_type: 'Discreet companionship',
    looking_for: 'A classy gentleman who understands the rules of discreet extramarital dating.',
    bio: 'Married professional. Looking for an exclusive, ongoing discreet relationship with mutual chemistry. Love hotel escapes, roleplay, and sensual massages.',
    profile_photo: '/img/images (9).jpeg',
    profession: 'Content Lead',
    education: 'B.A. Mass Communication',
    height: 164,
    is_online: false,
    hobbies: ['Sensual Massage', 'Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Spa Dates'],
    interests: ['Discreet Luxury Meetups', 'Sensual Intimacy', 'Secret Romance'],
    personality_traits: ['Sophisticated', 'Private', 'Deeply Sensual', 'Grounded'],
    sexual_practices: ['Sensual Body Massage', 'Roleplay', 'Dirty Talk', 'Passionate Touch'],
  },

  // ==========================================================================
  // 3. DELHI (10 Profiles)
  // All images strictly from /img/delhi/... with ZERO duplicates
  // ==========================================================================
  {
    username: 'shreya_malhotra_delhi',
    nickname: 'Shreya',
    email: 'test_shreya_delhi@sway.local',
    age: 30,
    dob: '1996-04-15',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6328,
    longitude: 77.2197, // Connaught Place
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'An elite, discreet partner for mutual indulgence without complications.',
    bio: 'South Delhi wife living a comfortable but passionless life. Seeking a discreet gentleman for secret 5-star hotel dates, roleplay, and uninhibited romance.',
    profile_photo: '/img/delhi/images.jpeg',
    profession: 'Architect',
    education: 'B.Arch',
    height: 165,
    is_online: true,
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Talk', 'Luxury Stays', 'Sensual Massage'],
    interests: ['Discreet Extramarital Dating', '5-Star Rendezvous', 'Sensual Pleasures'],
    personality_traits: ['Sophisticated', 'Passionate', 'Discreet', 'Adventurous'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Erotic Massage', 'Teasing'],
  },
  {
    username: 'ritika_verma_delhi',
    nickname: 'Ritika',
    email: 'test_ritika_delhi@sway.local',
    age: 32,
    dob: '1994-08-20',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5672,
    longitude: 77.2100, // Greater Kailash
    marital_status: 'married',
    relationship_type: 'Secret encounters',
    looking_for: 'A dominant, discreet man who knows how to take charge behind closed doors.',
    bio: 'Fashion industry insider in a sexless marriage. Craving wild roleplay, dirty talk, and electric chemistry with someone discreet.',
    profile_photo: '/img/delhi/zSHj1477900-0416588684335828919-Female_VvjwZnsZzQdjnXaj_450X600.webp',
    profession: 'Fashion Designer',
    education: 'NIFT Graduate',
    height: 163,
    is_online: false,
    hobbies: ['Kinky Roleplay', 'Dirty Talk', 'Late Night Talks', 'Costume Play', 'Cocktails'],
    interests: ['BDSM / Teasing', 'Roleplay', 'Discreet Affairs', 'Sensual Massages'],
    personality_traits: ['Daring', 'Sensual', 'Private', 'Expressive'],
    sexual_practices: ['Costume Roleplay', 'Dirty Talk', 'Tease & Denial', 'Kinky Fun'],
  },
  {
    username: 'palak_agarwal_delhi',
    nickname: 'Palak',
    email: 'test_palak_delhi@sway.local',
    age: 31,
    dob: '1995-02-14',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5244,
    longitude: 77.2066, // Saket
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A charming partner who knows how to treat a woman and maintain privacy.',
    bio: 'Married and craving the butterflies again. Looking for secret lunches, late night dirty talks, and private getaways with a respectful married gentleman.',
    profile_photo: '/img/delhi/images (1).jpeg',
    profession: 'Product Manager',
    education: 'B.Tech & MBA',
    height: 167,
    is_online: true,
    hobbies: ['Late Night Talks', 'Dirty Talk', 'Roleplay', 'Secret Dinners', 'Sensual Touch'],
    interests: ['Discreet Dates', 'Secret Romance', 'Sensual Intimacy', 'Roleplay'],
    personality_traits: ['Charming', 'Sensual', 'Discreet', 'Warm'],
    sexual_practices: ['Dirty Talk', 'Roleplay', 'Sensual Massages', 'Teasing'],
  },
  {
    username: 'simran_kapoor_delhi',
    nickname: 'Simran',
    email: 'test_simran_delhi@sway.local',
    age: 35,
    dob: '1991-11-04',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5355,
    longitude: 77.1578, // Hauz Khas
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A successful, mature man for mutual excitement and secret rendezvous.',
    bio: 'Glamorous, discreet, and unapologetically craving passion. Love romantic hotel weekends, dirty late night chats, and spicy roleplay fantasies.',
    profile_photo: '/img/delhi/images (2).jpeg',
    profession: 'Marketing Lead',
    education: 'MBA - Marketing',
    height: 164,
    is_online: false,
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Hotel Suites', 'Sensual Massage'],
    interests: ['Luxury Escapes', 'Secret Chemistry', 'Kinky Roleplay', 'Sensual Pleasures'],
    personality_traits: ['Glamorous', 'Sensual', 'Confident', 'Discreet'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Slow Sensual Touch', 'Teasing'],
  },
  {
    username: 'sakshi_yadav_delhi',
    nickname: 'Sakshi',
    email: 'test_sakshi_delhi@sway.local',
    age: 28,
    dob: '1998-06-18',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5355,
    longitude: 77.2490, // Nehru Place
    marital_status: 'single',
    relationship_type: 'Friends with benefits',
    looking_for: 'A mature married man for regular, private fun and late night talks.',
    bio: 'Single girl who finds married men much more appealing—no strings, no expectations, just pure thrilling fun, roleplay, and dirty late night banter.',
    profile_photo: null, // Blank for discretion
    profession: 'Software Engineer',
    education: 'B.Tech Computer Science',
    height: 162,
    is_online: true,
    hobbies: ['Roleplay', 'Dirty Talk', 'Late Night Talks', 'Spicy Banter', 'Midnight Drives'],
    interests: ['NSA Fun', 'Roleplay Scenarios', 'Midnight Calls', 'Secret Hotel Dates'],
    personality_traits: ['Spontaneous', 'Playful', 'Discreet', 'Teasing'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Sensual Massages', 'Fantasies'],
  },
  {
    username: 'tanisha_rajput_delhi',
    nickname: 'Tanisha',
    email: 'test_tanisha_delhi@sway.local',
    age: 36,
    dob: '1990-03-25',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6448,
    longitude: 77.2167, // Civil Lines
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A distinguished gentleman who appreciates discreet, passionate intimacy.',
    bio: 'Married woman of high standards. Missing deep passion and physical touch. Looking for an accomplished lover for secret dinners, roleplay, and sensual escapades.',
    profile_photo: '/img/delhi/images (3).jpeg',
    profession: 'Heritage Consultant',
    education: 'M.A. History & Museology',
    height: 168,
    is_online: true,
    hobbies: ['Fantasy Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Wine & Dine', 'Sensual Touch'],
    interests: ['Discreet Extramarital Romance', 'Hotel Lounges', 'Sensual Pleasures'],
    personality_traits: ['Sophisticated', 'Passionate', 'Discreet', 'Sensual'],
    sexual_practices: ['Sensual Roleplay', 'Dirty Talk', 'Teasing', 'Erotic Massages'],
  },
  {
    username: 'muskan_sharma_delhi',
    nickname: 'Muskan',
    email: 'test_muskan_delhi@sway.local',
    age: 29,
    dob: '1997-09-14',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5677,
    longitude: 77.2433, // Lajpat Nagar
    marital_status: 'single',
    relationship_type: 'Friends with benefits',
    looking_for: 'A generous married gentleman for thrilling secret moments.',
    bio: 'Single, modern, and open-minded. Prefer dating married men because they are mature, discreet, and keep things simple. Love dirty talk and adventurous roleplay.',
    profile_photo: '/img/delhi/images (4).jpeg',
    profession: 'Digital Creator',
    education: 'B.A. Journalism & Mass Communication',
    height: 166,
    is_online: false,
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Talk', 'Secret Escapes', 'Cocktails'],
    interests: ['No Drama Romance', 'Roleplay & Fantasies', 'Midnight Calls', 'Discreet Dates'],
    personality_traits: ['Modern', 'Flirty', 'Drama-Free', 'Adventurous'],
    sexual_practices: ['Playful Roleplay', 'Dirty Talk', 'Tease & Please', 'Sensual Fun'],
  },
  {
    username: 'pooja_bhatia_delhi',
    nickname: 'Pooja',
    email: 'test_pooja_delhi@sway.local',
    age: 33,
    dob: '1993-12-02',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.5562,
    longitude: 77.1000, // Vasant Kunj
    marital_status: 'married',
    relationship_type: 'Discreet companionship',
    looking_for: 'A discreet partner ready for passionate adventures without complications.',
    bio: 'Discreet profile. Married and seeking an exclusive connection. Looking for someone mature to share secret excitement, late night talks, and mutual desires.',
    profile_photo: null, // Blank for discretion
    profession: 'Dentist',
    education: 'BDS - Dental Surgery',
    height: 163,
    is_online: true,
    hobbies: ['Dirty Talk', 'Late Night Talks', 'Roleplay', 'Sensual Massage', 'Hotel Lounges'],
    interests: ['Complete Discretion', 'Sensual Pleasures', 'Secret Rendezvous'],
    personality_traits: ['Mysterious', 'Sensual', 'Private', 'Warm'],
    sexual_practices: ['Dirty Talk', 'Sensual Roleplay', 'Slow Intimacy', 'Teasing'],
  },
  {
    username: 'aishwarya_singh_delhi',
    nickname: 'Aishwarya',
    email: 'test_aishwarya_delhi@sway.local',
    age: 30,
    dob: '1996-07-30',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6517,
    longitude: 77.2219, // Daryaganj
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A gentleman who values discretion as much as I do. Chemistry is everything.',
    bio: 'In a loveless marriage seeking genuine passion. Sucker for intellectual banter, dirty late night whispers, and secret hotel encounters.',
    profile_photo: '/img/delhi/images (5).jpeg',
    profession: 'Psychology Researcher',
    education: 'M.Sc Psychology',
    height: 165,
    is_online: false,
    hobbies: ['Late Night Talks', 'Roleplay', 'Dirty Whispers', 'Sensual Massage', 'Wine Tasting'],
    interests: ['Affair Dating', 'Romantic Escapes', 'Sensual Touch', 'Roleplay Scenarios'],
    personality_traits: ['Articulate', 'Sensual', 'Passionate', 'Private'],
    sexual_practices: ['Sensual Roleplay', 'Dirty Talk', 'Teasing', 'Deep Intimacy'],
  },
  {
    username: 'divya_mehta_delhi',
    nickname: 'Divya',
    email: 'test_divya_delhi@sway.local',
    age: 34,
    dob: '1992-05-12',
    gender: 'female',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6132,
    longitude: 77.3045, // Preet Vihar
    marital_status: 'married',
    relationship_type: 'Extramarital romance',
    looking_for: 'A discreet, mature man for mutual excitement and private indulgence.',
    bio: 'Married corporate professional with a thirst for excitement. Craving dirty late-night talks, spicy roleplay, and private weekend meetups.',
    profile_photo: '/img/delhi/images (6).jpeg',
    profession: 'Financial Consultant',
    education: 'Chartered Accountant (CA)',
    height: 166,
    is_online: true,
    hobbies: ['Roleplay', 'Dirty Talk', 'Late Night Talks', 'Hotel Lounges', 'Sensual Massage'],
    interests: ['Discreet Affairs', 'Hotel Rendezvous', 'Sensual Intimacy', 'Roleplay'],
    personality_traits: ['Ambitious', 'Secretive', 'Intense', 'Passionate'],
    sexual_practices: ['Power Dynamic Roleplay', 'Dirty Talk', 'Sensual Teasing'],
  },
];

async function seedAllUsers() {
  console.log(`\n===============================================================`);
  console.log(`🚀 Provisioning 30 Extramarital Female Profiles (VPS & Local)`);
  console.log(`===============================================================\n`);

  let createdCount = 0;
  let updatedCount = 0;
  const processedUsers = [];

  for (const user of USERS) {
    // Check if user already exists by email or username
    const existing = await pool.query(
      `SELECT id, username, email FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
      [user.email, user.username]
    );

    let userId;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
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
          marital_status = $9,
          relationship_type = $10,
          looking_for = $11,
          bio = $12,
          profile_photo = $13,
          profession = $14,
          education = $15,
          height = $16,
          is_online = $17,
          hobbies = $18,
          interests = $19,
          personality_traits = $20,
          sexual_practices = $21,
          languages = 'English, Hindi',
          languages_spoken = 'English, Hindi',
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
          admin_notes = $22,
          connect_credits = 50,
          location_updated_at = NOW(),
          updated_at = NOW()
        WHERE id = $23`,
        [
          user.nickname,
          user.dob,
          user.age,
          user.city,
          user.state,
          user.country,
          user.latitude,
          user.longitude,
          user.marital_status,
          user.relationship_type,
          user.looking_for,
          user.bio,
          user.profile_photo,
          user.profession,
          user.education,
          user.height,
          user.is_online,
          JSON.stringify(user.hobbies),
          JSON.stringify(user.interests),
          JSON.stringify(user.personality_traits),
          JSON.stringify(user.sexual_practices),
          TAG,
          userId,
        ]
      );
      updatedCount++;
      console.log(`[UPDATED] User ID ${userId}: @${user.username} (${user.city}, ${user.age}yo, ${user.marital_status})`);
    } else {
      const insertRes = await pool.query(
        `INSERT INTO users (
          username, email, password_hash,
          nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
          date_of_birth, age, city, state, country,
          latitude, longitude, marital_status, relationship_type, looking_for,
          bio, profile_photo, profession, education, height, is_online,
          hobbies, interests, personality_traits, sexual_practices,
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
          $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24,
          'English, Hindi', 'English, Hindi',
          'verified', 'facial', NOW(),
          true, 'COMPLETED', 'COMPLETED', 'APPROVED',
          'ACTIVE', true, false,
          $25, 50,
          NOW(), NOW(), NOW()
        ) RETURNING id`,
        [
          user.username,
          user.email,
          DEFAULT_PASSWORD_HASH,
          user.nickname,
          user.dob,
          user.age,
          user.city,
          user.state,
          user.country,
          user.latitude,
          user.longitude,
          user.marital_status,
          user.relationship_type,
          user.looking_for,
          user.bio,
          user.profile_photo,
          user.profession,
          user.education,
          user.height,
          user.is_online,
          JSON.stringify(user.hobbies),
          JSON.stringify(user.interests),
          JSON.stringify(user.personality_traits),
          JSON.stringify(user.sexual_practices),
          TAG,
        ]
      );
      userId = insertRes.rows[0].id;
      createdCount++;
      console.log(`[CREATED] User ID ${userId}: @${user.username} (${user.city}, ${user.age}yo, ${user.marital_status})`);
    }

    // Ensure privacy settings record exists
    await pool.query(
      `INSERT INTO user_privacy_settings (
        user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode
      ) VALUES ($1, false, true, true, false, false, false, false)
      ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    processedUsers.push({
      id: userId,
      username: user.username,
      city: user.city,
      age: user.age,
      status: user.marital_status,
      photo: user.profile_photo || '(BLANK)',
    });
  }

  console.log(`\n===============================================================`);
  console.log(`✅ Finished: ${createdCount} Created, ${updatedCount} Updated (${processedUsers.length} total)`);
  console.log(`Default password for all users: "${DEFAULT_PASSWORD}"`);
  console.log(`Tag (admin_notes): "${TAG}"`);
  console.log(`===============================================================\n`);

  // City breakdown
  const citySummary = await pool.query(`
    SELECT city, COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE marital_status = 'married')::int AS married,
           COUNT(*) FILTER (WHERE marital_status = 'single')::int AS single,
           COUNT(*) FILTER (WHERE profile_photo IS NOT NULL)::int AS has_photo,
           COUNT(*) FILTER (WHERE profile_photo IS NULL)::int AS blank_photo
    FROM users
    WHERE admin_notes = $1
    GROUP BY city
    ORDER BY city ASC
  `, [TAG]);

  console.log('City Breakdown:');
  console.table(citySummary.rows);
}

async function listUsers() {
  console.log(`\n===============================================================`);
  console.log(`📋 Listing all profiles tagged with "${TAG}"...`);
  console.log(`===============================================================\n`);

  const res = await pool.query(
    `SELECT id, username, city, age, marital_status,
            COALESCE(profile_photo, '(BLANK)') AS photo, is_online, admin_notes
     FROM users
     WHERE admin_notes = $1
     ORDER BY city ASC, id ASC`,
    [TAG]
  );

  if (res.rows.length === 0) {
    console.log(`ℹ️ No fake users found with tag "${TAG}".`);
  } else {
    console.table(res.rows);
    console.log(`Total found: ${res.rows.length}`);
  }
}

async function deleteUsers() {
  console.log(`\n===============================================================`);
  console.log(`🗑️  Deleting all profiles tagged with "${TAG}"...`);
  console.log(`===============================================================\n`);

  const findRes = await pool.query(
    `SELECT id, username, email, city FROM users WHERE admin_notes = $1`,
    [TAG]
  );

  const fakeUsers = findRes.rows;
  if (fakeUsers.length === 0) {
    console.log(`ℹ️ No users found with tag "${TAG}". Nothing to delete.`);
    return;
  }

  console.log(`Found ${fakeUsers.length} user(s) to delete:`);
  console.table(fakeUsers);

  const userIds = fakeUsers.map(u => u.id);

  try {
    await pool.query(`DELETE FROM user_privacy_settings WHERE user_id = ANY($1::int[])`, [userIds]);
  } catch (_) {}

  const delRes = await pool.query(
    `DELETE FROM users WHERE id = ANY($1::int[])`,
    [userIds]
  );

  console.log(`\n✅ Deleted ${delRes.rowCount} user profile(s) with tag "${TAG}".`);
}

async function main() {
  const arg = (process.argv[2] || '').toLowerCase().trim();

  try {
    if (arg === '--delete' || arg === '-d' || arg === 'delete') {
      await deleteUsers();
    } else if (arg === '--list' || arg === '-l' || arg === 'list') {
      await listUsers();
    } else {
      await seedAllUsers();
    }
  } catch (err) {
    console.error('❌ Error executing script:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  seedAllUsers,
  deleteUsers,
  listUsers,
  USERS,
};
