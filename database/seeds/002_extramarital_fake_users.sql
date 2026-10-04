-- ============================================================================
-- SWAY Extramarital Dating Platform - VPS Seed Data
-- 30 Complete Profiles (Jaipur, Bassi, Delhi)
-- ============================================================================

BEGIN;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'ananya_jpr', 'fakeid_ananya@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Ananya', 'female', 'female', 'female', 'female', 'MATCHED',
  '1997-04-15', 29, 'Jaipur', 'Rajasthan', 'India', 26.9124, 75.7873, 'married', 'Extramarital romance', 'A discreet, mature partner who knows how to keep a secret and ignite a spark.',
  'Married on paper, but missing genuine passion. Looking for an accomplished man for secret coffees, late night talks, and thrilling chemistry. Absolute discretion is a must.', '/img/image(10).jpg', 'Architect', 'B.Arch - MNIT Jaipur', 165, TRUE, '["Roleplay","Late Night Talks","Secret Dates","Wine & Intimacy","Dirty Talk"]', '["Discreet Romance","Sensual Massage","Hotel Lounges","Roleplay","Deep Whispers"]', '["Seductive","Discreet","Adventurous","Playful"]', '["Roleplay","Dirty Talk","Sensual Teasing","Fantasies"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_ananya@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'diya_sharma_jpr', 'fakeid_diya@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Diya', 'female', 'female', 'female', 'female', 'MATCHED',
  '1995-08-20', 31, 'Jaipur', 'Rajasthan', 'India', 26.8528, 75.8236, 'married', 'Secret encounters', 'A discreet lover who appreciates beauty, excitement, and uninhibited passion.',
  'Housewife with an adventurous wild side. Craving private excitement away from routine life. Love dressing up, spicy chats, and discreet rendezvous in luxury hotels.', '/img/images (1).jpeg', 'Fashion Designer', 'NIFT Graduate', 163, FALSE, '["Costume Roleplay","Late Night Talk","Dirty Talk & Teasing","Sensual Massage"]', '["Kinky Fantasies","Discreet Meetups","Roleplay","Fine Wine","Late Night Whispers"]', '["Passionate","Flirtatious","Open-Minded","Private"]', '["Costume Roleplay","Dirty Talk","BDSM / Teasing","Erotic Massages"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_diya@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'kavya_singh_jpr', 'fakeid_kavya@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Kavya', 'female', 'female', 'female', 'female', 'MATCHED',
  '1998-02-10', 28, 'Jaipur', 'Rajasthan', 'India', 26.8915, 75.7423, 'single', 'Friends with benefits', 'A generous married gentleman who wants excitement without disrupting home life.',
  'Single, independent, and prefer mature married men with no emotional drama. Kept private for professional reasons. Let’s share secret thrills and midnight confessions.', NULL, 'Product Designer', 'B.Des', 167, TRUE, '["Late Night Talks","Roleplay","Dirty Talk","Secret Escapes","Cocktails"]', '["No Drama Romance","Roleplay & Fantasies","Midnight Calls","Luxury Spas"]', '["Independent","Discreet","Confident","Teasing"]', '["Roleplay","Dirty Talk","Tease & Denial","Sensual Touch"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_kavya@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'riya_rathore_jpr', 'fakeid_riya@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Riya', 'female', 'female', 'female', 'female', 'MATCHED',
  '1994-11-05', 32, 'Jaipur', 'Rajasthan', 'India', 26.892, 75.8267, 'married', 'Extramarital romance', 'A respectful married gentleman who desires passion and complete confidentiality.',
  'Corporate lead by day, secret romantic by night. In an empty marriage craving physical and emotional intimacy. Love candlelight, roleplay, and deep late-night desire.', '/img/images (2).jpeg', 'Marketing Lead', 'MBA - Marketing', 164, FALSE, '["Roleplay","Late Night Talks","Dirty Whispers","Hotel Rendezvous","Sensual Massage"]', '["Discreet Escapes","Secret Dinners","Kinky Roleplay","Romantic Intimacy"]', '["Sophisticated","Sultry","Empathetic","Daring"]', '["Dominance & Submission Lite","Dirty Talk","Roleplay","Slow Sensual Touch"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_riya@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'pooja_choudhary_jpr', 'fakeid_pooja@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Pooja', 'female', 'female', 'female', 'female', 'MATCHED',
  '1996-06-18', 30, 'Jaipur', 'Rajasthan', 'India', 26.8534, 75.7725, 'married', 'Discreet companionship', 'An understanding, mature man for mutual excitement and secret moments.',
  'Private profile for obvious reasons. Married woman seeking a secret escape from monotony. Sweet on the outside, naughty behind closed doors.', NULL, 'Software Engineer', 'B.Tech Computer Science', 162, TRUE, '["Dirty Talk","Late Night Chats","Roleplay","Secret Road Trips","Spicy Banter"]', '["Discretion First","Erotic Roleplay","Late Night Calling","Private Suites"]', '["Mysterious","Playful","Discreet","Warm"]', '["Spicy Roleplay","Dirty Talk","Sensual Massages","Fantasies"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_pooja@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'meera_shekhawat_jpr', 'fakeid_meera@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Meera', 'female', 'female', 'female', 'female', 'MATCHED',
  '1993-03-25', 33, 'Jaipur', 'Rajasthan', 'India', 26.9298, 75.7951, 'married', 'Extramarital romance', 'A discerning partner who appreciates grace, discretion, and fiery chemistry.',
  'Cultured, elegant, and deeply sensual. Married life has turned into just roommates. Seeking a passionate spark, late night talks, and mutual fantasy exploration.', '/img/images (3).jpeg', 'Heritage Consultant', 'M.A. History & Museology', 168, TRUE, '["Fantasy Roleplay","Sensual Dance","Late Night Whispers","Dirty Talk","Fine Dining"]', '["Romantic Escapes","Classical Aesthetics","Sensual Intimacy","Roleplay"]', '["Graceful","Sensual","Intelligent","Passionate"]', '["Sensual Roleplay","Erotic Teasing","Dirty Whispering","Slow Intimacy"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_meera@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'tanya_mathur_jpr', 'fakeid_tanya@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Tanya', 'female', 'female', 'female', 'female', 'MATCHED',
  '1997-09-14', 29, 'Jaipur', 'Rajasthan', 'India', 26.9012, 75.8015, 'married', 'Secret encounters', 'Someone who knows how to pamper a woman and keep our secret safe.',
  'Bored of the same daily routine. Looking for secret butterflies, naughty late night talks, and unforgettable private encounters with someone mature.', '/img/image(12).jpg', 'Digital Creator', 'B.A. Journalism & Mass Comm', 166, FALSE, '["Spicy Roleplay","Dirty Talk","Late Night Conversations","Hotel Stays"]', '["Discreet Dates","Flirting","Secret Chemistry","Romantic Getaways"]', '["Bubbly","Naughty","Discreet","Adventurous"]', '["Roleplay","Dirty Talk","Spicy Sexting","Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_tanya@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'isha_bhandari_jpr', 'fakeid_isha@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Isha', 'female', 'female', 'female', 'female', 'MATCHED',
  '1992-12-02', 34, 'Jaipur', 'Rajasthan', 'India', 26.8845, 75.8112, 'married', 'Discreet companionship', 'A respectful, mature partner for stress-free intimacy and mutual satisfaction.',
  'Healthcare professional seeking an exclusive discreet connection. Life is too short to live without passion. Love late night talks, sensual massages, and private dates.', '/img/image(13).jpg', 'Dentist', 'BDS - Dental Surgery', 163, TRUE, '["Sensual Massage","Roleplay","Late Night Talks","Dirty Whispers","Pilates"]', '["Discreet Romance","Physical Chemistry","Exclusive FWB","Luxury Hotels"]', '["Caring","Passionate","Private","Sophisticated"]', '["Sensual Bodywork","Roleplay","Dirty Talk","Intimate Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_isha@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'sneha_joshi_jpr', 'fakeid_sneha@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Sneha', 'female', 'female', 'female', 'female', 'MATCHED',
  '1998-07-30', 28, 'Jaipur', 'Rajasthan', 'India', 26.9205, 75.7758, 'single', 'Friends with benefits', 'A well-settled married man for regular, discreet secret encounters.',
  'Single girl who finds married men much more mature, respectful, and drama-free. Looking for deep late night calls, roleplay fantasies, and discreet fun.', NULL, 'Clinical Psychologist', 'M.Sc Psychology', 165, FALSE, '["Late Night Calls","Roleplay","Dirty Talk","Exploring Fantasies","Indie Music"]', '["Discreet Meetups","Spicy Banter","Sensual Touch","No Strings Attached"]', '["Empathetic","Open-Minded","Teasing","Free-Spirited"]', '["Roleplay","Dirty Talk","Fantasy Exploration","Tease & Please"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_sneha@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'aditi_pareek_jpr', 'fakeid_aditi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Aditi', 'female', 'female', 'female', 'female', 'MATCHED',
  '1994-05-12', 32, 'Jaipur', 'Rajasthan', 'India', 26.8612, 75.819, 'married', 'Extramarital romance', 'A sharp, charming partner who values discretion and intense mutual chemistry.',
  'Finance executive with a quiet, proper life outside, but seeking fire behind closed doors. Craving dirty late-night talks and exciting hotel meetups.', '/img/images (4).jpeg', 'Financial Consultant', 'Chartered Accountant (CA)', 166, TRUE, '["Dirty Talk","Roleplay","Late Night Talks","Private Cocktails","Sensual Massage"]', '["Discreet Affairs","Hotel Lounges","Roleplay Scenarios","Romantic Escapes"]', '["Ambitious","Secretive","Intense","Passionate"]', '["Power Dynamic Roleplay","Dirty Talk","Sensual Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'fakeid_aditi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'simran_meena_bassi', 'test_simran_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Simran', 'female', 'female', 'female', 'female', 'MATCHED',
  '1997-06-11', 29, 'Bassi', 'Rajasthan', 'India', 26.8322, 76.0425, 'married', 'Extramarital romance', 'Someone kind, respectful, and adventurous who craves mutual intimacy.',
  'Married woman longing for romantic attention and secret thrills. Let’s share sweet late night whispers, spicy roleplay, and private stolen moments.', '/img/image(14).jpg', 'Interior Designer', 'B.Des Interior Architecture', 164, TRUE, '["Roleplay","Late Night Talks","Dirty Whispers","Secret Drives"]', '["Discreet Flirting","Sensual Moments","Secret Dating","Roleplay"]', '["Sweet","Passionate","Discreet","Loving"]', '["Gentle & Wild Roleplay","Dirty Talk","Sensual Caressing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_simran_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'neha_choudhary_bassi', 'test_neha_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Neha', 'female', 'female', 'female', 'female', 'MATCHED',
  '1995-10-18', 31, 'Bassi', 'Rajasthan', 'India', 26.8401, 76.035, 'married', 'Secret encounters', 'A discreet partner ready for passionate adventures without complications.',
  'Discreet profile. Married and looking for excitement with a mature partner. In love with kinky hobbies, roleplay, and uninhibited late night talks.', NULL, 'HR Manager', 'MBA - Human Resources', 165, FALSE, '["Dirty Talk","Roleplay","Late Night Talk","Kinky Fantasies","Sensual Massage"]', '["Secret Rendezvous","Discreet Romance","BDSM / Teasing","Roleplay"]', '["Adventurous","Mysterious","Private","Unapologetic"]', '["Kinky Roleplay","Dirty Talk","Teasing","Sensual Exploration"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_neha_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'pallavi_verma_bassi', 'test_pallavi_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Pallavi', 'female', 'female', 'female', 'female', 'MATCHED',
  '1996-03-22', 30, 'Bassi', 'Rajasthan', 'India', 26.8285, 76.0512, 'married', 'Extramarital romance', 'A married man who understands the need for emotional and physical escape.',
  'Unhappily married and seeking what’s missing at home: passion, flirtation, and intimacy. Looking for private hotel dates and deep midnight conversations.', '/img/images (5).jpeg', 'Software QA Engineer', 'B.Tech IT', 163, TRUE, '["Late Night Talks","Roleplay","Dirty Talk","Candlelight Dinners","Sensual Touch"]', '["Discreet Dates","Secret Romance","Sensual Massage","Romantic Intimacy"]', '["Emotional","Sensual","Careful","Affectionate"]', '["Slow Sensual Roleplay","Dirty Whispering","Intense Intimacy"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_pallavi_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'ruchi_saini_bassi', 'test_ruchi_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Ruchi', 'female', 'female', 'female', 'female', 'MATCHED',
  '1993-01-14', 33, 'Bassi', 'Rajasthan', 'India', 26.835, 76.048, 'married', 'Secret encounters', 'A confident gentleman for hot, secret encounters and mutual chemistry.',
  'Attractive married woman looking for private indulgence. Sucker for roleplay, naughty conversations, and men who know how to take charge.', '/img/images (6).jpeg', 'Nutritionist & Wellness Coach', 'M.Sc Nutrition & Dietetics', 166, FALSE, '["Dominance Roleplay","Dirty Talk","Late Night Talks","Sensual Massage"]', '["Kinky Dating","Luxury Stays","Secret Meetups","Discreet Pleasure"]', '["Confident","Seductive","Playful","Cautious"]', '["Roleplay","Dirty Talk","Light Bondage / Teasing","Sensual Massage"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_ruchi_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'komal_yadav_bassi', 'test_komal_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Komal', 'female', 'female', 'female', 'female', 'MATCHED',
  '1998-09-05', 28, 'Bassi', 'Rajasthan', 'India', 26.831, 76.039, 'single', 'Friends with benefits', 'A generous, well-mannered married man to spoil me in return for private thrills.',
  'Single, playful, and no drama. I prefer married men because they value privacy and know how to treat a woman. Love roleplay and spicy late night chats.', '/img/image(16).jpg', 'Elementary Educator', 'B.Ed & M.A. English', 161, TRUE, '["Roleplay","Late Night Talks","Dirty Talk","Flirting","Baking Treats"]', '["Casual Fun","Roleplay Games","Midnight Calls","Spoiling Each Other"]', '["Bubbly","Flirty","Drama-Free","Open-Minded"]', '["Playful Roleplay","Dirty Talk","Tease & Reward"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_komal_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'nidhi_rathore_bassi', 'test_nidhi_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Nidhi', 'female', 'female', 'female', 'female', 'MATCHED',
  '1991-04-20', 35, 'Bassi', 'Rajasthan', 'India', 26.8385, 76.045, 'married', 'Extramarital romance', 'A mature gentleman looking for passionate, long-term discreet encounters.',
  'Mature married woman seeking a discreet lover. Looking for genuine chemistry, secret getaways, and thrilling late night phone talks away from routine.', '/img/images (7).jpeg', 'High School Lecturer', 'M.Sc Physics', 167, TRUE, '["Late Night Talks","Sensual Massage","Roleplay","Dirty Talk","Wine Tasting"]', '["Discreet Escapes","Secret Luxury Dates","Sensual Intimacy","Roleplay"]', '["Mature","Elegant","Passionate","Discreet"]', '["Sensual Roleplay","Dirty Talk","Erotic Massage","Slow Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_nidhi_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'sakshi_gupta_bassi', 'test_sakshi_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Sakshi', 'female', 'female', 'female', 'female', 'MATCHED',
  '1996-12-10', 30, 'Bassi', 'Rajasthan', 'India', 26.829, 76.038, 'married', 'Secret encounters', 'A discreet partner for exciting, no-strings secret meetups.',
  'Blank photo for confidentiality. Married and craving physical desire, secret dates, and roleplay fun. Message me if you know how to keep secrets.', NULL, 'Graphic Designer', 'B.F.A. Applied Arts', 163, FALSE, '["Roleplay","Dirty Talk","Late Night Talks","Exploring Desires","Long Drives"]', '["Complete Discretion","Kinky Roleplay","Secret Affairs","Midnight Fun"]', '["Secretive","Sensual","Careful","Spontaneous"]', '["Roleplay","Dirty Talk","Sensual Teasing","Uninhibited Intimacy"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_sakshi_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'payal_sharma_bassi', 'test_payal_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Payal', 'female', 'female', 'female', 'female', 'MATCHED',
  '1994-08-16', 32, 'Bassi', 'Rajasthan', 'India', 26.834, 76.041, 'married', 'Extramarital romance', 'A passionate partner who wants a secret girlfriend experience.',
  'Married life lacks excitement. I’m here for chemistry, flirtation, and dirty late night talks. Seeking someone who makes my heart race again.', '/img/images (8).jpeg', 'Pharmacist', 'B.Pharm', 165, FALSE, '["Late Night Talks","Dirty Talk","Roleplay","Secret Dinners","Sensual Massage"]', '["Affair Dating","Mutual Excitement","Sensual Touch","Roleplay"]', '["Warm","Passionate","Romantic","Discreet"]', '["Dirty Talk","Sensual Roleplay","Slow Intimacy","Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_payal_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'harshita_pareek_bassi', 'test_harshita_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Harshita', 'female', 'female', 'female', 'female', 'MATCHED',
  '1997-11-28', 29, 'Bassi', 'Rajasthan', 'India', 26.837, 76.049, 'single', 'Friends with benefits', 'A mature married man for regular, private dates and fun times.',
  'Single girl who loves dating older, married men. No expectations, no jealousy, just pure fun, spicy roleplay, and deep late night banter.', '/img/image(18).webp', 'Digital Marketing Freelancer', 'B.Com & Digital Marketing', 162, TRUE, '["Roleplay","Dirty Talk","Late Night Talks","Spicy Banter","Fitness"]', '["NSA Fun","Roleplay Scenarios","Midnight Calls","Secret Dinners"]', '["Confident","Direct","Teasing","Discreet"]', '["Roleplay","Dirty Talk","Sensual Massages","Fantasies"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_harshita_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'mansi_mehta_bassi', 'test_mansi_bassi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Mansi', 'female', 'female', 'female', 'female', 'MATCHED',
  '1992-05-19', 34, 'Bassi', 'Rajasthan', 'India', 26.8305, 76.046, 'married', 'Discreet companionship', 'A classy gentleman who understands the rules of discreet extramarital dating.',
  'Married professional. Looking for an exclusive, ongoing discreet relationship with mutual chemistry. Love hotel escapes, roleplay, and sensual massages.', '/img/images (9).jpeg', 'Content Lead', 'B.A. Mass Communication', 164, FALSE, '["Sensual Massage","Roleplay","Late Night Talks","Dirty Whispers","Spa Dates"]', '["Discreet Luxury Meetups","Sensual Intimacy","Secret Romance"]', '["Sophisticated","Private","Deeply Sensual","Grounded"]', '["Sensual Body Massage","Roleplay","Dirty Talk","Passionate Touch"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_mansi_bassi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'shreya_malhotra_delhi', 'test_shreya_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Shreya', 'female', 'female', 'female', 'female', 'MATCHED',
  '1996-04-15', 30, 'Delhi', 'Delhi', 'India', 28.6328, 77.2197, 'married', 'Extramarital romance', 'An elite, discreet partner for mutual indulgence without complications.',
  'South Delhi wife living a comfortable but passionless life. Seeking a discreet gentleman for secret 5-star hotel dates, roleplay, and uninhibited romance.', '/img/delhi/images.jpeg', 'Architect', 'B.Arch', 165, TRUE, '["Roleplay","Late Night Talks","Dirty Talk","Luxury Stays","Sensual Massage"]', '["Discreet Extramarital Dating","5-Star Rendezvous","Sensual Pleasures"]', '["Sophisticated","Passionate","Discreet","Adventurous"]', '["Roleplay","Dirty Talk","Erotic Massage","Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_shreya_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'ritika_verma_delhi', 'test_ritika_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Ritika', 'female', 'female', 'female', 'female', 'MATCHED',
  '1994-08-20', 32, 'Delhi', 'Delhi', 'India', 28.5672, 77.21, 'married', 'Secret encounters', 'A dominant, discreet man who knows how to take charge behind closed doors.',
  'Fashion industry insider in a sexless marriage. Craving wild roleplay, dirty talk, and electric chemistry with someone discreet.', '/img/delhi/zSHj1477900-0416588684335828919-Female_VvjwZnsZzQdjnXaj_450X600.webp', 'Fashion Designer', 'NIFT Graduate', 163, FALSE, '["Kinky Roleplay","Dirty Talk","Late Night Talks","Costume Play","Cocktails"]', '["BDSM / Teasing","Roleplay","Discreet Affairs","Sensual Massages"]', '["Daring","Sensual","Private","Expressive"]', '["Costume Roleplay","Dirty Talk","Tease & Denial","Kinky Fun"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_ritika_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'palak_agarwal_delhi', 'test_palak_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Palak', 'female', 'female', 'female', 'female', 'MATCHED',
  '1995-02-14', 31, 'Delhi', 'Delhi', 'India', 28.5244, 77.2066, 'married', 'Extramarital romance', 'A charming partner who knows how to treat a woman and maintain privacy.',
  'Married and craving the butterflies again. Looking for secret lunches, late night dirty talks, and private getaways with a respectful married gentleman.', '/img/delhi/images (1).jpeg', 'Product Manager', 'B.Tech & MBA', 167, TRUE, '["Late Night Talks","Dirty Talk","Roleplay","Secret Dinners","Sensual Touch"]', '["Discreet Dates","Secret Romance","Sensual Intimacy","Roleplay"]', '["Charming","Sensual","Discreet","Warm"]', '["Dirty Talk","Roleplay","Sensual Massages","Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_palak_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'simran_kapoor_delhi', 'test_simran_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Simran', 'female', 'female', 'female', 'female', 'MATCHED',
  '1991-11-04', 35, 'Delhi', 'Delhi', 'India', 28.5355, 77.1578, 'married', 'Extramarital romance', 'A successful, mature man for mutual excitement and secret rendezvous.',
  'Glamorous, discreet, and unapologetically craving passion. Love romantic hotel weekends, dirty late night chats, and spicy roleplay fantasies.', '/img/delhi/images (2).jpeg', 'Marketing Lead', 'MBA - Marketing', 164, FALSE, '["Roleplay","Late Night Talks","Dirty Whispers","Hotel Suites","Sensual Massage"]', '["Luxury Escapes","Secret Chemistry","Kinky Roleplay","Sensual Pleasures"]', '["Glamorous","Sensual","Confident","Discreet"]', '["Roleplay","Dirty Talk","Slow Sensual Touch","Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_simran_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'sakshi_yadav_delhi', 'test_sakshi_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Sakshi', 'female', 'female', 'female', 'female', 'MATCHED',
  '1998-06-18', 28, 'Delhi', 'Delhi', 'India', 28.5355, 77.249, 'single', 'Friends with benefits', 'A mature married man for regular, private fun and late night talks.',
  'Single girl who finds married men much more appealing—no strings, no expectations, just pure thrilling fun, roleplay, and dirty late night banter.', NULL, 'Software Engineer', 'B.Tech Computer Science', 162, TRUE, '["Roleplay","Dirty Talk","Late Night Talks","Spicy Banter","Midnight Drives"]', '["NSA Fun","Roleplay Scenarios","Midnight Calls","Secret Hotel Dates"]', '["Spontaneous","Playful","Discreet","Teasing"]', '["Roleplay","Dirty Talk","Sensual Massages","Fantasies"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_sakshi_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'tanisha_rajput_delhi', 'test_tanisha_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Tanisha', 'female', 'female', 'female', 'female', 'MATCHED',
  '1990-03-25', 36, 'Delhi', 'Delhi', 'India', 28.6448, 77.2167, 'married', 'Extramarital romance', 'A distinguished gentleman who appreciates discreet, passionate intimacy.',
  'Married woman of high standards. Missing deep passion and physical touch. Looking for an accomplished lover for secret dinners, roleplay, and sensual escapades.', '/img/delhi/images (3).jpeg', 'Heritage Consultant', 'M.A. History & Museology', 168, TRUE, '["Fantasy Roleplay","Late Night Talks","Dirty Whispers","Wine & Dine","Sensual Touch"]', '["Discreet Extramarital Romance","Hotel Lounges","Sensual Pleasures"]', '["Sophisticated","Passionate","Discreet","Sensual"]', '["Sensual Roleplay","Dirty Talk","Teasing","Erotic Massages"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_tanisha_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'muskan_sharma_delhi', 'test_muskan_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Muskan', 'female', 'female', 'female', 'female', 'MATCHED',
  '1997-09-14', 29, 'Delhi', 'Delhi', 'India', 28.5677, 77.2433, 'single', 'Friends with benefits', 'A generous married gentleman for thrilling secret moments.',
  'Single, modern, and open-minded. Prefer dating married men because they are mature, discreet, and keep things simple. Love dirty talk and adventurous roleplay.', '/img/delhi/images (4).jpeg', 'Digital Creator', 'B.A. Journalism & Mass Communication', 166, FALSE, '["Roleplay","Late Night Talks","Dirty Talk","Secret Escapes","Cocktails"]', '["No Drama Romance","Roleplay & Fantasies","Midnight Calls","Discreet Dates"]', '["Modern","Flirty","Drama-Free","Adventurous"]', '["Playful Roleplay","Dirty Talk","Tease & Please","Sensual Fun"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_muskan_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'pooja_bhatia_delhi', 'test_pooja_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Pooja', 'female', 'female', 'female', 'female', 'MATCHED',
  '1993-12-02', 33, 'Delhi', 'Delhi', 'India', 28.5562, 77.1, 'married', 'Discreet companionship', 'A discreet partner ready for passionate adventures without complications.',
  'Discreet profile. Married and seeking an exclusive connection. Looking for someone mature to share secret excitement, late night talks, and mutual desires.', NULL, 'Dentist', 'BDS - Dental Surgery', 163, TRUE, '["Dirty Talk","Late Night Talks","Roleplay","Sensual Massage","Hotel Lounges"]', '["Complete Discretion","Sensual Pleasures","Secret Rendezvous"]', '["Mysterious","Sensual","Private","Warm"]', '["Dirty Talk","Sensual Roleplay","Slow Intimacy","Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_pooja_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'aishwarya_singh_delhi', 'test_aishwarya_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Aishwarya', 'female', 'female', 'female', 'female', 'MATCHED',
  '1996-07-30', 30, 'Delhi', 'Delhi', 'India', 28.6517, 77.2219, 'married', 'Extramarital romance', 'A gentleman who values discretion as much as I do. Chemistry is everything.',
  'In a loveless marriage seeking genuine passion. Sucker for intellectual banter, dirty late night whispers, and secret hotel encounters.', '/img/delhi/images (5).jpeg', 'Psychology Researcher', 'M.Sc Psychology', 165, FALSE, '["Late Night Talks","Roleplay","Dirty Whispers","Sensual Massage","Wine Tasting"]', '["Affair Dating","Romantic Escapes","Sensual Touch","Roleplay Scenarios"]', '["Articulate","Sensual","Passionate","Private"]', '["Sensual Roleplay","Dirty Talk","Teasing","Deep Intimacy"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_aishwarya_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO users (
  username, email, password_hash, nickname, gender, selected_gender, verified_gender, ai_detected_gender, gender_match_status,
  date_of_birth, age, city, state, country, latitude, longitude, marital_status, relationship_type, looking_for,
  bio, profile_photo, profession, education, height, is_online, hobbies, interests, personality_traits, sexual_practices,
  languages, languages_spoken, verification_status, verification_type, verified_at, profile_completed, profile_status,
  onboarding_status, profile_moderation_status, account_status, is_active, is_banned, admin_notes, connect_credits,
  location_updated_at, created_at, updated_at
) VALUES (
  'divya_mehta_delhi', 'test_divya_delhi@sway.local', '$2b$10$1ZbMMZ0HBrRoUCpGI3xdU.6298ht2Js0Cy8JHJKmKUtRwmzUOOoRm', 'Divya', 'female', 'female', 'female', 'female', 'MATCHED',
  '1992-05-12', 34, 'Delhi', 'Delhi', 'India', 28.6132, 77.3045, 'married', 'Extramarital romance', 'A discreet, mature man for mutual excitement and private indulgence.',
  'Married corporate professional with a thirst for excitement. Craving dirty late-night talks, spicy roleplay, and private weekend meetups.', '/img/delhi/images (6).jpeg', 'Financial Consultant', 'Chartered Accountant (CA)', 166, TRUE, '["Roleplay","Dirty Talk","Late Night Talks","Hotel Lounges","Sensual Massage"]', '["Discreet Affairs","Hotel Rendezvous","Sensual Intimacy","Roleplay"]', '["Ambitious","Secretive","Intense","Passionate"]', '["Power Dynamic Roleplay","Dirty Talk","Sensual Teasing"]',
  'English, Hindi', 'English, Hindi', 'verified', 'facial', NOW(), TRUE, 'COMPLETED',
  'COMPLETED', 'APPROVED', 'ACTIVE', TRUE, FALSE, 'fakeid', 50,
  NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  nickname = EXCLUDED.nickname,
  date_of_birth = EXCLUDED.date_of_birth,
  age = EXCLUDED.age,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  marital_status = EXCLUDED.marital_status,
  relationship_type = EXCLUDED.relationship_type,
  looking_for = EXCLUDED.looking_for,
  bio = EXCLUDED.bio,
  profile_photo = EXCLUDED.profile_photo,
  profession = EXCLUDED.profession,
  education = EXCLUDED.education,
  height = EXCLUDED.height,
  is_online = EXCLUDED.is_online,
  hobbies = EXCLUDED.hobbies,
  interests = EXCLUDED.interests,
  personality_traits = EXCLUDED.personality_traits,
  sexual_practices = EXCLUDED.sexual_practices,
  verification_status = 'verified',
  verification_type = 'facial',
  profile_completed = TRUE,
  profile_status = 'COMPLETED',
  onboarding_status = 'COMPLETED',
  account_status = 'ACTIVE',
  admin_notes = 'fakeid',
  updated_at = NOW();

INSERT INTO user_privacy_settings (user_id, hide_real_name, hide_phone, hide_email, blur_face, hide_distance, hide_age, incognito_mode)
SELECT id, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE FROM users WHERE email = 'test_divya_delhi@sway.local'
ON CONFLICT (user_id) DO NOTHING;

COMMIT;