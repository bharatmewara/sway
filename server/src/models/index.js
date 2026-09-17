'use strict';

/**
 * Core Data Models and Schema Definitions
 */

module.exports = {
  User: {
    table: 'users',
    fields: [
      'id', 'uuid', 'username', 'email', 'password_hash', 'gender',
      'date_of_birth', 'age', 'city', 'state', 'country', 'latitude', 'longitude',
      'bio', 'profile_photo', 'marital_status', 'relationship_type', 'looking_for',
      'height', 'body_type', 'education', 'profession', 'languages', 'interests',
      'is_online', 'last_seen', 'is_active', 'is_banned', 'ban_reason',
      'verification_status', 'verification_type', 'verified_at',
      'connect_credits', 'role', 'created_at', 'updated_at'
    ]
  },
  Conversation: {
    table: 'conversations',
    fields: ['id', 'user1_id', 'user2_id', 'last_message_id', 'last_message_at', 'created_at']
  },
  Message: {
    table: 'messages',
    fields: ['id', 'conversation_id', 'sender_id', 'receiver_id', 'content', 'message_type', 'is_read', 'read_at', 'created_at']
  },
  Like: {
    table: 'likes',
    fields: ['id', 'liker_id', 'liked_id', 'like_type', 'message', 'created_at']
  },
  Match: {
    table: 'matches',
    fields: ['id', 'user1_id', 'user2_id', 'compatibility_score', 'matched_at', 'is_active']
  },
  Notification: {
    table: 'notifications',
    fields: ['id', 'user_id', 'type', 'title', 'body', 'related_user_id', 'related_id', 'is_read', 'created_at']
  },
  Report: {
    table: 'reports',
    fields: ['id', 'reporter_id', 'reported_id', 'reason', 'description', 'status', 'reviewed_by', 'created_at']
  },
  Transaction: {
    table: 'transactions',
    fields: ['id', 'user_id', 'razorpay_order_id', 'razorpay_payment_id', 'pack_name', 'credits_purchased', 'amount_inr', 'status', 'created_at']
  }
};
