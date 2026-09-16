'use strict';

const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { onlineUsers } = require('../socket');

const router = express.Router();

router.use(verifyToken);

// ─── GET /conversations ───────────────────────────────────────────────────────

router.get('/conversations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.id AS conversation_id,
         c.created_at AS conversation_created_at,
         CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS other_user_id,
         other_u.username AS other_username,
         other_u.profile_photo AS other_photo,
         other_u.is_online AS other_is_online,
         other_u.last_seen AS other_last_seen,
         other_u.verification_status AS other_verification_status,
         lm.content AS last_message,
         lm.sender_id AS last_message_sender_id,
         lm.created_at AS last_message_at,
         lm.message_type AS last_message_type,
         (
           SELECT COUNT(*)
           FROM messages m2
           WHERE m2.conversation_id = c.id
             AND m2.sender_id != $1
             AND m2.is_read = false
             
         ) AS unread_count
       FROM conversations c
       JOIN users other_u ON other_u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
       LEFT JOIN messages lm ON lm.id = c.last_message_id
       WHERE (c.user1_id = $1 OR c.user2_id = $1)
         
       ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
      [req.user.id]
    );

    const conversations = result.rows.map((conversation) => ({
      ...conversation,
      other_is_online: onlineUsers.has(Number(conversation.other_user_id)),
    }));

    return res.status(200).json({ success: true, conversations });
  } catch (err) {
    console.error('[MSG] /conversations error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching conversations.' });
  }
});

// ─── GET /:userId ─────────────────────────────────────────────────────────────

