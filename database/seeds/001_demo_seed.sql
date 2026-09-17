-- Demo Seed Data for SWAY

-- Default Superadmin:
-- Email: admin@sway.com, Password: Admin@123
INSERT INTO users (username, email, password_hash, gender, role, verification_status, connect_credits, is_online, city, state, country)
VALUES (
  'admin',
  'admin@sway.com',
  '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y',
  'male',
  'superadmin',
  'verified',
  9999,
  false,
  'Mumbai',
  'Maharashtra',
  'India'
) ON CONFLICT (email) DO NOTHING;

-- Seed Gift Catalog
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

-- Seed Subscription Plans
INSERT INTO subscription_plans (name, billing_period, price_inr, price_paise, features) VALUES
  ('Gold Monthly', 'monthly', 999, 99900, '{"unlimited_likes":true,"read_receipts":true,"see_who_liked":true,"incognito":true,"advanced_filters":true,"unlimited_messages":true}'),
  ('Gold Quarterly', 'quarterly', 2499, 249900, '{"unlimited_likes":true,"read_receipts":true,"see_who_liked":true,"incognito":true,"advanced_filters":true,"unlimited_messages":true}'),
  ('Gold Yearly', 'yearly', 5999, 599900, '{"unlimited_likes":true,"read_receipts":true,"see_who_liked":true,"incognito":true,"advanced_filters":true,"unlimited_messages":true,"priority_support":true,"profile_boost_monthly":true}')
ON CONFLICT DO NOTHING;

-- Seed Demo Members Matching Reference Design
INSERT INTO users (username, email, password_hash, gender, age, role, verification_status, connect_credits, is_online, city, state, country, profile_photo, bio) VALUES
  ('ishikai', 'ishika@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 26, 'user', 'verified', 25, false, 'Gurugram', 'Haryana', 'India', '/img/m1.jpg', 'Living life with a smile.'),
  ('Sona_1990', 'sona@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 29, 'user', 'verified', 30, false, 'Noida', 'Uttar Pradesh', 'India', '/img/m2.jpg', 'Passionate about travel & photography.'),
  ('sheetalposwa', 'sheetal@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 24, 'user', 'verified', 40, false, 'New Delhi', 'Delhi', 'India', '/img/m3.jpg', 'Coffee lover and weekend explorer.'),
  ('gourmetpista', 'gourmet@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 28, 'user', 'verified', 20, false, 'South Delhi', 'Delhi', 'India', '/img/m4.jpg', 'Foodie & music enthusiast.'),
  ('xyzhegfdd', 'xyz@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 27, 'user', 'verified', 15, false, 'Jaipur', 'Rajasthan', 'India', '/img/m3.jpg', 'Looking for meaningful conversations.'),
  ('sapio0506', 'sapio@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 25, 'user', 'verified', 50, true, 'Lucknow', 'Uttar Pradesh', 'India', '/img/m1.jpg', 'Curious mind, warm heart.'),
  ('henapan_telgem', 'henapan@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 26, 'user', 'verified', 10, true, 'Delhi', 'Delhi', 'India', '/img/m2.jpg', 'Art, design and poetry.'),
  ('sveeta', 'sveeta@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 23, 'user', 'verified', 35, true, 'Delhi', 'Delhi', 'India', '/img/m3.jpg', 'Fitness enthusiast and dog lover.'),
  ('Litchi26', 'litchi@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 27, 'user', 'verified', 60, true, 'Delhi', 'Delhi', 'India', '/img/m4.jpg', 'Dancing through life with elegance.'),
  ('Urvaishi', 'urvaishi@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 25, 'user', 'verified', 45, true, 'Udaipur', 'Rajasthan', 'India', '/img/m4.jpg', 'Sunset chaser & bookworm.'),
  ('Sophia Miller', 'sophia@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 28, 'user', 'verified', 14, true, 'Mumbai', 'Maharashtra', 'India', '/img/m1.jpg', 'Private verified profile.'),
  ('Emma Wilson', 'emma@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 26, 'user', 'verified', 22, true, 'New Delhi', 'Delhi', 'India', '/img/m2.jpg', 'Always up for good conversation.'),
  ('Olivia Harper', 'olivia@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 24, 'user', 'verified', 18, false, 'Bengaluru', 'Karnataka', 'India', '/img/m3.jpg', 'Tech nerd & weekend hiker.'),
  ('Mia Anderson', 'mia@sway.com', '$2b$12$01CA6/fuzClg/89j/tXCVedwzlGi5jMy6iZyRDCbRD5QXPkB4uq9y', 'female', 27, 'user', 'verified', 30, true, 'Jaipur', 'Rajasthan', 'India', '/img/m4.jpg', 'Lover of aesthetics.')
ON CONFLICT (email) DO NOTHING;

