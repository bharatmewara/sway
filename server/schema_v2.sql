-- SWAY Dating App - Schema v2 (Feature Expansion)
-- Run AFTER schema.sql (adds new tables without dropping existing ones)

-- ========================
-- PRIVACY SETTINGS
-- ========================
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

-- ========================
-- SESSIONS / DEVICE MANAGEMENT
-- ========================
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

-- Login alert history
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

-- OTP codes (phone verification, 2FA)
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

-- 2FA settings
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS two_fa_secret VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(50),
  ADD COLUMN IF NOT EXISTS weight INTEGER,
  ADD COLUMN IF NOT EXISTS hair_color VARCHAR(30),
  ADD COLUMN IF NOT EXISTS eye_color VARCHAR(30),
  ADD COLUMN IF NOT EXISTS drinking VARCHAR(20),
  ADD COLUMN IF NOT EXISTS smoking VARCHAR(20),
  ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
  ADD COLUMN IF NOT EXISTS languages_spoken TEXT,
  ADD COLUMN IF NOT EXISTS hobbies TEXT,
  ADD COLUMN IF NOT EXISTS interested_in VARCHAR(10) DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS video_intro VARCHAR(255),
  ADD COLUMN IF NOT EXISTS voice_intro VARCHAR(255),
  ADD COLUMN IF NOT EXISTS blur_face_photo BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS total_likes_received INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boost_active_until TIMESTAMP,
  ADD COLUMN IF NOT EXISTS travel_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS travel_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS travel_country VARCHAR(100);

-- ========================
-- LIKES / MATCHING
-- ========================
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  liker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  liked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  like_type VARCHAR(20) DEFAULT 'like' CHECK (like_type IN ('like','super_like','pass','undo')),
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

-- ========================
-- BLOCKS & MUTES
-- ========================
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

-- ========================
-- SOCIAL: FOLLOWERS
-- ========================
CREATE TABLE IF NOT EXISTS followers (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ========================
-- STORIES
-- ========================
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

-- ========================
-- VIRTUAL GIFTS
-- ========================
CREATE TABLE IF NOT EXISTS gift_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  emoji VARCHAR(10),
  animation_url VARCHAR(255),
  credit_cost INTEGER NOT NULL,
  category VARCHAR(30) DEFAULT 'standard',
  is_active BOOLEAN DEFAULT TRUE
);

-- Seed gift catalog
INSERT INTO gift_catalog (name, emoji, credit_cost, category) VALUES
  ('Rose', '🌹', 5, 'classic'),
  ('Heart', '💖', 3, 'classic'),
  ('Coffee', '☕', 2, 'casual'),
  ('Chocolate', '🍫', 4, 'sweet'),
  ('Diamond', '💎', 50, 'premium'),
  ('Crown', '👑', 100, 'premium'),
  ('Teddy Bear', '🧸', 10, 'sweet'),
  ('Champagne', '🥂', 25, 'premium'),
  ('Bouquet', '💐', 15, 'classic'),
  ('Star', '⭐', 8, 'standard')
ON CONFLICT DO NOTHING;

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

-- ========================
-- PROFILE BOOSTS
-- ========================
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

-- ========================
-- PREMIUM SUBSCRIPTIONS
-- ========================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  billing_period VARCHAR(20) CHECK (billing_period IN ('monthly','quarterly','yearly')),
  price_inr DECIMAL(10,2),
  price_paise INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO subscription_plans (name, billing_period, price_inr, price_paise, features) VALUES
  ('Gold Monthly', 'monthly', 999, 99900, '{"unlimited_likes":true,"read_receipts":true,"see_who_liked":true,"incognito":true,"advanced_filters":true,"unlimited_messages":true}'),
  ('Gold Quarterly', 'quarterly', 2499, 249900, '{"unlimited_likes":true,"read_receipts":true,"see_who_liked":true,"incognito":true,"advanced_filters":true,"unlimited_messages":true}'),
  ('Gold Yearly', 'yearly', 5999, 599900, '{"unlimited_likes":true,"read_receipts":true,"see_who_liked":true,"incognito":true,"advanced_filters":true,"unlimited_messages":true,"priority_support":true,"profile_boost_monthly":true}')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES subscription_plans(id),
  razorpay_subscription_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','paused')),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status);

-- ========================
-- CALL LOGS
-- ========================
CREATE TABLE IF NOT EXISTS call_logs (
  id SERIAL PRIMARY KEY,
  caller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  receiver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  call_type VARCHAR(10) DEFAULT 'voice' CHECK (call_type IN ('voice','video')),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('initiated','ringing','accepted','rejected','missed','ended','completed')),
  duration_seconds INTEGER DEFAULT 0,
  credits_charged INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_call_logs_users ON call_logs(caller_id, receiver_id);

-- ========================
-- EVENTS
-- ========================
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  organizer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(20) DEFAULT 'local' CHECK (event_type IN ('local','online','meetup')),
  cover_image VARCHAR(255),
  location_name VARCHAR(200),
  city VARCHAR(100),
  country VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  online_link VARCHAR(500),
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  max_attendees INTEGER,
  attendee_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city, starts_at);

CREATE TABLE IF NOT EXISTS event_attendees (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rsvp_status VARCHAR(20) DEFAULT 'going' CHECK (rsvp_status IN ('going','maybe','not_going')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ========================
-- AI SUGGESTIONS
-- ========================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  suggested_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(5,2),
  reasons JSONB,
  date DATE DEFAULT CURRENT_DATE,
  is_viewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- MESSAGE ENHANCEMENTS
-- ========================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS media_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user1_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user2_deleted BOOLEAN DEFAULT FALSE;

-- ========================
-- SAVED SEARCHES
-- ========================
CREATE TABLE IF NOT EXISTS saved_searches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  filters JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMIT;
