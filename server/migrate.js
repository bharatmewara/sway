'use strict';

const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

const SCHEMA_SQL = `
ALTER ROLE CURRENT_USER SET search_path TO public;
SET search_path TO public;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gender VARCHAR(20) NOT NULL DEFAULT 'male',
  selected_gender VARCHAR(20),
  verified_gender VARCHAR(20),
  ai_detected_gender VARCHAR(20),
  gender_match_status VARCHAR(30) DEFAULT 'PENDING',
  date_of_birth DATE,
  age INTEGER,
  nickname VARCHAR(50),
  country VARCHAR(100) DEFAULT 'India',
  state VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location_updated_at TIMESTAMP,
  travel_mode BOOLEAN DEFAULT FALSE,
  travel_city VARCHAR(100),
  travel_country VARCHAR(100),
  bio TEXT,
  profile_photo TEXT,
  photo_bytes BYTEA,
  photo_mime VARCHAR(50),
  video_intro VARCHAR(255),
  voice_intro VARCHAR(255),
  marital_status VARCHAR(30) DEFAULT 'single',
  relationship_type VARCHAR(50),
  looking_for TEXT,
  interested_in VARCHAR(20) DEFAULT 'both',
  height INTEGER,
  weight INTEGER,
  body_type VARCHAR(30),
  education VARCHAR(100),
  profession VARCHAR(100),
  languages VARCHAR(255),
  languages_spoken TEXT,
  interests TEXT,
  hobbies TEXT,
  hair_color VARCHAR(30),
  eye_color VARCHAR(30),
  drinking VARCHAR(30),
  smoking VARCHAR(30),
  smoker VARCHAR(30),
  children VARCHAR(50),
  ethnicity VARCHAR(50),
  personality_traits TEXT,
  sexual_practices TEXT,
  relationship_expectations TEXT,
  religion VARCHAR(50),
  instagram VARCHAR(100),
  facebook VARCHAR(100),
  telegram VARCHAR(100),
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  account_status VARCHAR(30) DEFAULT 'ACTIVE',
  suspended_until TIMESTAMP,
  admin_notes TEXT,
  profile_moderation_status VARCHAR(30) DEFAULT 'APPROVED',
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(255),
  google_id VARCHAR(255),
  apple_id VARCHAR(255),
  facebook_id VARCHAR(255),
  verification_status VARCHAR(50) DEFAULT 'NOT_VERIFIED',
  verification_type VARCHAR(30),
  connect_required_for_chat BOOLEAN DEFAULT TRUE,
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_status VARCHAR(30) DEFAULT 'INCOMPLETE',
  onboarding_status VARCHAR(50) DEFAULT 'NOT_VERIFIED',
  verified_at TIMESTAMP,
  connect_credits INTEGER DEFAULT 0,
  role VARCHAR(30) DEFAULT 'user',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP,
  total_likes_received INTEGER DEFAULT 0,
  boost_active_until TIMESTAMP,
  preferred_age_min INTEGER DEFAULT 18,
  preferred_age_max INTEGER DEFAULT 60,
  preferred_distance INTEGER DEFAULT 50,
  blur_face_photo BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  privacy_policy_accepted BOOLEAN DEFAULT FALSE,
  terms_version VARCHAR(20) DEFAULT '1.0',
  privacy_policy_version VARCHAR(20) DEFAULT '1.0',
  consent_accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  hide_real_name BOOLEAN DEFAULT FALSE,
  hide_phone BOOLEAN DEFAULT TRUE,
  hide_email BOOLEAN DEFAULT TRUE,
  hide_instagram BOOLEAN DEFAULT FALSE,
  hide_facebook BOOLEAN DEFAULT FALSE,
  hide_telegram BOOLEAN DEFAULT FALSE,
  blur_face BOOLEAN DEFAULT FALSE,
  hide_distance BOOLEAN DEFAULT FALSE,
  hide_age BOOLEAN DEFAULT FALSE,
  incognito_mode BOOLEAN DEFAULT FALSE,
  invisible_browsing BOOLEAN DEFAULT FALSE,
  screenshot_warning BOOLEAN DEFAULT TRUE,
  auto_logout_minutes INTEGER DEFAULT 0,
  notification_masking BOOLEAN DEFAULT FALSE,
  pin_lock VARCHAR(6),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS female_privacy_permissions (
  id SERIAL PRIMARY KEY,
  female_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  male_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allow_instagram BOOLEAN DEFAULT FALSE,
  allow_facebook BOOLEAN DEFAULT FALSE,
  allow_telegram BOOLEAN DEFAULT FALSE,
  allow_phone BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(female_user_id, male_user_id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(512) UNIQUE NOT NULL,
  refresh_token VARCHAR(512) UNIQUE,
  device_name VARCHAR(100),
  device_type VARCHAR(30) DEFAULT 'web',
  os VARCHAR(50),
  browser VARCHAR(50),
  ip_address VARCHAR(45),
  location_country VARCHAR(100),
  location_city VARCHAR(100),
  is_current BOOLEAN DEFAULT TRUE,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  device_name VARCHAR(100),
  biometric_token VARCHAR(512),
  is_trusted BOOLEAN DEFAULT FALSE,
  fcm_token VARCHAR(512),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  device_name VARCHAR(100),
  location VARCHAR(200),
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20),
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(30) DEFAULT 'phone_verify',
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  verification_type VARCHAR(30) DEFAULT 'facial',
  selfie_photo TEXT,
  selfie_bytes BYTEA,
  selfie_mime VARCHAR(50),
  document_photo TEXT,
  document_type VARCHAR(50),
  selected_gender VARCHAR(20),
  ai_gender_detected VARCHAR(20),
  gender_match_status VARCHAR(30) DEFAULT 'PENDING',
  capture_source VARCHAR(50) DEFAULT 'live_camera',
  face_count INTEGER DEFAULT 1,
  failure_reason TEXT,
  ai_confidence_score DECIMAL(5,4),
  ai_face_match_score DECIMAL(5,4),
  ai_liveness_score DECIMAL(5,4),
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  liker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  liked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  like_type VARCHAR(20) DEFAULT 'like',
  message TEXT,
  credits_charged INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  match_type VARCHAR(30) DEFAULT 'mutual_like',
  compatibility_score DECIMAL(5,2) DEFAULT 0,
  matched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  favorited_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, favorited_id)
);

CREATE TABLE IF NOT EXISTS crushes (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_mutual BOOLEAN DEFAULT FALSE,
  credits_charged INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS connection_requests (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) DEFAULT 'chat',
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  credits_charged INTEGER DEFAULT 0,
  connects_charged INTEGER DEFAULT 0,
  responded_at TIMESTAMP,
  granted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  visitor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  visited_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  visited_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  communication_type VARCHAR(30) DEFAULT 'chat',
  session_status VARCHAR(30) DEFAULT 'ACTIVE',
  session_started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_female_message_at TIMESTAMP,
  male_unlocked BOOLEAN DEFAULT FALSE,
  last_message_id INTEGER,
  last_message_at TIMESTAMP DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  user1_deleted BOOLEAN DEFAULT FALSE,
  user2_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_pair_type
  ON conversations (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id), COALESCE(communication_type, 'chat'));

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  media_url VARCHAR(500),
  media_type VARCHAR(20) DEFAULT 'text',
  communication_type VARCHAR(30) DEFAULT 'chat',
  is_unlocked BOOLEAN DEFAULT TRUE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  reactions JSONB DEFAULT '{}',
  reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  credits_charged INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS private_message_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  connect_cost INTEGER NOT NULL DEFAULT 0,
  transaction_id INTEGER,
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

CREATE TABLE IF NOT EXISTS private_photos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_bytes BYTEA,
  photo_mime VARCHAR(50),
  is_blurred BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS private_photo_access (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  request_id INTEGER,
  status VARCHAR(30) DEFAULT 'pending',
  credits_charged INTEGER DEFAULT 0,
  connects_charged INTEGER DEFAULT 0,
  granted_at TIMESTAMP,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, owner_id)
);

CREATE TABLE IF NOT EXISTS connect_packs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  credits INTEGER NOT NULL,
  price_inr INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  discount INTEGER DEFAULT 0,
  bonus_connects INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connect_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  previous_balance INTEGER DEFAULT 0,
  new_balance INTEGER DEFAULT 0,
  related_user_id INTEGER,
  related_conversation_id INTEGER,
  payment_reference VARCHAR(255),
  status VARCHAR(30) DEFAULT 'COMPLETED',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  billing_period VARCHAR(20),
  price_inr DECIMAL(10,2),
  price_paise INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES subscription_plans(id),
  razorpay_subscription_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  razorpay_order_id VARCHAR(255) UNIQUE,
  razorpay_payment_id VARCHAR(255) UNIQUE,
  razorpay_signature VARCHAR(500),
  pack_name VARCHAR(100),
  credits_purchased INTEGER,
  amount_inr DECIMAL(10,2),
  amount_paise INTEGER,
  currency VARCHAR(10) DEFAULT 'INR',
  gateway VARCHAR(50) DEFAULT 'razorpay',
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  failure_reason TEXT,
  refund_status VARCHAR(50),
  refund_amount_inr DECIMAL(10,2),
  refund_reason TEXT,
  refunded_by INTEGER REFERENCES users(id),
  refunded_at TIMESTAMP,
  connects_reversed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  credits_delta INTEGER NOT NULL,
  balance_after INTEGER,
  related_id INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  body TEXT,
  related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  related_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reported_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  resolution_action VARCHAR(50),
  admin_notes TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  blocker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS mutes (
  id SERIAL PRIMARY KEY,
  muter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  muted_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(muter_id, muted_id)
);

CREATE TABLE IF NOT EXISTS followers (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  media_url VARCHAR(255) NOT NULL,
  media_type VARCHAR(10) DEFAULT 'image',
  caption TEXT,
  duration INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_views (
  id SERIAL PRIMARY KEY,
  story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS gift_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  emoji VARCHAR(10),
  animation_url VARCHAR(255),
  credit_cost INTEGER NOT NULL,
  category VARCHAR(30) DEFAULT 'standard',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS gifts (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  gift_id INTEGER REFERENCES gift_catalog(id) ON DELETE SET NULL,
  message TEXT,
  credits_charged INTEGER,
  is_seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boosts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  boost_type VARCHAR(30) DEFAULT '30min',
  credits_charged INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS admin_communication_settings (
  id SERIAL PRIMARY KEY,
  chat_start_cost INTEGER DEFAULT 5,
  chat_message_access_cost INTEGER DEFAULT 5,
  chat_reinitiate_cost INTEGER DEFAULT 5,
  chat_expiry_minutes INTEGER DEFAULT 60,
  private_message_start_cost INTEGER DEFAULT 10,
  private_message_access_cost INTEGER DEFAULT 5,
  private_message_reinitiate_cost INTEGER DEFAULT 10,
  private_message_expiry_hours INTEGER DEFAULT 72,
  private_photo_cost INTEGER DEFAULT 5,
  private_photo_access_cost INTEGER DEFAULT 5,
  like_cost INTEGER DEFAULT 0,
  crush_cost INTEGER DEFAULT 0,
  connection_request_cost INTEGER DEFAULT 0,
  promotional_connects INTEGER DEFAULT 0,
  refund_enabled BOOLEAN DEFAULT TRUE,
  female_connect_exemption BOOLEAN DEFAULT TRUE,
  chat_enabled BOOLEAN DEFAULT TRUE,
  private_message_enabled BOOLEAN DEFAULT TRUE,
  allow_chat_extension BOOLEAN DEFAULT TRUE,
  allow_female_initiation BOOLEAN DEFAULT TRUE,
  allow_male_initiation BOOLEAN DEFAULT TRUE,
  max_messages_per_session INTEGER DEFAULT 500,
  default_male_connects INTEGER DEFAULT 0,
  default_female_connects INTEGER DEFAULT 0,
  location_freshness_hours INTEGER DEFAULT 168,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_platform_settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) UNIQUE NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER,
  admin_username VARCHAR(100),
  admin_role VARCHAR(50),
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(100),
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
const ALTER_SQL = `
-- Safely add missing columns to existing tables
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS selfie_bytes BYTEA;
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS selfie_mime VARCHAR(50);
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS selected_gender VARCHAR(20);
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS gender_match_status VARCHAR(30) DEFAULT 'PENDING';
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS capture_source VARCHAR(50) DEFAULT 'live_camera';
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS face_count INTEGER DEFAULT 1;
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS failure_reason TEXT;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_action VARCHAR(50);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT 'razorpay';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refund_amount_inr DECIMAL(10,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refunded_by INTEGER REFERENCES users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS connects_reversed BOOLEAN DEFAULT FALSE;

ALTER TABLE user_privacy_settings ADD COLUMN IF NOT EXISTS hide_instagram BOOLEAN DEFAULT FALSE;
ALTER TABLE user_privacy_settings ADD COLUMN IF NOT EXISTS hide_facebook BOOLEAN DEFAULT FALSE;
ALTER TABLE user_privacy_settings ADD COLUMN IF NOT EXISTS hide_telegram BOOLEAN DEFAULT FALSE;

ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type VARCHAR(30) DEFAULT 'mutual_like';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(50) DEFAULT 'chat';
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS connects_charged INTEGER DEFAULT 0;
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP;
ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE connect_transactions ADD COLUMN IF NOT EXISTS related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE connect_transactions ADD COLUMN IF NOT EXISTS related_conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE connect_transactions ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
ALTER TABLE connect_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'COMPLETED';

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20) DEFAULT '1.0';
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_policy_version VARCHAR(20) DEFAULT '1.0';
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMP;
`;

(async () => {
  try {
    console.log('[1/4] Running schema migration...');
    await pool.query(SCHEMA_SQL);
    await pool.query(ALTER_SQL);
    console.log('[2/4] Schema and column updates applied successfully.');

    // Seed default admin_communication_settings if empty
    const commCheck = await pool.query('SELECT COUNT(*)::int AS cnt FROM admin_communication_settings');
    if (commCheck.rows[0].cnt === 0) {
      await pool.query(`INSERT INTO admin_communication_settings DEFAULT VALUES`);
      console.log('[3/4] Default communication settings initialized.');
    }

    // Seed default Connect packages if empty
    const packCheck = await pool.query('SELECT COUNT(*)::int AS cnt FROM connect_packs');
    if (packCheck.rows[0].cnt === 0) {
      await pool.query(`
        INSERT INTO connect_packs (name, credits, price_inr, bonus_connects, is_popular, is_active, display_order)
        VALUES
          ('Starter Pack', 20, 199, 0, false, true, 1),
          ('Popular Pack', 50, 449, 5, true, true, 2),
          ('VIP Value Pack', 120, 999, 20, false, true, 3)
      `);
      console.log('[3/4] Default Connect packages seeded.');
    }

    // Seed default Super Admin user (admin@sway.com / Admin@123) if not present
    const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@sway.com' LIMIT 1");
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('Admin@123', 10);
      await pool.query(
        `INSERT INTO users (username, email, password_hash, gender, verified_gender, verification_status, profile_completed, role, is_active)
         VALUES ('superadmin', 'admin@sway.com', $1, 'male', 'male', 'verified', true, 'superadmin', true)`,
        [hash]
      );
      console.log('[4/4] Default Super Admin created (admin@sway.com / Admin@123).');
    } else {
      console.log('[4/4] Super Admin already exists.');
    }

    const tablesRes = await pool.query(
      "SELECT COUNT(*)::int AS total FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
    );
    console.log('✅ All migrations completed! Total tables:', tablesRes.rows[0].total);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
})();
