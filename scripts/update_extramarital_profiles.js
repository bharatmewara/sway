'use strict';

/**
 * Sway Dating App - Update Profiles for Extramarital Dating
 *
 * Requirements:
 * 1. Increase age of all singles to above 27 (e.g., 28 to 36).
 * 2. Convert most profiles to 'married', leaving a few as 'single'.
 * 3. Write bios tailored for an extra-marital / discreet dating platform.
 * 4. Assign images from client/public/img, leaving some blank (null) for discretion.
 * 5. Add hobbies like Roleplay, Late Night Talks, Dirty Talk, and spicy / kinky interests.
 */

const path = require('path');
const fs = require('fs');

const serverNodeModules = path.resolve(__dirname, '../server/node_modules');
if (fs.existsSync(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

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

// Available images from client/public/img
const IMG_LIST = [
  '/img/image(10).jpg',
  '/img/image(11).avif',
  '/img/image(12).jpg',
  '/img/image(13).jpg',
  '/img/image(14).jpg',
  '/img/image(16).jpg',
  '/img/image(18).webp',
  '/img/images (1).jpeg',
  '/img/images (2).jpeg',
  '/img/images (3).jpeg',
  '/img/images (4).jpeg',
  '/img/images (5).jpeg',
  '/img/images (6).jpeg',
  '/img/images (7).jpeg',
  '/img/images (8).jpeg',
  '/img/images (9).jpeg',
  '/img/images.jpeg',
  '/img/m1.jpg',
];

// 30 rich extramarital profile configurations
const PROFILE_UPDATES = [
  // --- JAIPUR (10 profiles) ---
  {
    username: 'ananya_jpr',
    age: 29,
    dob: '1997-04-15',
    marital_status: 'married',
    profile_photo: '/img/image(10).jpg',
    bio: 'Married on paper, but missing genuine passion. Looking for an accomplished man for secret coffees, late night talks, and thrilling chemistry. Absolute discretion is a must.',
    hobbies: ['Roleplay', 'Late Night Talks', 'Secret Dates', 'Wine & Intimacy', 'Dirty Talk'],
    interests: ['Discreet Romance', 'Sensual Massage', 'Hotel Lounges', 'Roleplay', 'Deep Whispers'],
    personality_traits: ['Seductive', 'Discreet', 'Adventurous', 'Playful'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Sensual Teasing', 'Fantasies'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A discreet, mature partner who knows how to keep a secret and ignite a spark.',
  },
  {
    username: 'diya_sharma_jpr',
    age: 31,
    dob: '1995-08-20',
    marital_status: 'married',
    profile_photo: '/img/images (1).jpeg',
    bio: 'Housewife with an adventurous wild side. Craving private excitement away from routine life. Love dressing up, spicy chats, and discreet rendezvous in luxury hotels.',
    hobbies: ['Costume Roleplay', 'Late Night Talk', 'Dirty Talk & Teasing', 'Sensual Massage'],
    interests: ['Kinky Fantasies', 'Discreet Meetups', 'Roleplay', 'Fine Wine', 'Late Night Whispers'],
    personality_traits: ['Passionate', 'Flirtatious', 'Open-Minded', 'Private'],
    sexual_practices: ['Costume Roleplay', 'Dirty Talk', 'BDSM / Teasing', 'Erotic Massages'],
    relationship_type: 'Secret encounters',
    looking_for: 'A discreet lover who appreciates beauty, excitement, and uninhibited passion.',
  },
  {
    username: 'kavya_singh_jpr',
    age: 28,
    dob: '1998-02-10',
    marital_status: 'single', // Single who prefers dating married men
    profile_photo: null, // Blank profile for discretion
    bio: 'Single, independent, and prefer mature married men with no emotional drama. Kept private for professional reasons. Let’s share secret thrills and midnight confessions.',
    hobbies: ['Late Night Talks', 'Roleplay', 'Dirty Talk', 'Secret Escapes', 'Cocktails'],
    interests: ['No Drama Romance', 'Roleplay & Fantasies', 'Midnight Calls', 'Luxury Spas'],
    personality_traits: ['Independent', 'Discreet', 'Confident', 'Teasing'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Tease & Denial', 'Sensual Touch'],
    relationship_type: 'Friends with benefits',
    looking_for: 'A generous married gentleman who wants excitement without disrupting home life.',
  },
  {
    username: 'riya_rathore_jpr',
    age: 32,
    dob: '1994-11-05',
    marital_status: 'married',
    profile_photo: '/img/images (2).jpeg',
    bio: 'Corporate lead by day, secret romantic by night. In an empty marriage craving physical and emotional intimacy. Love candlelight, roleplay, and deep late-night desire.',
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Hotel Rendezvous', 'Sensual Massage'],
    interests: ['Discreet Escapes', 'Secret Dinners', 'Kinky Roleplay', 'Romantic Intimacy'],
    personality_traits: ['Sophisticated', 'Sultry', 'Empathetic', 'Daring'],
    sexual_practices: ['Dominance & Submission Lite', 'Dirty Talk', 'Roleplay', 'Slow Sensual Touch'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A respectful married gentleman who desires passion and complete confidentiality.',
  },
  {
    username: 'pooja_choudhary_jpr',
    age: 30,
    dob: '1996-06-18',
    marital_status: 'married',
    profile_photo: null, // Blank profile photo
    bio: 'Private profile for obvious reasons. Married woman seeking a secret escape from monotony. Sweet on the outside, naughty behind closed doors.',
    hobbies: ['Dirty Talk', 'Late Night Chats', 'Roleplay', 'Secret Road Trips', 'Spicy Banter'],
    interests: ['Discretion First', 'Erotic Roleplay', 'Late Night Calling', 'Private Suites'],
    personality_traits: ['Mysterious', 'Playful', 'Discreet', 'Warm'],
    sexual_practices: ['Spicy Roleplay', 'Dirty Talk', 'Sensual Massages', 'Fantasies'],
    relationship_type: 'Discreet companionship',
    looking_for: 'An understanding, mature man for mutual excitement and secret moments.',
  },
  {
    username: 'meera_shekhawat_jpr',
    age: 33,
    dob: '1993-03-25',
    marital_status: 'married',
    profile_photo: '/img/images (3).jpeg',
    bio: 'Cultured, elegant, and deeply sensual. Married life has turned into just roommates. Seeking a passionate spark, late night talks, and mutual fantasy exploration.',
    hobbies: ['Fantasy Roleplay', 'Sensual Dance', 'Late Night Whispers', 'Dirty Talk', 'Fine Dining'],
    interests: ['Romantic Escapes', 'Classical Aesthetics', 'Sensual Intimacy', 'Roleplay'],
    personality_traits: ['Graceful', 'Sensual', 'Intelligent', 'Passionate'],
    sexual_practices: ['Sensual Roleplay', 'Erotic Teasing', 'Dirty Whispering', 'Slow Intimacy'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A discerning partner who appreciates grace, discretion, and fiery chemistry.',
  },
  {
    username: 'tanya_mathur_jpr',
    age: 29,
    dob: '1997-09-14',
    marital_status: 'married',
    profile_photo: '/img/image(12).jpg',
    bio: 'Bored of the same daily routine. Looking for secret butterflies, naughty late night talks, and unforgettable private encounters with someone mature.',
    hobbies: ['Spicy Roleplay', 'Dirty Talk', 'Late Night Conversations', 'Hotel Stays'],
    interests: ['Discreet Dates', 'Flirting', 'Secret Chemistry', 'Romantic Getaways'],
    personality_traits: ['Bubbly', 'Naughty', 'Discreet', 'Adventurous'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Spicy Sexting', 'Teasing'],
    relationship_type: 'Secret encounters',
    looking_for: 'Someone who knows how to pamper a woman and keep our secret safe.',
  },
  {
    username: 'isha_bhandari_jpr',
    age: 34,
    dob: '1992-12-02',
    marital_status: 'married',
    profile_photo: '/img/image(13).jpg',
    bio: 'Healthcare professional seeking an exclusive discreet connection. Life is too short to live without passion. Love late night talks, sensual massages, and private dates.',
    hobbies: ['Sensual Massage', 'Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Pilates'],
    interests: ['Discreet Romance', 'Physical Chemistry', 'Exclusive FWB', 'Luxury Hotels'],
    personality_traits: ['Caring', 'Passionate', 'Private', 'Sophisticated'],
    sexual_practices: ['Sensual Bodywork', 'Roleplay', 'Dirty Talk', 'Intimate Teasing'],
    relationship_type: 'Discreet companionship',
    looking_for: 'A respectful, mature partner for stress-free intimacy and mutual satisfaction.',
  },
  {
    username: 'sneha_joshi_jpr',
    age: 28,
    dob: '1998-07-30',
    marital_status: 'single', // Single preferring married
    profile_photo: null, // Blank profile photo
    bio: 'Single girl who finds married men much more mature, respectful, and drama-free. Looking for deep late night calls, roleplay fantasies, and discreet fun.',
    hobbies: ['Late Night Calls', 'Roleplay', 'Dirty Talk', 'Exploring Fantasies', 'Indie Music'],
    interests: ['Discreet Meetups', 'Spicy Banter', 'Sensual Touch', 'No Strings Attached'],
    personality_traits: ['Empathetic', 'Open-Minded', 'Teasing', 'Free-Spirited'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Fantasy Exploration', 'Tease & Please'],
    relationship_type: 'Friends with benefits',
    looking_for: 'A well-settled married man for regular, discreet secret encounters.',
  },
  {
    username: 'aditi_pareek_jpr',
    age: 32,
    dob: '1994-05-12',
    marital_status: 'married',
    profile_photo: '/img/images (4).jpeg',
    bio: 'Finance executive with a quiet, proper life outside, but seeking fire behind closed doors. Craving dirty late-night talks and exciting hotel meetups.',
    hobbies: ['Dirty Talk', 'Roleplay', 'Late Night Talks', 'Private Cocktails', 'Sensual Massage'],
    interests: ['Discreet Affairs', 'Hotel Lounges', 'Roleplay Scenarios', 'Romantic Escapes'],
    personality_traits: ['Ambitious', 'Secretive', 'Intense', 'Passionate'],
    sexual_practices: ['Power Dynamic Roleplay', 'Dirty Talk', 'Sensual Teasing'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A sharp, charming partner who values discretion and intense mutual chemistry.',
  },

  // --- BASSI (10 profiles) ---
  {
    username: 'simran_meena_bassi',
    age: 29,
    dob: '1997-06-11',
    marital_status: 'married',
    profile_photo: '/img/image(14).jpg',
    bio: 'Married woman longing for romantic attention and secret thrills. Let’s share sweet late night whispers, spicy roleplay, and private stolen moments.',
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Secret Drives'],
    interests: ['Discreet Flirting', 'Sensual Moments', 'Secret Dating', 'Roleplay'],
    personality_traits: ['Sweet', 'Passionate', 'Discreet', 'Loving'],
    sexual_practices: ['Gentle & Wild Roleplay', 'Dirty Talk', 'Sensual Caressing'],
    relationship_type: 'Extramarital romance',
    looking_for: 'Someone kind, respectful, and adventurous who craves mutual intimacy.',
  },
  {
    username: 'neha_choudhary_bassi',
    age: 31,
    dob: '1995-10-18',
    marital_status: 'married',
    profile_photo: null, // Blank profile photo
    bio: 'Discreet profile. Married and looking for excitement with a mature partner. In love with kinky hobbies, roleplay, and uninhibited late night talks.',
    hobbies: ['Dirty Talk', 'Roleplay', 'Late Night Talk', 'Kinky Fantasies', 'Sensual Massage'],
    interests: ['Secret Rendezvous', 'Discreet Romance', 'BDSM / Teasing', 'Roleplay'],
    personality_traits: ['Adventurous', 'Mysterious', 'Private', 'Unapologetic'],
    sexual_practices: ['Kinky Roleplay', 'Dirty Talk', 'Teasing', 'Sensual Exploration'],
    relationship_type: 'Secret encounters',
    looking_for: 'A discreet partner ready for passionate adventures without complications.',
  },
  {
    username: 'pallavi_verma_bassi',
    age: 30,
    dob: '1996-03-22',
    marital_status: 'married',
    profile_photo: '/img/images (5).jpeg',
    bio: 'Unhappily married and seeking what’s missing at home: passion, flirtation, and intimacy. Looking for private hotel dates and deep midnight conversations.',
    hobbies: ['Late Night Talks', 'Roleplay', 'Dirty Talk', 'Candlelight Dinners', 'Sensual Touch'],
    interests: ['Discreet Dates', 'Secret Romance', 'Sensual Massage', 'Romantic Intimacy'],
    personality_traits: ['Emotional', 'Sensual', 'Careful', 'Affectionate'],
    sexual_practices: ['Slow Sensual Roleplay', 'Dirty Whispering', 'Intense Intimacy'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A married man who understands the need for emotional and physical escape.',
  },
  {
    username: 'ruchi_saini_bassi',
    age: 33,
    dob: '1993-01-14',
    marital_status: 'married',
    profile_photo: '/img/images (6).jpeg',
    bio: 'Attractive married woman looking for private indulgence. Sucker for roleplay, naughty conversations, and men who know how to take charge.',
    hobbies: ['Dominance Roleplay', 'Dirty Talk', 'Late Night Talks', 'Sensual Massage'],
    interests: ['Kinky Dating', 'Luxury Stays', 'Secret Meetups', 'Discreet Pleasure'],
    personality_traits: ['Confident', 'Seductive', 'Playful', 'Cautious'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Light Bondage / Teasing', 'Sensual Massage'],
    relationship_type: 'Secret encounters',
    looking_for: 'A confident gentleman for hot, secret encounters and mutual chemistry.',
  },
  {
    username: 'komal_yadav_bassi',
    age: 28,
    dob: '1998-09-05',
    marital_status: 'single', // Single girl preferring married
    profile_photo: '/img/image(16).jpg',
    bio: 'Single, playful, and no drama. I prefer married men because they value privacy and know how to treat a woman. Love roleplay and spicy late night chats.',
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Talk', 'Flirting', 'Baking Treats'],
    interests: ['Casual Fun', 'Roleplay Games', 'Midnight Calls', 'Spoiling Each Other'],
    personality_traits: ['Bubbly', 'Flirty', 'Drama-Free', 'Open-Minded'],
    sexual_practices: ['Playful Roleplay', 'Dirty Talk', 'Tease & Reward'],
    relationship_type: 'Friends with benefits',
    looking_for: 'A generous, well-mannered married man to spoil me in return for private thrills.',
  },
  {
    username: 'nidhi_rathore_bassi',
    age: 35,
    dob: '1991-04-20',
    marital_status: 'married',
    profile_photo: '/img/images (7).jpeg',
    bio: 'Mature married woman seeking a discreet lover. Looking for genuine chemistry, secret getaways, and thrilling late night phone talks away from routine.',
    hobbies: ['Late Night Talks', 'Sensual Massage', 'Roleplay', 'Dirty Talk', 'Wine Tasting'],
    interests: ['Discreet Escapes', 'Secret Luxury Dates', 'Sensual Intimacy', 'Roleplay'],
    personality_traits: ['Mature', 'Elegant', 'Passionate', 'Discreet'],
    sexual_practices: ['Sensual Roleplay', 'Dirty Talk', 'Erotic Massage', 'Slow Teasing'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A mature gentleman looking for passionate, long-term discreet encounters.',
  },
  {
    username: 'sakshi_gupta_bassi',
    age: 30,
    dob: '1996-12-10',
    marital_status: 'married',
    profile_photo: null, // Blank profile photo
    bio: 'Blank photo for confidentiality. Married and craving physical desire, secret dates, and roleplay fun. Message me if you know how to keep secrets.',
    hobbies: ['Roleplay', 'Dirty Talk', 'Late Night Talks', 'Exploring Desires', 'Long Drives'],
    interests: ['Complete Discretion', 'Kinky Roleplay', 'Secret Affairs', 'Midnight Fun'],
    personality_traits: ['Secretive', 'Sensual', 'Careful', 'Spontaneous'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Sensual Teasing', 'Uninhibited Intimacy'],
    relationship_type: 'Secret encounters',
    looking_for: 'A discreet partner for exciting, no-strings secret meetups.',
  },
  {
    username: 'payal_sharma_bassi',
    age: 32,
    dob: '1994-08-16',
    marital_status: 'married',
    profile_photo: '/img/images (8).jpeg',
    bio: 'Married life lacks excitement. I’m here for chemistry, flirtation, and dirty late night talks. Seeking someone who makes my heart race again.',
    hobbies: ['Late Night Talks', 'Dirty Talk', 'Roleplay', 'Secret Dinners', 'Sensual Massage'],
    interests: ['Affair Dating', 'Mutual Excitement', 'Sensual Touch', 'Roleplay'],
    personality_traits: ['Warm', 'Passionate', 'Romantic', 'Discreet'],
    sexual_practices: ['Dirty Talk', 'Sensual Roleplay', 'Slow Intimacy', 'Teasing'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A passionate partner who wants a secret girlfriend experience.',
  },
  {
    username: 'harshita_pareek_bassi',
    age: 29,
    dob: '1997-11-28',
    marital_status: 'single', // Single
    profile_photo: '/img/image(18).webp',
    bio: 'Single girl who loves dating older, married men. No expectations, no jealousy, just pure fun, spicy roleplay, and deep late night banter.',
    hobbies: ['Roleplay', 'Dirty Talk', 'Late Night Talks', 'Spicy Banter', 'Fitness'],
    interests: ['NSA Fun', 'Roleplay Scenarios', 'Midnight Calls', 'Secret Dinners'],
    personality_traits: ['Confident', 'Direct', 'Teasing', 'Discreet'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Sensual Massages', 'Fantasies'],
    relationship_type: 'Friends with benefits',
    looking_for: 'A mature married man for regular, private dates and fun times.',
  },
  {
    username: 'mansi_mehta_bassi',
    age: 34,
    dob: '1992-05-19',
    marital_status: 'married',
    profile_photo: '/img/images (9).jpeg',
    bio: 'Married professional. Looking for an exclusive, ongoing discreet relationship with mutual chemistry. Love hotel escapes, roleplay, and sensual massages.',
    hobbies: ['Sensual Massage', 'Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Spa Dates'],
    interests: ['Discreet Luxury Meetups', 'Sensual Intimacy', 'Secret Romance'],
    personality_traits: ['Sophisticated', 'Private', 'Deeply Sensual', 'Grounded'],
    sexual_practices: ['Sensual Body Massage', 'Roleplay', 'Dirty Talk', 'Passionate Touch'],
    relationship_type: 'Discreet companionship',
    looking_for: 'A classy gentleman who understands the rules of discreet extramarital dating.',
  },

  // --- DELHI (10 profiles) ---
  {
    username: 'shreya_malhotra_delhi',
    age: 30,
    dob: '1996-04-15',
    marital_status: 'married',
    profile_photo: '/img/delhi/images.jpeg',
    bio: 'South Delhi wife living a comfortable but passionless life. Seeking a discreet gentleman for secret 5-star hotel dates, roleplay, and uninhibited romance.',
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Talk', 'Luxury Stays', 'Sensual Massage'],
    interests: ['Discreet Extramarital Dating', '5-Star Rendezvous', 'Sensual Pleasures'],
    personality_traits: ['Sophisticated', 'Passionate', 'Discreet', 'Adventurous'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Erotic Massage', 'Teasing'],
    relationship_type: 'Extramarital romance',
    looking_for: 'An elite, discreet partner for mutual indulgence without complications.',
  },
  {
    username: 'ritika_verma_delhi',
    age: 32,
    dob: '1994-08-20',
    marital_status: 'married',
    profile_photo: '/img/delhi/zSHj1477900-0416588684335828919-Female_VvjwZnsZzQdjnXaj_450X600.webp',
    bio: 'Fashion industry insider in a sexless marriage. Craving wild roleplay, dirty talk, and electric chemistry with someone discreet.',
    hobbies: ['Kinky Roleplay', 'Dirty Talk', 'Late Night Talks', 'Costume Play', 'Cocktails'],
    interests: ['BDSM / Teasing', 'Roleplay', 'Discreet Affairs', 'Sensual Massages'],
    personality_traits: ['Daring', 'Sensual', 'Private', 'Expressive'],
    sexual_practices: ['Costume Roleplay', 'Dirty Talk', 'Tease & Denial', 'Kinky Fun'],
    relationship_type: 'Secret encounters',
    looking_for: 'A dominant, discreet man who knows how to take charge behind closed doors.',
  },
  {
    username: 'palak_agarwal_delhi',
    age: 31,
    dob: '1995-02-14',
    marital_status: 'married',
    profile_photo: '/img/delhi/images (1).jpeg',
    bio: 'Married and craving the butterflies again. Looking for secret lunches, late night dirty talks, and private getaways with a respectful married gentleman.',
    hobbies: ['Late Night Talks', 'Dirty Talk', 'Roleplay', 'Secret Dinners', 'Sensual Touch'],
    interests: ['Discreet Dates', 'Secret Romance', 'Sensual Intimacy', 'Roleplay'],
    personality_traits: ['Charming', 'Sensual', 'Discreet', 'Warm'],
    sexual_practices: ['Dirty Talk', 'Roleplay', 'Sensual Massages', 'Teasing'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A charming partner who knows how to treat a woman and maintain privacy.',
  },
  {
    username: 'simran_kapoor_delhi',
    age: 35,
    dob: '1991-11-04',
    marital_status: 'married',
    profile_photo: '/img/delhi/images (2).jpeg',
    bio: 'Glamorous, discreet, and unapologetically craving passion. Love romantic hotel weekends, dirty late night chats, and spicy roleplay fantasies.',
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Hotel Suites', 'Sensual Massage'],
    interests: ['Luxury Escapes', 'Secret Chemistry', 'Kinky Roleplay', 'Sensual Pleasures'],
    personality_traits: ['Glamorous', 'Sensual', 'Confident', 'Discreet'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Slow Sensual Touch', 'Teasing'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A successful, mature man for mutual excitement and secret rendezvous.',
  },
  {
    username: 'sakshi_yadav_delhi',
    age: 28,
    dob: '1998-06-18',
    marital_status: 'single', // Single
    profile_photo: null, // Blank profile photo
    bio: 'Single girl who finds married men much more appealing—no strings, no expectations, just pure thrilling fun, roleplay, and dirty late night banter.',
    hobbies: ['Roleplay', 'Dirty Talk', 'Late Night Talks', 'Spicy Banter', 'Midnight Drives'],
    interests: ['NSA Fun', 'Roleplay Scenarios', 'Midnight Calls', 'Secret Hotel Dates'],
    personality_traits: ['Spontaneous', 'Playful', 'Discreet', 'Teasing'],
    sexual_practices: ['Roleplay', 'Dirty Talk', 'Sensual Massages', 'Fantasies'],
    relationship_type: 'Friends with benefits',
    looking_for: 'A mature married man for regular, private fun and late night talks.',
  },
  {
    username: 'tanisha_rajput_delhi',
    age: 36,
    dob: '1990-03-25',
    marital_status: 'married',
    profile_photo: '/img/delhi/images (3).jpeg',
    bio: 'Married woman of high standards. Missing deep passion and physical touch. Looking for an accomplished lover for secret dinners, roleplay, and sensual escapades.',
    hobbies: ['Fantasy Roleplay', 'Late Night Talks', 'Dirty Whispers', 'Wine & Dine', 'Sensual Touch'],
    interests: ['Discreet Extramarital Romance', 'Hotel Lounges', 'Sensual Pleasures'],
    personality_traits: ['Sophisticated', 'Passionate', 'Discreet', 'Sensual'],
    sexual_practices: ['Sensual Roleplay', 'Dirty Talk', 'Teasing', 'Erotic Massages'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A distinguished gentleman who appreciates discreet, passionate intimacy.',
  },
  {
    username: 'muskan_sharma_delhi',
    age: 29,
    dob: '1997-09-14',
    marital_status: 'single', // Single
    profile_photo: '/img/delhi/images (4).jpeg',
    bio: 'Single, modern, and open-minded. Prefer dating married men because they are mature, discreet, and keep things simple. Love dirty talk and adventurous roleplay.',
    hobbies: ['Roleplay', 'Late Night Talks', 'Dirty Talk', 'Secret Escapes', 'Cocktails'],
    interests: ['No Drama Romance', 'Roleplay & Fantasies', 'Midnight Calls', 'Discreet Dates'],
    personality_traits: ['Modern', 'Flirty', 'Drama-Free', 'Adventurous'],
    sexual_practices: ['Playful Roleplay', 'Dirty Talk', 'Tease & Please', 'Sensual Fun'],
    relationship_type: 'Friends with benefits',
    looking_for: 'A generous married gentleman for thrilling secret moments.',
  },
  {
    username: 'pooja_bhatia_delhi',
    age: 33,
    dob: '1993-12-02',
    marital_status: 'married',
    profile_photo: null, // Blank profile photo
    bio: 'Discreet profile. Married and seeking an exclusive connection. Looking for someone mature to share secret excitement, late night talks, and mutual desires.',
    hobbies: ['Dirty Talk', 'Late Night Talks', 'Roleplay', 'Sensual Massage', 'Hotel Lounges'],
    interests: ['Complete Discretion', 'Sensual Pleasures', 'Secret Rendezvous'],
    personality_traits: ['Mysterious', 'Sensual', 'Private', 'Warm'],
    sexual_practices: ['Dirty Talk', 'Sensual Roleplay', 'Slow Intimacy', 'Teasing'],
    relationship_type: 'Discreet companionship',
    looking_for: 'A discreet partner ready for passionate adventures without complications.',
  },
  {
    username: 'aishwarya_singh_delhi',
    age: 30,
    dob: '1996-07-30',
    marital_status: 'married',
    profile_photo: '/img/delhi/images (5).jpeg',
    bio: 'In a loveless marriage seeking genuine passion. Sucker for intellectual banter, dirty late night whispers, and secret hotel encounters.',
    hobbies: ['Late Night Talks', 'Roleplay', 'Dirty Whispers', 'Sensual Massage', 'Wine Tasting'],
    interests: ['Affair Dating', 'Romantic Escapes', 'Sensual Touch', 'Roleplay Scenarios'],
    personality_traits: ['Articulate', 'Sensual', 'Passionate', 'Private'],
    sexual_practices: ['Sensual Roleplay', 'Dirty Talk', 'Teasing', 'Deep Intimacy'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A gentleman who values discretion as much as I do. Chemistry is everything.',
  },
  {
    username: 'divya_mehta_delhi',
    age: 34,
    dob: '1992-05-12',
    marital_status: 'married',
    profile_photo: '/img/delhi/images (6).jpeg',
    bio: 'Married corporate professional with a thirst for excitement. Craving dirty late-night talks, spicy roleplay, and private weekend meetups.',
    hobbies: ['Roleplay', 'Dirty Talk', 'Late Night Talks', 'Hotel Lounges', 'Sensual Massage'],
    interests: ['Discreet Affairs', 'Hotel Rendezvous', 'Sensual Intimacy', 'Roleplay'],
    personality_traits: ['Ambitious', 'Secretive', 'Intense', 'Passionate'],
    sexual_practices: ['Power Dynamic Roleplay', 'Dirty Talk', 'Sensual Teasing'],
    relationship_type: 'Extramarital romance',
    looking_for: 'A discreet, mature man for mutual excitement and private indulgence.',
  },
];

async function updateProfilesForExtramaritalDating() {
  console.log(`\n===============================================================`);
  console.log(`🔥 Updating Profiles for Extramarital Dating Platform`);
  console.log(`===============================================================\n`);

  let updatedCount = 0;
  const results = [];

  for (const prof of PROFILE_UPDATES) {
    const res = await pool.query(
      `UPDATE users SET
        age = $1,
        date_of_birth = $2,
        marital_status = $3,
        profile_photo = $4,
        bio = $5,
        hobbies = $6,
        interests = $7,
        personality_traits = $8,
        sexual_practices = $9,
        relationship_type = $10,
        looking_for = $11,
        updated_at = NOW()
      WHERE username = $12
      RETURNING id, username, age, marital_status, city, profile_photo`,
      [
        prof.age,
        prof.dob,
        prof.marital_status,
        prof.profile_photo,
        prof.bio,
        JSON.stringify(prof.hobbies),
        JSON.stringify(prof.interests),
        JSON.stringify(prof.personality_traits),
        JSON.stringify(prof.sexual_practices),
        prof.relationship_type,
        prof.looking_for,
        prof.username,
      ]
    );

    if (res.rows.length > 0) {
      updatedCount++;
      const row = res.rows[0];
      results.push({
        id: row.id,
        username: row.username,
        age: row.age,
        marital_status: row.marital_status,
        city: row.city,
        profile_photo: row.profile_photo ? row.profile_photo.substring(0, 24) : '(BLANK/NULL)',
      });
      console.log(`[UPDATED] ID ${row.id}: @${row.username} -> Age: ${row.age}, Status: ${row.marital_status}, Photo: ${row.profile_photo || 'BLANK'}`);
    } else {
      console.log(`[SKIPPED] Username @${prof.username} not found in DB`);
    }
  }

  console.log(`\n===============================================================`);
  console.log(`✅ Successfully updated ${updatedCount} profiles!`);
  console.log(`===============================================================\n`);
  console.table(results);

  // Print summary of marital status
  const statusSummary = await pool.query(`
    SELECT marital_status, COUNT(*)::int AS count, MIN(age) AS min_age, MAX(age) AS max_age
    FROM users
    WHERE id > 1
    GROUP BY marital_status
  `);
  console.log('\nMarital Status Breakdown:');
  console.table(statusSummary.rows);

  // Print photo breakdown
  const photoSummary = await pool.query(`
    SELECT 
      CASE WHEN profile_photo IS NULL THEN 'BLANK (Null)' ELSE 'HAS IMAGE' END as photo_status,
      COUNT(*)::int AS count
    FROM users
    WHERE id > 1
    GROUP BY 1
  `);
  console.log('\nProfile Photo Breakdown:');
  console.table(photoSummary.rows);
}

updateProfilesForExtramaritalDating()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Error updating profiles:', err);
    await pool.end();
    process.exit(1);
  });
