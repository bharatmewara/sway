'use strict';

const pool = require('../config/database');
const conversationRepo = require('../repositories/conversation.repository');
const messageRepo = require('../repositories/message.repository');
const reportRepo = require('../repositories/report.repository');

class ChatService {
  constructor() {
    this._schemaReady = false;
  }

  async ensureSchema() {
    if (this._schemaReady) return;
    try {
      await pool.query(
        `ALTER TABLE admin_communication_settings ADD COLUMN IF NOT EXISTS private_message_access_cost INTEGER DEFAULT 5`
      );
      await pool.query(
        `CREATE TABLE IF NOT EXISTS private_message_access (
           id SERIAL PRIMARY KEY,
           user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
           message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
           conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
           connect_cost INTEGER NOT NULL DEFAULT 0,
           transaction_id INTEGER,
           granted_at TIMESTAMP DEFAULT NOW(),
           UNIQUE(user_id, message_id)
         )`
      );
      this._schemaReady = true;
    } catch (err) {
      console.error('[ChatService] ensureSchema error:', err.message);
    }
  }

  async getAdminConfig() {
    await this.ensureSchema();
    const res = await pool.query('SELECT * FROM admin_communication_settings ORDER BY id ASC LIMIT 1');
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        ...row,
        private_message_access_cost: row.private_message_access_cost ?? 5,
        private_photo_access_cost: row.private_photo_access_cost ?? row.private_photo_cost ?? 5,
        private_photo_cost: row.private_photo_cost ?? row.private_photo_access_cost ?? 5,
      };
    }
    return {
      chat_start_cost: 5,
      chat_message_access_cost: 5,
      chat_reinitiate_cost: 5,
      chat_expiry_minutes: 60,
      private_message_start_cost: 10,
      private_message_access_cost: 5,
      private_message_reinitiate_cost: 10,
      private_message_expiry_hours: 72,
      private_photo_access_cost: 5,
      private_photo_cost: 5,
      promotional_connects: 0,
      refund_enabled: true,
    };
  }

  async updateAdminConfig(updates = {}) {
    const current = await this.getAdminConfig();
    const res = await pool.query(
      `UPDATE admin_communication_settings
       SET chat_start_cost = COALESCE($1, chat_start_cost),
           chat_message_access_cost = COALESCE($2, chat_message_access_cost),
           chat_reinitiate_cost = COALESCE($3, chat_reinitiate_cost),
           chat_expiry_minutes = COALESCE($4, chat_expiry_minutes),
           private_message_start_cost = COALESCE($5, private_message_start_cost),
           private_message_reinitiate_cost = COALESCE($6, private_message_reinitiate_cost),
           private_message_expiry_hours = COALESCE($7, private_message_expiry_hours),
           promotional_connects = COALESCE($8, promotional_connects),
           refund_enabled = COALESCE($9, refund_enabled),
           private_message_access_cost = COALESCE($10, private_message_access_cost),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        updates.chat_start_cost !== undefined ? parseInt(updates.chat_start_cost, 10) : null,
        updates.chat_message_access_cost !== undefined ? parseInt(updates.chat_message_access_cost, 10) : null,
        updates.chat_reinitiate_cost !== undefined ? parseInt(updates.chat_reinitiate_cost, 10) : null,
        updates.chat_expiry_minutes !== undefined ? parseInt(updates.chat_expiry_minutes, 10) : null,
        updates.private_message_start_cost !== undefined ? parseInt(updates.private_message_start_cost, 10) : null,
        updates.private_message_reinitiate_cost !== undefined ? parseInt(updates.private_message_reinitiate_cost, 10) : null,
        updates.private_message_expiry_hours !== undefined ? parseInt(updates.private_message_expiry_hours, 10) : null,
        updates.promotional_connects !== undefined ? parseInt(updates.promotional_connects, 10) : null,
        updates.refund_enabled !== undefined ? !!updates.refund_enabled : null,
        updates.private_message_access_cost !== undefined ? parseInt(updates.private_message_access_cost, 10) : null,
        current.id || 1,
      ]
    );
    return res.rows[0] || current;
  }

  async recordConnectTransaction({
    userId,
    transactionType,
    amount,
    previousBalance,
    newBalance,
    relatedUserId = null,
    relatedConversationId = null,
    paymentReference = null,
    status = 'COMPLETED',
    description = '',
    client = null,
  }) {
    const db = client || pool;
    const txRes = await db.query(
      `INSERT INTO connect_transactions (
         user_id, transaction_type, amount, previous_balance, new_balance,
         related_user_id, related_conversation_id, payment_reference, status, description, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id`,
      [
        userId,
        transactionType,
        amount,
        previousBalance,
        newBalance,
        relatedUserId,
        relatedConversationId,
        paymentReference,
        status,
        description,
      ]
    );

    await db.query(
      `INSERT INTO credit_logs (user_id, action, credits_delta, balance_after, related_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, transactionType.toLowerCase(), -Math.abs(amount), newBalance, relatedConversationId, description]
    ).catch(() => {});

    return txRes.rows[0]?.id || null;
  }

  async evaluateConversationExpiration(conv, config = null) {
    if (!conv) return null;
    const cfg = config || (await this.getAdminConfig());
    const commType = conv.communication_type === 'private_message' ? 'private_message' : 'chat';
    const now = Date.now();

    let isExpired = String(conv.session_status).toUpperCase() === 'EXPIRED';

    if (!isExpired) {
      if (conv.expires_at) {
        if (now >= new Date(conv.expires_at).getTime()) {
          isExpired = true;
        }
      } else if (commType === 'private_message') {
        const started = new Date(conv.session_started_at || conv.created_at || now).getTime();
        const expiryMs = (cfg.private_message_expiry_hours || 72) * 3600 * 1000;
        if (now - started >= expiryMs) {
          isExpired = true;
        }
      } else {
        // Chat: expires after 1 hour (chat_expiry_minutes) of no female message
        const refTime = new Date(conv.last_female_message_at || conv.session_started_at || conv.created_at || now).getTime();
        const expiryMs = (cfg.chat_expiry_minutes || 60) * 60 * 1000;
        if (now - refTime >= expiryMs) {
          isExpired = true;
        }
      }

      if (isExpired) {
        await pool.query(
          `UPDATE conversations SET session_status = 'EXPIRED', male_unlocked = false WHERE id = $1`,
          [conv.id]
        );
        conv.session_status = 'EXPIRED';
        conv.male_unlocked = false;
      }
    }

    return conv;
  }

  async getConversations(userId, communicationType = null, includeExpired = false) {
    const [viewerRes, config, rawConvs] = await Promise.all([
      pool.query('SELECT id, COALESCE(verified_gender, gender) AS gender, connect_credits FROM users WHERE id = $1', [userId]),
      this.getAdminConfig(),
      conversationRepo.getUserConversations(userId, communicationType),
    ]);
    const viewer = viewerRes.rows[0] || {};
    const isMale = String(viewer.gender || '').toLowerCase() === 'male';

    const evaluated = [];
    for (const c of rawConvs) {
      await this.evaluateConversationExpiration(c, config);
      const commType = c.communication_type === 'private_message' ? 'private_message' : 'chat';
      const isLockedForMale =
        isMale &&
        c.last_sender_id !== userId &&
        (commType === 'private_message'
          ? (c.locked_count > 0 || !c.last_message_unlocked)
          : (!c.male_unlocked || c.locked_count > 0 || !c.last_message_unlocked));

      const accessCost =
        commType === 'private_message'
          ? (config.private_message_access_cost ?? 5)
          : (config.chat_message_access_cost ?? 5);

      evaluated.push({
        ...c,
        last_message: isLockedForMale
          ? commType === 'private_message'
            ? '🔒 Message Locked — View with Connects'
            : '[Blurred Message — Unlock with Connects]'
          : c.last_message,
        is_blurred: isLockedForMale,
        is_locked: isLockedForMale,
        required_connects: isLockedForMale ? accessCost : 0,
        user_connects: viewer.connect_credits ?? 0,
      });
    }

    // Filter out expired/closed/inactive conversations unless includeExpired is explicitly true
    const filtered = includeExpired
      ? evaluated
      : evaluated.filter((c) => {
          const st = String(c.session_status || 'ACTIVE').toUpperCase();
          if (st !== 'ACTIVE') return false;
          if (c.expires_at && new Date(c.expires_at).getTime() <= Date.now()) return false;
          return true;
        });

    // Deduplicate so each other_user_id appears at most once in the conversation list
    const seenUsers = new Set();
    const deduplicated = [];
    for (const c of filtered) {
      const key = String(c.other_user_id);
      if (!seenUsers.has(key)) {
        seenUsers.add(key);
        deduplicated.push(c);
      }
    }

    return deduplicated;
  }

  async validateParticipants(userId, otherUserId) {
    if (Number(userId) === Number(otherUserId)) {
      const err = new Error('You cannot message yourself.');
      err.statusCode = 400;
      throw err;
    }

    const blocked = await reportRepo.isBlocked(userId, otherUserId);
    if (blocked) {
      const err = new Error('Cannot communicate with this user (blocked).');
      err.statusCode = 403;
      err.code = 'USER_BLOCKED';
      throw err;
    }

    const [senderRes, receiverRes] = await Promise.all([
      pool.query(
        `SELECT id, username, gender, selected_gender, verified_gender, verification_status,
                profile_completed, connect_required_for_chat, connect_credits
         FROM users WHERE id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT id, username, gender, selected_gender, verified_gender, is_active
         FROM users WHERE id = $1`,
        [otherUserId]
      ),
    ]);

    const sender = senderRes.rows[0];
    const receiver = receiverRes.rows[0];
    if (!sender) {
      const err = new Error('Sender account not found.');
      err.statusCode = 404;
      throw err;
    }
    if (!receiver || !receiver.is_active) {
      const err = new Error('Recipient account not found.');
      err.statusCode = 404;
      throw err;
    }

    if (!['verified', 'VERIFIED'].includes(sender.verification_status)) {
      const err = new Error('You must complete AI selfie verification before using chat.');
      err.statusCode = 403;
      err.code = 'VERIFICATION_REQUIRED';
      err.redirect = '/verify';
      throw err;
    }

    if (!sender.profile_completed) {
      const err = new Error('Please complete and save your profile before initiating chat.');
      err.statusCode = 403;
      err.code = 'PROFILE_INCOMPLETE';
      err.redirect = '/profile';
      throw err;
    }

    const senderGender = (sender.verified_gender || sender.selected_gender || sender.gender || '').toLowerCase();
    const receiverGender = (receiver.verified_gender || receiver.selected_gender || receiver.gender || '').toLowerCase();
    if (senderGender && receiverGender && senderGender === receiverGender) {
      const err = new Error('Gender-based communication rule: You can only message opposite-gender profiles.');
      err.statusCode = 403;
      throw err;
    }

    return { sender, receiver, senderGender, receiverGender };
  }

  async startSession(userId, targetUserId, communicationType = 'chat') {
    const commType = communicationType === 'private_message' ? 'private_message' : 'chat';
    const { sender, senderGender } = await this.validateParticipants(userId, targetUserId);
    const config = await this.getAdminConfig();

    const expiryDate =
      commType === 'private_message'
        ? new Date(Date.now() + (config.private_message_expiry_hours || 72) * 3600 * 1000)
        : new Date(Date.now() + (config.chat_expiry_minutes || 60) * 60 * 1000);

    let conv = await conversationRepo.findByPair(userId, targetUserId, commType);
    if (conv) {
      await this.evaluateConversationExpiration(conv, config);
    }

    // Female User: 0 Connects required
    if (senderGender === 'female') {
      if (!conv) {
        conv = await conversationRepo.findOrCreate(userId, targetUserId, commType, {
          expiresAt: expiryDate,
          maleUnlocked: false,
          lastFemaleMessageAt: new Date(),
        });
      } else {
        const upd = await pool.query(
          `UPDATE conversations
           SET session_status = 'ACTIVE',
               last_female_message_at = NOW(),
               expires_at = $1
           WHERE id = $2 RETURNING *`,
          [expiryDate, conv.id]
        );
        conv = upd.rows[0];
      }
      return {
        conversation: conv,
        communication_type: commType,
        credits_charged: 0,
        remaining_credits: sender.connect_credits || 0,
        config,
      };
    }

    // Male User
    if (conv && String(conv.session_status).toUpperCase() === 'ACTIVE' && conv.male_unlocked) {
      return {
        conversation: conv,
        communication_type: commType,
        credits_charged: 0,
        remaining_credits: sender.connect_credits || 0,
        already_active: true,
        config,
      };
    }

    if (conv && String(conv.session_status).toUpperCase() === 'EXPIRED') {
      return this.reinitiateSession(userId, targetUserId, commType);
    }

    const cost = commType === 'private_message' ? config.private_message_start_cost : config.chat_start_cost;
    const txType = commType === 'private_message' ? 'PRIVATE_MESSAGE_START' : 'CHAT_START';
    const currentCredits = sender.connect_credits || 0;

    if (currentCredits < cost) {
      const err = new Error(
        `Insufficient Connects. Starting ${commType === 'private_message' ? 'Private Messages' : 'Chat'} requires ${cost} Connects (you have ${currentCredits}).`
      );
      err.statusCode = 402;
      err.code = 'CONNECT_REQUIRED';
      err.redirect = '/purchase-connect';
      err.required_connects = cost;
      err.credits = currentCredits;
      throw err;
    }

    const deductRes = await pool.query(
      `UPDATE users SET connect_credits = GREATEST(0, connect_credits - $1), updated_at = NOW() WHERE id = $2 RETURNING connect_credits`,
      [cost, userId]
    );
    const newBalance = deductRes.rows[0]?.connect_credits ?? currentCredits - cost;

    if (!conv) {
      conv = await conversationRepo.findOrCreate(userId, targetUserId, commType, {
        expiresAt: expiryDate,
        maleUnlocked: true,
        lastFemaleMessageAt: new Date(),
      });
    } else {
      const upd = await pool.query(
        `UPDATE conversations
         SET session_status = 'ACTIVE',
             session_started_at = NOW(),
             last_female_message_at = COALESCE(last_female_message_at, NOW()),
             expires_at = $1,
             male_unlocked = true
         WHERE id = $2 RETURNING *`,
        [expiryDate, conv.id]
      );
      conv = upd.rows[0];
    }

    await pool.query(`UPDATE messages SET is_unlocked = true WHERE conversation_id = $1`, [conv.id]);

    const txId = await this.recordConnectTransaction({
      userId,
      transactionType: txType,
      amount: cost,
      previousBalance: currentCredits,
      newBalance,
      relatedUserId: targetUserId,
      relatedConversationId: conv.id,
      description: commType === 'private_message' ? 'Started 72-hour Private Messages session' : 'Started Chat session',
    });

    if (commType === 'private_message') {
      await pool.query(
        `INSERT INTO private_message_access (user_id, message_id, conversation_id, connect_cost, transaction_id, granted_at)
         SELECT $1, id, $2, $3, $4, NOW()
         FROM messages
         WHERE conversation_id = $2 AND sender_id = $5
         ON CONFLICT (user_id, message_id) DO NOTHING`,
        [userId, conv.id, cost, txId, targetUserId]
      ).catch(() => {});
    }

    return {
      conversation: conv,
      communication_type: commType,
      transaction_type: txType,
      credits_charged: cost,
      remaining_credits: newBalance,
      config,
    };
  }

  async reinitiateSession(userId, targetUserId, communicationType = 'chat') {
    const commType = communicationType === 'private_message' ? 'private_message' : 'chat';
    const { sender, senderGender } = await this.validateParticipants(userId, targetUserId);
    const config = await this.getAdminConfig();

    const expiryDate =
      commType === 'private_message'
        ? new Date(Date.now() + (config.private_message_expiry_hours || 72) * 3600 * 1000)
        : new Date(Date.now() + (config.chat_expiry_minutes || 60) * 60 * 1000);

    let conv = await conversationRepo.findOrCreate(userId, targetUserId, commType, {
      expiresAt: expiryDate,
      maleUnlocked: senderGender === 'male',
      lastFemaleMessageAt: new Date(),
    });

    if (senderGender === 'female') {
      const upd = await pool.query(
        `UPDATE conversations
         SET session_status = 'ACTIVE',
             session_started_at = NOW(),
             last_female_message_at = NOW(),
             expires_at = $1
         WHERE id = $2 RETURNING *`,
        [expiryDate, conv.id]
      );
      return {
        conversation: upd.rows[0],
        communication_type: commType,
        credits_charged: 0,
        remaining_credits: sender.connect_credits || 0,
        reinitiated: true,
        config,
      };
    }

    const cost = commType === 'private_message' ? config.private_message_reinitiate_cost : config.chat_reinitiate_cost;
    const txType = commType === 'private_message' ? 'PRIVATE_MESSAGE_REINITIATE' : 'CHAT_REINITIATE';
    const currentCredits = sender.connect_credits || 0;

    if (currentCredits < cost) {
      const err = new Error(
        `Insufficient Connects. Reinitiating ${commType === 'private_message' ? 'Private Messages' : 'Chat'} requires ${cost} Connects (you have ${currentCredits}).`
      );
      err.statusCode = 402;
      err.code = 'CONNECT_REQUIRED';
      err.redirect = '/purchase-connect';
      err.required_connects = cost;
      err.credits = currentCredits;
      throw err;
    }

    const deductRes = await pool.query(
      `UPDATE users SET connect_credits = GREATEST(0, connect_credits - $1), updated_at = NOW() WHERE id = $2 RETURNING connect_credits`,
      [cost, userId]
    );
    const newBalance = deductRes.rows[0]?.connect_credits ?? currentCredits - cost;

    const upd = await pool.query(
      `UPDATE conversations
       SET session_status = 'ACTIVE',
           session_started_at = NOW(),
           last_female_message_at = NOW(),
           expires_at = $1,
           male_unlocked = true
       WHERE id = $2 RETURNING *`,
      [expiryDate, conv.id]
    );
    conv = upd.rows[0];

    await pool.query(`UPDATE messages SET is_unlocked = true WHERE conversation_id = $1`, [conv.id]);

    const txId = await this.recordConnectTransaction({
      userId,
      transactionType: txType,
      amount: cost,
      previousBalance: currentCredits,
      newBalance,
      relatedUserId: targetUserId,
      relatedConversationId: conv.id,
      description: commType === 'private_message' ? 'Reinitiated expired Private Messages session (72h)' : 'Reinitiated expired Chat session',
    });

    if (commType === 'private_message') {
      await pool.query(
        `INSERT INTO private_message_access (user_id, message_id, conversation_id, connect_cost, transaction_id, granted_at)
         SELECT $1, id, $2, $3, $4, NOW()
         FROM messages
         WHERE conversation_id = $2 AND sender_id = $5
         ON CONFLICT (user_id, message_id) DO NOTHING`,
        [userId, conv.id, cost, txId, targetUserId]
      ).catch(() => {});
    }

    return {
      conversation: conv,
      communication_type: commType,
      transaction_type: txType,
      credits_charged: cost,
      remaining_credits: newBalance,
      reinitiated: true,
      config,
    };
  }

  async unlockMessages(userId, targetUserId = null, conversationId = null, messageId = null, communicationType = null) {
    const config = await this.getAdminConfig();

    let targetMsg = null;
    if (messageId) {
      const msgRes = await pool.query('SELECT * FROM messages WHERE id = $1', [messageId]);
      targetMsg = msgRes.rows[0] || null;
      if (!targetMsg) {
        const err = new Error('Message not found.');
        err.statusCode = 404;
        throw err;
      }
      if (!conversationId) conversationId = targetMsg.conversation_id;
      if (!targetUserId) {
        targetUserId = Number(targetMsg.sender_id) === Number(userId) ? targetMsg.receiver_id : targetMsg.sender_id;
      }
      if (!communicationType && targetMsg.communication_type) {
        communicationType = targetMsg.communication_type;
      }
    }

    let conv = null;
    if (conversationId) {
      conv = await conversationRepo.findById(conversationId);
    }
    if (!conv && targetUserId) {
      if (communicationType) {
        conv = await conversationRepo.findByPair(userId, targetUserId, communicationType);
      } else {
        conv =
          (await conversationRepo.findByPair(userId, targetUserId, 'private_message')) ||
          (await conversationRepo.findByPair(userId, targetUserId, 'chat'));
      }
    }

    if (!conv) {
      const err = new Error('Conversation not found.');
      err.statusCode = 404;
      throw err;
    }

    if (Number(conv.user1_id) !== Number(userId) && Number(conv.user2_id) !== Number(userId)) {
      const err = new Error('Access denied: You are not a participant in this conversation.');
      err.statusCode = 403;
      throw err;
    }

    const otherUserId = Number(conv.user1_id) === Number(userId) ? conv.user2_id : conv.user1_id;
    const { sender, senderGender } = await this.validateParticipants(userId, otherUserId);
    const commType = (communicationType || conv.communication_type || 'chat') === 'private_message' ? 'private_message' : 'chat';

    if (senderGender === 'female') {
      const messages = await messageRepo.getMessages(conv.id, 100, 0);
      return {
        unlocked: true,
        communication_type: commType,
        credits_charged: 0,
        remaining_credits: sender.connect_credits || 0,
        messages,
      };
    }

    // Check if already unlocked / authorized to prevent duplicate Connect deduction
    if (commType === 'private_message') {
      let alreadyAuthorized = false;
      if (messageId) {
        const authCheck = await pool.query(
          `SELECT id FROM private_message_access WHERE user_id = $1 AND message_id = $2 LIMIT 1`,
          [userId, messageId]
        );
        if (authCheck.rows.length > 0 || (targetMsg && targetMsg.is_unlocked === true)) {
          alreadyAuthorized = true;
        }
      } else {
        const lockedRes = await pool.query(
          `SELECT id FROM messages
           WHERE conversation_id = $1
             AND sender_id = $2
             AND COALESCE(is_unlocked, true) = false
             AND id NOT IN (SELECT message_id FROM private_message_access WHERE user_id = $3)
           LIMIT 1`,
          [conv.id, otherUserId, userId]
        );
        if (lockedRes.rows.length === 0) {
          alreadyAuthorized = true;
        }
      }

      if (alreadyAuthorized) {
        const data = await this.getMessagesWithUser(userId, otherUserId, commType, 100, 0);
        return {
          unlocked: true,
          already_authorized: true,
          conversation: conv,
          communication_type: commType,
          credits_charged: 0,
          remaining_credits: sender.connect_credits || 0,
          message: targetMsg ? { ...targetMsg, is_unlocked: true, is_locked: false, is_blurred: false } : null,
          messages: data.messages,
          config,
        };
      }
    } else {
      // Chat mode: check if already unlocked and no locked incoming messages remain
      const lockedChatRes = await pool.query(
        `SELECT id FROM messages
         WHERE conversation_id = $1 AND sender_id = $2 AND COALESCE(is_unlocked, true) = false
         LIMIT 1`,
        [conv.id, otherUserId]
      );
      if (conv.male_unlocked && lockedChatRes.rows.length === 0) {
        const data = await this.getMessagesWithUser(userId, otherUserId, commType, 100, 0);
        return {
          unlocked: true,
          already_authorized: true,
          conversation: conv,
          communication_type: commType,
          credits_charged: 0,
          remaining_credits: sender.connect_credits || 0,
          messages: data.messages,
          config,
        };
      }
    }

    const cost =
      commType === 'private_message'
        ? (config.private_message_access_cost ?? 5)
        : (config.chat_message_access_cost ?? 5);
    const txType = commType === 'private_message' ? 'PRIVATE_MESSAGE_VIEW' : 'CHAT_MESSAGE_ACCESS';

    const client = await pool.connect();
    let newBalance = sender.connect_credits || 0;
    let txId = null;

    try {
      await client.query('BEGIN');

      const userLockRes = await client.query(
        'SELECT connect_credits FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );
      const currentCredits = userLockRes.rows[0]?.connect_credits ?? 0;

      // Re-verify inside transaction that message wasn't unlocked concurrently
      if (commType === 'private_message' && messageId) {
        const concurrentCheck = await client.query(
          `SELECT id FROM private_message_access WHERE user_id = $1 AND message_id = $2 LIMIT 1`,
          [userId, messageId]
        );
        if (concurrentCheck.rows.length > 0) {
          await client.query('COMMIT');
          const data = await this.getMessagesWithUser(userId, otherUserId, commType, 100, 0);
          return {
            unlocked: true,
            already_authorized: true,
            conversation: conv,
            communication_type: commType,
            credits_charged: 0,
            remaining_credits: currentCredits,
            messages: data.messages,
            config,
          };
        }
      }

      if (currentCredits < cost) {
        await client.query('ROLLBACK');
        const err = new Error(
          `Insufficient Connects to view message. Required: ${cost} Connects, Available: ${currentCredits} Connects.`
        );
        err.statusCode = 402;
        err.code = 'CONNECT_REQUIRED';
        err.redirect = '/purchase-connect';
        err.required_connects = cost;
        err.available_connects = currentCredits;
        err.credits = currentCredits;
        throw err;
      }

      const deductRes = await client.query(
        `UPDATE users SET connect_credits = GREATEST(0, connect_credits - $1), updated_at = NOW() WHERE id = $2 RETURNING connect_credits`,
        [cost, userId]
      );
      newBalance = deductRes.rows[0]?.connect_credits ?? currentCredits - cost;

      const expiryDate =
        commType === 'private_message'
          ? new Date(Date.now() + (config.private_message_expiry_hours || 72) * 3600 * 1000)
          : new Date(Date.now() + (config.chat_expiry_minutes || 60) * 60 * 1000);

      const upd = await client.query(
        `UPDATE conversations
         SET male_unlocked = true,
             session_status = 'ACTIVE',
             last_female_message_at = COALESCE(last_female_message_at, NOW()),
             expires_at = COALESCE(expires_at, $1)
         WHERE id = $2 RETURNING *`,
        [expiryDate, conv.id]
      );
      conv = upd.rows[0];

      txId = await this.recordConnectTransaction({
        userId,
        transactionType: txType,
        amount: cost,
        previousBalance: currentCredits,
        newBalance,
        relatedUserId: otherUserId,
        relatedConversationId: conv.id,
        description:
          commType === 'private_message'
            ? 'Viewed locked incoming message in Private Messages'
            : 'Unlocked blurred incoming message in Chat',
        client,
      });

      if (commType === 'private_message') {
        await client.query(
          `INSERT INTO private_message_access (user_id, message_id, conversation_id, connect_cost, transaction_id, granted_at)
           SELECT $1, id, $2, $3, $4, NOW()
           FROM messages
           WHERE conversation_id = $2 AND sender_id = $5
           ON CONFLICT (user_id, message_id) DO NOTHING`,
          [userId, conv.id, cost, txId, otherUserId]
        );
      }

      await client.query(`UPDATE messages SET is_unlocked = true WHERE conversation_id = $1`, [conv.id]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    const rawMessages = await messageRepo.getMessages(conv.id, 100, 0);
    const messages = rawMessages.map((m) => ({
      ...m,
      is_unlocked: true,
      is_locked: false,
      is_blurred: false,
    }));
    await messageRepo.markAsRead(conv.id, userId);

    const unlockedMsg = messageId ? messages.find((m) => Number(m.id) === Number(messageId)) || null : null;

    return {
      unlocked: true,
      conversation: conv,
      communication_type: commType,
      transaction_type: txType,
      transaction_id: txId,
      credits_charged: cost,
      remaining_credits: newBalance,
      message: unlockedMsg,
      messages,
      config,
    };
  }

  async getMessagesWithUser(userId, otherUserId, communicationType = 'chat', limit = 50, offset = 0) {
    const commType = communicationType === 'private_message' ? 'private_message' : 'chat';
    const { sender, senderGender } = await this.validateParticipants(userId, otherUserId);
    const config = await this.getAdminConfig();

    let conv = await conversationRepo.findByPair(userId, otherUserId, commType);
    if (!conv) {
      return {
        conversation_id: null,
        conversation: null,
        communication_type: commType,
        session_status: 'NOT_STARTED',
        expires_at: null,
        last_female_message_at: null,
        male_unlocked: senderGender === 'female',
        has_locked_messages: false,
        required_connects: commType === 'private_message' ? config.private_message_start_cost : config.chat_start_cost,
        user_connects: sender.connect_credits || 0,
        config,
        messages: [],
      };
    }

    await this.evaluateConversationExpiration(conv, config);
    const rawMessages = await messageRepo.getMessages(conv.id, limit, offset);

    // Fetch authorized Private Message IDs for this male viewer
    const authorizedMessageIds = new Set();
    if (senderGender === 'male' && commType === 'private_message') {
      const accessRes = await pool.query(
        `SELECT message_id FROM private_message_access WHERE user_id = $1 AND conversation_id = $2`,
        [userId, conv.id]
      ).catch(() => ({ rows: [] }));
      for (const r of accessRes.rows) {
        authorizedMessageIds.add(Number(r.message_id));
      }
    }

    const accessCost =
      commType === 'private_message'
        ? (config.private_message_access_cost ?? 5)
        : (config.chat_message_access_cost ?? 5);

    let hasLockedMessages = false;
    const sanitizedMessages = rawMessages.map((msg) => {
      const isFromOther = Number(msg.sender_id) !== Number(userId);
      const isLockedForMale =
        senderGender === 'male' &&
        isFromOther &&
        (commType === 'private_message'
          ? msg.is_unlocked === false && !authorizedMessageIds.has(Number(msg.id))
          : !conv.male_unlocked || msg.is_unlocked === false);

      if (isLockedForMale) {
        hasLockedMessages = true;
        return {
          ...msg,
          content: null,
          media_url: null,
          is_locked: true,
          is_blurred: true,
          required_connects: accessCost,
          user_connects: sender.connect_credits || 0,
        };
      }
      return {
        ...msg,
        is_locked: false,
        is_blurred: false,
      };
    });

    if (!hasLockedMessages) {
      await messageRepo.markAsRead(conv.id, userId);
    }

    return {
      conversation_id: conv.id,
      conversation: conv,
      communication_type: commType,
      session_status: conv.session_status || 'ACTIVE',
      expires_at: conv.expires_at,
      last_female_message_at: conv.last_female_message_at,
      male_unlocked: senderGender === 'female' ? true : !!conv.male_unlocked && !hasLockedMessages,
      is_locked: hasLockedMessages,
      has_locked_messages: hasLockedMessages,
      required_connects: hasLockedMessages
        ? accessCost
        : String(conv.session_status).toUpperCase() === 'EXPIRED'
          ? commType === 'private_message'
            ? config.private_message_reinitiate_cost
            : config.chat_reinitiate_cost
          : commType === 'private_message'
            ? config.private_message_start_cost
            : config.chat_start_cost,
      user_connects: sender.connect_credits || 0,
      config,
      messages: sanitizedMessages,
    };
  }

  async getMessages(conversationId, userId, limit = 50, offset = 0) {
    const conv = await conversationRepo.findById(conversationId);
    if (!conv || (conv.user1_id !== userId && conv.user2_id !== userId)) {
      const err = new Error('Conversation not found or access denied.');
      err.statusCode = 404;
      throw err;
    }
    const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
    const data = await this.getMessagesWithUser(userId, otherUserId, conv.communication_type || 'chat', limit, offset);
    return data.messages;
  }

  async sendMessage(
    senderId,
    receiverId,
    content,
    messageType = 'text',
    mediaUrl = null,
    communicationType = 'chat'
  ) {
    const commType = communicationType === 'private_message' ? 'private_message' : 'chat';
    const { sender, senderGender } = await this.validateParticipants(senderId, receiverId);
    const config = await this.getAdminConfig();

    let conv = await conversationRepo.findByPair(senderId, receiverId, commType);
    if (conv) {
      await this.evaluateConversationExpiration(conv, config);
    }

    let creditsCharged = 0;
    let remainingCredits = sender.connect_credits || 0;
    let transactionType = null;

    if (senderGender === 'female') {
      // Female user: 0 Connects required!
      const expiryDate =
        commType === 'private_message'
          ? new Date(Date.now() + (config.private_message_expiry_hours || 72) * 3600 * 1000)
          : new Date(Date.now() + (config.chat_expiry_minutes || 60) * 60 * 1000);

      if (!conv) {
        conv = await conversationRepo.findOrCreate(senderId, receiverId, commType, {
          expiresAt: expiryDate,
          maleUnlocked: false,
          lastFemaleMessageAt: new Date(),
        });
      } else {
        // Female message resets the 1-hour inactivity timer in Chat (and keeps session ACTIVE)
        const nextExpires = commType === 'chat' ? expiryDate : conv.expires_at || expiryDate;
        const upd = await pool.query(
          `UPDATE conversations
           SET session_status = 'ACTIVE',
               last_female_message_at = NOW(),
               expires_at = $1
           WHERE id = $2 RETURNING *`,
          [nextExpires, conv.id]
        );
        conv = upd.rows[0];
      }

      // In Private Messages, a female message is ALWAYS locked until the male user unlocks it with Connects (unless access cost <= 0).
      // In Chat, a female message is locked if the male user has not unlocked the Chat session yet.
      const isUnlocked =
        commType === 'private_message'
          ? (config.private_message_access_cost ?? 5) <= 0
          : !!conv.male_unlocked;

      const message = await messageRepo.createMessage({
        conversationId: conv.id,
        senderId,
        receiverId,
        content,
        messageType,
        mediaUrl,
        communicationType: commType,
        isUnlocked,
      });

      await pool.query(
        `INSERT INTO notifications (user_id, related_user_id, related_id, type, title, body, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
        [
          receiverId,
          senderId,
          conv.id,
          commType === 'private_message' ? 'PRIVATE_MESSAGE' : 'CHAT_MESSAGE',
          commType === 'private_message' ? 'New Private Message' : 'New Chat Message',
          `${sender.username || 'Someone'} sent you a ${commType === 'private_message' ? 'Private Message' : 'Chat message'}.`,
        ]
      ).catch(() => {});

      return {
        conversation: conv,
        communication_type: commType,
        message,
        credits_charged: 0,
        remaining_credits: remainingCredits,
        connect_required_for_chat: false,
        config,
      };
    }

    // Male sender
    if (conv && String(conv.session_status).toUpperCase() === 'EXPIRED') {
      const reinitCost =
        commType === 'private_message' ? config.private_message_reinitiate_cost : config.chat_reinitiate_cost;
      const err = new Error(
        `This ${commType === 'private_message' ? 'Private Message session (72h)' : 'Chat session (1h inactivity)'} has expired. Reinitiate for ${reinitCost} Connects to continue.`
      );
      err.statusCode = 403;
      err.code = commType === 'private_message' ? 'PRIVATE_MESSAGE_EXPIRED' : 'CHAT_EXPIRED';
      err.reinitiate_cost = reinitCost;
      err.credits = remainingCredits;
      throw err;
    }

    if (!conv || !conv.male_unlocked) {
      // Check if there are locked female messages waiting in this conversation
      let hasLockedFemaleMsg = false;
      if (conv) {
        const lockedCheck = await pool.query(
          `SELECT id FROM messages WHERE conversation_id = $1 AND sender_id = $2 AND COALESCE(is_unlocked, true) = false LIMIT 1`,
          [conv.id, receiverId]
        );
        hasLockedFemaleMsg = lockedCheck.rows.length > 0;
      }

      const cost =
        commType === 'private_message'
          ? hasLockedFemaleMsg
            ? (config.private_message_access_cost ?? 5)
            : config.private_message_start_cost
          : hasLockedFemaleMsg
            ? config.chat_message_access_cost
            : config.chat_start_cost;

      transactionType =
        commType === 'private_message'
          ? hasLockedFemaleMsg
            ? 'PRIVATE_MESSAGE_VIEW'
            : 'PRIVATE_MESSAGE_START'
          : hasLockedFemaleMsg
            ? 'CHAT_MESSAGE_ACCESS'
            : 'CHAT_START';

      if (remainingCredits < cost) {
        const err = new Error(
          `Insufficient Connects. ${
            commType === 'private_message' ? 'Private Messages' : 'Chat'
          } requires ${cost} Connects (you have ${remainingCredits}). Please buy Connects.`
        );
        err.statusCode = 402;
        err.code = 'CONNECT_REQUIRED';
        err.redirect = '/purchase-connect';
        err.required_connects = cost;
        err.credits = remainingCredits;
        throw err;
      }

      creditsCharged = cost;
      const deductRes = await pool.query(
        `UPDATE users SET connect_credits = GREATEST(0, connect_credits - $1), updated_at = NOW() WHERE id = $2 RETURNING connect_credits`,
        [cost, senderId]
      );
      remainingCredits = deductRes.rows[0]?.connect_credits ?? remainingCredits - cost;

      const expiryDate =
        commType === 'private_message'
          ? new Date(Date.now() + (config.private_message_expiry_hours || 72) * 3600 * 1000)
          : new Date(Date.now() + (config.chat_expiry_minutes || 60) * 60 * 1000);

      if (!conv) {
        conv = await conversationRepo.findOrCreate(senderId, receiverId, commType, {
          expiresAt: expiryDate,
          maleUnlocked: true,
          lastFemaleMessageAt: new Date(),
        });
      } else {
        const upd = await pool.query(
          `UPDATE conversations
           SET session_status = 'ACTIVE',
               session_started_at = COALESCE(session_started_at, NOW()),
               last_female_message_at = COALESCE(last_female_message_at, NOW()),
               expires_at = COALESCE(expires_at, $1),
               male_unlocked = true
           WHERE id = $2 RETURNING *`,
          [expiryDate, conv.id]
        );
        conv = upd.rows[0];
      }

      await pool.query(`UPDATE messages SET is_unlocked = true WHERE conversation_id = $1`, [conv.id]);

      const txId = await this.recordConnectTransaction({
        userId: senderId,
        transactionType,
        amount: cost,
        previousBalance: sender.connect_credits || 0,
        newBalance: remainingCredits,
        relatedUserId: receiverId,
        relatedConversationId: conv.id,
        description:
          commType === 'private_message'
            ? hasLockedFemaleMsg
              ? 'Viewed incoming Private Message'
              : 'Started 72-hour Private Messages session'
            : hasLockedFemaleMsg
              ? 'Unlocked incoming Chat message'
              : 'Started Chat session',
      });

      if (commType === 'private_message') {
        await pool.query(
          `INSERT INTO private_message_access (user_id, message_id, conversation_id, connect_cost, transaction_id, granted_at)
           SELECT $1, id, $2, $3, $4, NOW()
           FROM messages
           WHERE conversation_id = $2 AND sender_id = $5
           ON CONFLICT (user_id, message_id) DO NOTHING`,
          [senderId, conv.id, cost, txId, receiverId]
        ).catch(() => {});
      }
    }

    // Note: When a male sends a message in an active Chat, we intentionally DO NOT
    // reset last_female_message_at or expires_at, because Chat expiration depends strictly
    // on the 1-hour female inactivity rule!
    const message = await messageRepo.createMessage({
      conversationId: conv.id,
      senderId,
      receiverId,
      content,
      messageType,
      mediaUrl,
      communicationType: commType,
      isUnlocked: true,
    });

    await pool.query(
      `INSERT INTO notifications (user_id, related_user_id, related_id, type, title, body, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
      [
        receiverId,
        senderId,
        conv.id,
        commType === 'private_message' ? 'PRIVATE_MESSAGE' : 'CHAT_MESSAGE',
        commType === 'private_message' ? 'New Private Message' : 'New Chat Message',
        `${sender.username || 'Someone'} sent you a ${commType === 'private_message' ? 'Private Message' : 'Chat message'}.`,
      ]
    ).catch(() => {});

    return {
      conversation: conv,
      communication_type: commType,
      transaction_type: transactionType,
      message,
      credits_charged: creditsCharged,
      remaining_credits: remainingCredits,
      connect_required_for_chat: true,
      config,
    };
  }

  async findOrCreateConversation(userId, otherUserId, communicationType = 'chat') {
    return conversationRepo.findOrCreate(userId, otherUserId, communicationType);
  }

  async markRead(conversationId, userId) {
    await messageRepo.markAsRead(conversationId, userId);
  }

  async deleteConversation(conversationId, userId) {
    return conversationRepo.delete(conversationId, userId);
  }
}

module.exports = new ChatService();
