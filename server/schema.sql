-- SWAY Dating App - PostgreSQL Schema
-- Run this script to create all tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop tables if exist (for fresh setup)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS private_photo_access CASCADE;
DROP TABLE IF EXISTS private_photos CASCADE;
DROP TABLE IF EXISTS crushes CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS connection_requests CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================
-- USERS TABLE
-- ========================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Demographics
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  date_of_birth DATE,
  age INTEGER,
  
  -- Location
  country VARCHAR(100) DEFAULT 'India',
  state VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Profile
  bio TEXT,
  profile_photo VARCHAR(255),
  marital_status VARCHAR(30) DEFAULT 'married' CHECK (marital_status IN ('married', 'single', 'divorced', 'widowed', 'in_relationship')),
  relationship_type VARCHAR(50),
  looking_for TEXT,
  height INTEGER, -- in cm
  body_type VARCHAR(30),
  education VARCHAR(100),
  profession VARCHAR(100),
  languages VARCHAR(255),
  interests TEXT,
  
  -- Status
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  
  -- Verification
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
  verification_type VARCHAR(20) CHECK (verification_type IN ('facial', 'document')),
  verified_at TIMESTAMP,
  
  -- Credits & Role
  connect_credits INTEGER DEFAULT 0,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  
  -- Preferences
  preferred_age_min INTEGER DEFAULT 18,
  preferred_age_max INTEGER DEFAULT 60,
  preferred_distance INTEGER DEFAULT 50, -- km
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_location ON users(latitude, longitude);
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_verification ON users(verification_status);
CREATE INDEX idx_users_online ON users(is_online);
CREATE INDEX idx_users_username_trgm ON users USING gin(username gin_trgm_ops);

-- ========================
-- VERIFICATION REQUESTS
-- ========================
CREATE TABLE verification_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('facial', 'document')),
  
  -- Uploaded files
  selfie_photo VARCHAR(255),
  document_photo VARCHAR(255),
  document_type VARCHAR(50), -- 'aadhaar', 'passport', 'driving_license', 'voter_id'
  
  -- AI Analysis results
  ai_gender_detected VARCHAR(10),
  ai_confidence_score DECIMAL(5,4),
  ai_face_match_score DECIMAL(5,4),
  ai_liveness_score DECIMAL(5,4),
  
  -- Admin review
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- CONVERSATIONS
-- ========================
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  last_message_id INTEGER,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- ========================
-- MESSAGES
-- ========================
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'sticker')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  credits_charged INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Foreign key for last message
ALTER TABLE conversations ADD CONSTRAINT fk_last_message 
  FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ========================
-- CONNECTION REQUESTS
-- ========================
CREATE TABLE connection_requests (
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

-- ========================
-- CRUSHES (ROSES)
-- ========================
CREATE TABLE crushes (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_mutual BOOLEAN DEFAULT FALSE,
  credits_charged INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- ========================
-- PROFILE VISITS
-- ========================
CREATE TABLE visits (
  id SERIAL PRIMARY KEY,
  visitor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  visited_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  visited_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_visits_visited ON visits(visited_id, visited_at DESC);

-- ========================
-- PRIVATE PHOTOS
-- ========================
CREATE TABLE private_photos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  photo_url VARCHAR(255) NOT NULL,
  is_blurred BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Private photo access requests
CREATE TABLE private_photo_access (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'denied')),
  credits_charged INTEGER DEFAULT 10,
  granted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, owner_id)
);

-- ========================
-- TRANSACTIONS
-- ========================
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  razorpay_order_id VARCHAR(255) UNIQUE,
  razorpay_payment_id VARCHAR(255) UNIQUE,
  razorpay_signature VARCHAR(500),
  
  -- Pack details
  pack_name VARCHAR(100),
  credits_purchased INTEGER,
  amount_inr DECIMAL(10,2),
  amount_paise INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ========================
-- NOTIFICATIONS
-- ========================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'message', 'crush', 'request', 'visit', 'verification'
  title VARCHAR(255),
  body TEXT,
  related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  related_id INTEGER, -- message_id, crush_id, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ========================
-- REPORTS
-- ========================
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reported_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- CREDIT TRANSACTIONS LOG
-- ========================
CREATE TABLE credit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'message_sent', 'crush_sent', 'purchase', 'admin_grant'
  credits_delta INTEGER NOT NULL, -- positive = added, negative = spent
  balance_after INTEGER,
  related_id INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_logs_user ON credit_logs(user_id, created_at DESC);

-- ========================
-- SEED: Admin User
-- ========================
-- Password: Admin@123 (bcrypt hash)
INSERT INTO users (username, email, password_hash, gender, role, verification_status, connect_credits)
VALUES (
  'admin',
  'admin@sway.com',
  '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y',
  'male',
  'superadmin',
  'verified',
  9999
);

-- ========================
-- USEFUL FUNCTIONS
-- ========================

-- Function to calculate distance between two coordinates (in km)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Earth radius in km
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  a := SIN(dLat/2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dLon/2)^2;
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update updated_at on users
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
