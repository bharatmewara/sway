-- SWAY Dating Application - Production Database Schema
-- Compatible with PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- USERS & ACCOUNTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Demographics
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  age INTEGER,
  nickname VARCHAR(50),
  
  -- Location
  country VARCHAR(100) DEFAULT 'India',
  state VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  travel_mode BOOLEAN DEFAULT FALSE,
  travel_city VARCHAR(100),
  travel_country VARCHAR(100),
  
  -- Profile Details
  bio TEXT,
  profile_photo VARCHAR(255),
  video_intro VARCHAR(255),
  voice_intro VARCHAR(255),
  marital_status VARCHAR(30) DEFAULT 'single' CHECK (marital_status IN ('married', 'single', 'divorced', 'widowed', 'in_relationship')),
  relationship_type VARCHAR(50),
  looking_for TEXT,
  interested_in VARCHAR(10) DEFAULT 'both',
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
  drinking VARCHAR(20),
  smoking VARCHAR(20),
  religion VARCHAR(50),
  
  -- Account & Security Status
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(255),
  google_id VARCHAR(255),
  apple_id VARCHAR(255),
  facebook_id VARCHAR(255),
  
  -- Verification
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
  verification_type VARCHAR(20) CHECK (verification_type IN ('facial', 'document')),
  verified_at TIMESTAMP,
  
  -- Credits & Monetization
  connect_credits INTEGER DEFAULT 0,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP,
  total_likes_received INTEGER DEFAULT 0,
  boost_active_until TIMESTAMP,
  
  -- Match Preferences
  preferred_age_min INTEGER DEFAULT 18,
  preferred_age_max INTEGER DEFAULT 60,
  preferred_distance INTEGER DEFAULT 50,
  blur_face_photo BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin(username gin_trgm_ops);

-- ============================================================================
-- PRIVACY SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  hide_real_name BOOLEAN DEFAULT FALSE,
  hide_phone BOOLEAN DEFAULT TRUE,
  hide_email BOOLEAN DEFAULT TRUE,
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

-- ============================================================================
-- SESSIONS & DEVICES
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

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
CREATE INDEX IF NOT EXISTS idx_login_alerts_user ON login_alerts(user_id, created_at DESC);

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

-- ============================================================================
-- VERIFICATION REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS verification_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('facial', 'document')),
  selfie_photo VARCHAR(255),
  document_photo VARCHAR(255),
  document_type VARCHAR(50),
  ai_gender_detected VARCHAR(10),
  ai_confidence_score DECIMAL(5,4),
  ai_face_match_score DECIMAL(5,4),
  ai_liveness_score DECIMAL(5,4),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MATCHING, SWIPES & FAVORITES
-- ============================================================================
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  liker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  liked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  like_type VARCHAR(20) DEFAULT 'like' CHECK (like_type IN ('like', 'super_like', 'pass', 'undo')),
  message TEXT,
  credits_charged INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_liker ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked ON likes(liked_id);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(5,2) DEFAULT 0,
  matched_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user1_id, user2_id)
);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);

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
  credits_charged INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS connection_requests (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  credits_charged INTEGER DEFAULT 5,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  visitor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  visited_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  visited_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visits_visited ON visits(visited_id, visited_at DESC);

-- ============================================================================
-- MESSAGING & CHAT
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  last_message_id INTEGER,
  last_message_at TIMESTAMP DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  user1_deleted BOOLEAN DEFAULT FALSE,
  user2_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'sticker')),
  media_url VARCHAR(500),
  media_type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  reactions JSONB DEFAULT '{}',
  reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  credits_charged INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ============================================================================
-- PRIVATE PHOTOS & MEDIA
-- ============================================================================
CREATE TABLE IF NOT EXISTS private_photos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  photo_url VARCHAR(255) NOT NULL,
  is_blurred BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS private_photo_access (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'denied')),
  credits_charged INTEGER DEFAULT 10,
  granted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, owner_id)
);

-- ============================================================================
-- TRANSACTIONS & SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  billing_period VARCHAR(20) CHECK (billing_period IN ('monthly', 'quarterly', 'yearly')),
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
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status);

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
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

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
CREATE INDEX IF NOT EXISTS idx_credit_logs_user ON credit_logs(user_id, created_at DESC);

-- ============================================================================
-- NOTIFICATIONS, REPORTS & MODERATION
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reported_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
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

-- ============================================================================
-- STORIES, BOOSTS & GIFTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  media_url VARCHAR(255) NOT NULL,
  media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image','video')),
  caption TEXT,
  duration INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(expires_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_gifts_receiver ON gifts(receiver_id, is_seen);

CREATE TABLE IF NOT EXISTS boosts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  boost_type VARCHAR(30) DEFAULT '30min' CHECK (boost_type IN ('30min','1hour','24hours')),
  credits_charged INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_boosts_user ON boosts(user_id, is_active);

-- ============================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371;
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN 99999;
  END IF;
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  a := SIN(dLat/2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dLon/2)^2;
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
