# SWAY Database Architecture & Schema Specification

## 1. Engine & Configuration
- **Database Engine**: PostgreSQL 14+
- **Extensions**:
  - `uuid-ossp`: Unique UUID generation for user identifiers.
  - `pg_trgm`: Fast trigram fuzzy search and indexing for usernames and tags.

---

## 2. Entity-Relationship Overview

```
 [ users ] ── 1:1 ── [ user_privacy_settings ]
    │
    ├── 1:N ── [ private_photos ]
    ├── 1:N ── [ verification_requests ]
    ├── 1:N ── [ likes ] (liker / liked)
    ├── 1:N ── [ matches ] (user1 / user2)
    ├── 1:N ── [ conversations ] (user1 / user2)
    │                └── 1:N ── [ messages ]
    ├── 1:N ── [ notifications ]
    ├── 1:N ── [ reports ] (reporter / reported)
    ├── 1:N ── [ blocks ]
    └── 1:N ── [ transactions ]
```

---

## 3. Core Tables

### `users`
Primary identity and profile attributes.
- `id` (SERIAL PRIMARY KEY)
- `uuid` (UUID UNIQUE)
- `username` (VARCHAR(50) UNIQUE)
- `email` (VARCHAR(100) UNIQUE)
- `password_hash` (VARCHAR(255))
- `gender` ('male' | 'female' | 'other')
- `date_of_birth` (DATE)
- `age` (INTEGER)
- `city`, `state`, `country`
- `latitude`, `longitude`
- `bio`, `profile_photo`
- `verification_status` ('pending' | 'under_review' | 'verified' | 'rejected')
- `connect_credits` (INTEGER DEFAULT 0)
- `role` ('user' | 'admin' | 'superadmin')
- `is_online` (BOOLEAN)
- `last_seen` (TIMESTAMP)

### `user_privacy_settings`
Granular user control over information disclosure.
- `user_id` (INTEGER REFERENCES users(id))
- `hide_real_name`, `hide_phone`, `hide_email`
- `blur_face`, `hide_distance`, `hide_age`
- `incognito_mode`, `invisible_browsing`

### `likes` & `matches`
Swipe actions and reciprocal matches.
- `likes`: `liker_id`, `liked_id`, `like_type` ('like' | 'super_like' | 'pass' | 'undo'), `created_at`
- `matches`: `user1_id`, `user2_id`, `compatibility_score`, `matched_at`, `is_active`

### `conversations` & `messages`
Real-time threaded chat.
- `conversations`: `user1_id`, `user2_id`, `last_message_id`, `last_message_at`
- `messages`: `conversation_id`, `sender_id`, `receiver_id`, `content`, `message_type`, `media_url`, `is_read`

### `transactions` & `subscriptions`
Payment history and credit balance logs.
- `transactions`: `user_id`, `razorpay_order_id`, `razorpay_payment_id`, `pack_name`, `credits_purchased`, `amount_inr`, `status`

---

## 4. Performance Indexes
- Index on `users(city)` and `users(latitude, longitude)` for spatial filtering.
- Index on `users(gender)` and `users(verification_status)`.
- Index on `messages(conversation_id)` and `messages(created_at DESC)`.
- Index on `likes(liker_id)` and `likes(liked_id)`.
- Trigram index `idx_users_username_trgm` on `users(username)` using GIN.