router.get('/:userId', async (req, res) => {
  const client = await pool.connect();
  try {
    const otherUserId = parseInt(req.params.userId, 10);
    if (isNaN(otherUserId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const offset = (page - 1) * limit;

    await client.query('BEGIN');

    // Find or create conversation
    let convResult = await client.query(
      `SELECT id FROM conversations
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
         `,
      [req.user.id, otherUserId]
    );

    let conversationId;
    if (convResult.rows.length === 0) {
      // Verify other user exists
      const otherUser = await client.query(
        `SELECT id FROM users WHERE id = $1  AND is_banned = false`,
        [otherUserId]
      );
      if (otherUser.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const newConv = await client.query(
        `INSERT INTO conversations (user1_id, user2_id, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        [req.user.id, otherUserId]
      );
      conversationId = newConv.rows[0].id;
    } else {
      conversationId = convResult.rows[0].id;
    }

    // Check for unread messages
    const unreadMsgs = await client.query(
      `SELECT m.id, u.gender 
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1 AND m.sender_id = $2 AND m.is_read = false`,
      [conversationId, otherUserId]
    );

    if (unreadMsgs.rows.length > 0) {
      const senderGender = unreadMsgs.rows[0].gender;
      if (req.user.gender === 'male' && senderGender === 'female') {
        const creditCheck = await client.query(
          `SELECT connect_credits as credits FROM users WHERE id = $1 FOR UPDATE`,
          [req.user.id]
        );
        const currentCredits = creditCheck.rows[0]?.credits || 0;
        if (currentCredits < 5) {
          await client.query('ROLLBACK');
          return res.status(402).json({
            success: false,
            message: 'Insufficient credits to view new messages from this user. Costs 5 credits.',
            credits: currentCredits,
          });
        }
        
        await client.query(`UPDATE users SET connect_credits = connect_credits - 5, updated_at = NOW() WHERE id = $1`, [req.user.id]);
        await client.query(
          `INSERT INTO credit_logs (user_id, action, credits_delta, balance_after, description, created_at)
           VALUES ($1, 'message_read', -5, $2, 'Read message from female', NOW())`,
          [req.user.id, currentCredits - 5]
        );
      }
      
      // Mark as read
      await client.query(
        `UPDATE messages
         SET is_read = true, read_at = NOW()
         WHERE conversation_id = $1 AND sender_id = $2 AND is_read = false`,
        [conversationId, otherUserId]
      );
    }

    await client.query('COMMIT');

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM messages
       WHERE conversation_id = $1 `,
      [conversationId]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const messages = await pool.query(
      `SELECT m.id, m.sender_id, m.content, m.message_type, m.is_read,
              m.created_at, m.read_at,
              u.username AS sender_username, u.profile_photo AS sender_photo
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1 
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );

    return res.status(200).json({
      success: true,
      conversation_id: conversationId,
      messages: messages.rows.reverse(),
      total,
      pages,
      page,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MSG] /:userId error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching messages.' });
  } finally {
    client.release();
  }
});

// ─── POST /send ───────────────────────────────────────────────────────────────

router.post('/send', async (req, res) => {
  const client = await pool.connect();
  try {
    const { receiver_id, content, message_type } = req.body;
    const receiverId = parseInt(receiver_id, 10);
    let creditsRemaining;

    if (!receiverId || !content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'receiver_id and content are required.' });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself.' });
    }

    await client.query('BEGIN');

    // Verify receiver exists
    const receiverResult = await client.query(
      `SELECT id FROM users WHERE id = $1  AND is_banned = false`,
      [receiverId]
    );
    if (receiverResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Receiver not found.' });
    }

    // Find or create conversation
    let convResult = await client.query(
      `SELECT id FROM conversations
       WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))`,
      [req.user.id, receiverId]
    );

    let conversationId;
    let isFirstMessage = false;
    
    if (convResult.rows.length === 0) {
      const newConv = await client.query(
        `INSERT INTO conversations (user1_id, user2_id, created_at)
         VALUES ($1, $2, NOW()) RETURNING id`,
        [req.user.id, receiverId]
      );
      conversationId = newConv.rows[0].id;
      isFirstMessage = true;
    } else {
      conversationId = convResult.rows[0].id;
      // Check if male has sent any message in this conversation before
      if (req.user.gender === 'male') {
        const msgCheck = await client.query(
          `SELECT id FROM messages WHERE conversation_id = $1 AND sender_id = $2 LIMIT 1`,
          [conversationId, req.user.id]
        );
        if (msgCheck.rows.length === 0) {
          isFirstMessage = true;
        }
      }
    }

    // Credit check for males (females send free)
    let creditsCharged = 0;
    if (req.user.gender === 'male') {
      const cost = isFirstMessage ? 5 : 0; // 5 connects for first message, 0 for subsequent
      
      if (cost > 0) {
        const creditResult = await client.query(
          `SELECT connect_credits as credits FROM users WHERE id = $1 FOR UPDATE`,
          [req.user.id]
        );
        const currentCredits = creditResult.rows[0]?.credits || 0;
        if (currentCredits < cost) {
          await client.query('ROLLBACK');
          return res.status(402).json({
            success: false,
            message: `Insufficient credits. Sending your first private message costs ${cost} credits.`,
            credits: currentCredits,
          });
        }
        
        creditsCharged = cost;

        // Deduct credits
        await client.query(
          `UPDATE users SET connect_credits = connect_credits - $1, updated_at = NOW() WHERE id = $2`,
          [cost, req.user.id]
        );

        // Log credit usage
        await client.query(
          `INSERT INTO credit_logs (user_id, action, credits_delta, balance_after, description, created_at)
           VALUES ($1, 'message_sent', $2, $3, 'First message sent', NOW())`,
          [req.user.id, -cost, currentCredits - cost]
        );
      }
    }

    const msgType = message_type || 'text';

    // Insert message
    const msgResult = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read, credits_charged, created_at)
       VALUES ($1, $2, $3, $4, $5, false, $6, NOW())
       RETURNING id, conversation_id, sender_id, receiver_id, content, message_type, is_read, credits_charged, created_at`,
      [conversationId, req.user.id, receiverId, content.trim(), msgType, creditsCharged]
    );

    const savedMessage = msgResult.rows[0];
    const messageId = savedMessage.id;
    const createdAt = savedMessage.created_at;

    // Update conversation last_message_id
    await client.query(
      `UPDATE conversations SET last_message_id = $1, last_message_at = NOW() WHERE id = $2`,
      [messageId, conversationId]
    );

    // Create notification for receiver
    await client.query(
      `INSERT INTO notifications (user_id, type, related_user_id, title, body, is_read, created_at)
       VALUES ($1, 'message', $2, $3, $4, false, NOW())`,
      [receiverId, req.user.id, 'New Message', `You have a new message from ${req.user.username}.`]
    );

    await client.query('COMMIT');

    // Emit socket event (global io attached to app)
    const io = req.app.get('io');
    if (io) {
      const socketMessage = {
        message_id: messageId,
        id: messageId,
        conversation_id: conversationId,
        sender_id: req.user.id,
        receiver_id: receiverId,
        sender_username: req.user.username,
        content: content.trim(),
        message_type: msgType,
        created_at: createdAt,
      };
      io.to(`user_${receiverId}`).emit('new_message', socketMessage);
      io.to(`user_${receiverId}`).emit('receive_message', socketMessage);
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: savedMessage,
      sent_message: savedMessage,
      message_id: messageId,
      conversation_id: conversationId,
      created_at: createdAt,
      remaining_credits: creditsRemaining,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MSG] /send error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error sending message.' });
  } finally {
    client.release();
  }
});

// ─── DELETE /conversation/:userId ─────────────────────────────────────────────

router.delete('/conversation/:userId', async (req, res) => {
  const client = await pool.connect();
  try {
    const otherUserId = parseInt(req.params.userId, 10);
    if (isNaN(otherUserId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    await client.query('BEGIN');

    const convResult = await client.query(
      `SELECT id FROM conversations
       WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))
         `,
      [req.user.id, otherUserId]
    );

    if (convResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const conversationId = convResult.rows[0].id;

    // Soft-delete messages for this user
    await client.query(
      `DELETE FROM messages WHERE conversation_id = $1`,
      [conversationId]
    );

    // Soft-delete conversation
    await client.query(
      `DELETE FROM conversations WHERE id = $1`,
      [conversationId]
    );

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Conversation deleted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MSG] /conversation/:userId DELETE error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error deleting conversation.' });
  } finally {
    client.release();
  }
});

module.exports = router;
