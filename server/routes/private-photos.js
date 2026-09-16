'use strict';

const express = require('express');
const path = require('path');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { uploadPrivate } = require('../middleware/upload');

const router = express.Router();

router.use(verifyToken);

const PRIVATE_ACCESS_COST = 10;

// ─── GET / - Own private photos ───────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, photo_url, created_at
       FROM private_photos
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, photos: result.rows });
  } catch (err) {
    console.error('[PRIVATE] GET / error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── GET /:userId - View another user's private photos ───────────────────────

router.get('/:userId', async (req, res) => {
  try {
    const targetId = parseInt(req.params.userId, 10);
    if (isNaN(targetId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    // Check if access has been granted
    const accessResult = await pool.query(
      `SELECT id, status FROM private_photo_access
       WHERE requester_id = $1 AND owner_id = $2 AND status = 'granted'`,
      [req.user.id, targetId]
    );

    const hasAccess = accessResult.rows.length > 0;

    const photos = await pool.query(
      `SELECT id, photo_url, created_at
       FROM private_photos
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [targetId]
    );

    const formattedPhotos = photos.rows.map((photo) => ({
      id: photo.id,
      photo_url: hasAccess ? photo.photo_url : null,
      is_blurred: !hasAccess,
      created_at: photo.created_at,
    }));

    return res.status(200).json({
      success: true,
      photos: formattedPhotos,
      has_access: hasAccess,
      total: photos.rows.length,
    });
  } catch (err) {
    console.error('[PRIVATE] GET /:userId error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── POST /upload ─────────────────────────────────────────────────────────────

router.post('/upload', uploadPrivate, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded.' });
    }

    const photoUrl = `/uploads/private/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO private_photos (user_id, photo_url, created_at)
       VALUES ($1, $2, NOW())
       RETURNING id, photo_url, created_at`,
      [req.user.id, photoUrl]
    );

    return res.status(201).json({
      success: true,
      message: 'Private photo uploaded.',
      photo: result.rows[0],
    });
  } catch (err) {
    console.error('[PRIVATE] POST /upload error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const photoId = parseInt(req.params.id, 10);
    if (isNaN(photoId)) return res.status(400).json({ success: false, message: 'Invalid photo ID.' });

    const result = await pool.query(
      `UPDATE private_photos SET is_deleted = true
       WHERE id = $1 AND user_id = $2 
       RETURNING id`,
      [photoId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Photo not found.' });
    }

    return res.status(200).json({ success: true, message: 'Photo deleted.' });
  } catch (err) {
    console.error('[PRIVATE] DELETE /:id error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─── POST /request-access/:userId ─────────────────────────────────────────────

router.post('/request-access/:userId', async (req, res) => {
  const client = await pool.connect();
  try {
    const ownerId = parseInt(req.params.userId, 10);
    if (isNaN(ownerId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });

    if (ownerId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot request access to your own photos.' });
    }

    await client.query('BEGIN');

    // Check if already requested or granted
    const existing = await client.query(
      `SELECT id, status FROM private_photo_access
       WHERE requester_id = $1 AND owner_id = $2`,
      [req.user.id, ownerId]
    );

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: `Access request already ${existing.rows[0].status}.`,
      });
    }

    const cost = req.user.gender === 'female' ? 0 : PRIVATE_ACCESS_COST;

    // Check credits
    const creditResult = await client.query(
      `SELECT connect_credits as credits FROM users WHERE id = $1 FOR UPDATE`,
      [req.user.id]
    );
    const currentCredits = creditResult.rows[0]?.credits || 0;
    if (cost > 0 && currentCredits < cost) {
      await client.query('ROLLBACK');
      return res.status(402).json({
        success: false,
        message: `Insufficient credits. Requesting private photo access costs ${cost} credits.`,
        credits: currentCredits,
      });
    }

    // Check owner exists
    const ownerResult = await client.query(
      `SELECT id, username FROM users WHERE id = $1 AND is_banned = false`,
      [ownerId]
    );
    if (ownerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Deduct credits
    if (cost > 0) {
      await client.query(
        `UPDATE users SET connect_credits = connect_credits - $1, updated_at = NOW() WHERE id = $2`,
        [cost, req.user.id]
      );

      await client.query(
        `INSERT INTO credit_logs (user_id, action, credits_delta, balance_after, description, created_at)
         VALUES ($1, 'private_photo_request', $2, $3, 'Private photo access request', NOW())`,
        [req.user.id, -cost, currentCredits - cost]
      );
    }

    // Create access request
    const accessResult = await client.query(
      `INSERT INTO private_photo_access (requester_id, owner_id, status, credits_charged, created_at)
       VALUES ($1, $2, 'pending', $3, NOW())
       RETURNING id`,
      [req.user.id, ownerId, PRIVATE_ACCESS_COST]
    );

    // Notify owner
    await client.query(
      `INSERT INTO notifications (user_id, type, related_user_id, title, body, is_read, created_at)
       VALUES ($1, 'private_photo_request', $2, 'Private Photo Request', $3, false, NOW())`,
      [ownerId, req.user.id, `${req.user.username} requested access to your private photos.`]
    );

    await client.query('COMMIT');

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${ownerId}`).emit('private_photo_request', {
        from_user_id: req.user.id,
        from_username: req.user.username,
        access_id: accessResult.rows[0].id,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Private photo access request sent.',
      access_id: accessResult.rows[0].id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PRIVATE] POST /request-access/:userId error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  } finally {
    client.release();
  }
});

// ─── GET /access-requests ─────────────────────────────────────────────────────

router.get('/access-requests', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pa.id, pa.requester_id, pa.status, pa.created_at, pa.granted_at,
              u.username AS requester_username, u.profile_photo AS requester_photo,
              u.gender AS requester_gender, u.city AS requester_city
       FROM private_photo_access pa
       JOIN users u ON u.id = pa.requester_id
       WHERE pa.owner_id = $1
       ORDER BY pa.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ success: true, requests: result.rows });
  } catch (err) {
    console.error('[PRIVATE] GET /access-requests error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /access-requests/:id/grant ──────────────────────────────────────────

router.put('/access-requests/:id/grant', async (req, res) => {
  const client = await pool.connect();
  try {
    const accessId = parseInt(req.params.id, 10);
    if (isNaN(accessId)) return res.status(400).json({ success: false, message: 'Invalid access request ID.' });

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE private_photo_access
       SET status = 'granted', granted_at = NOW()
       WHERE id = $1 AND owner_id = $2 AND status = 'pending'
       RETURNING requester_id`,
      [accessId, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Access request not found or already processed.' });
    }

    const requesterId = result.rows[0].requester_id;

    await client.query(
      `INSERT INTO notifications (user_id, type, related_user_id, body, is_read, created_at)
       VALUES ($1, 'private_photo_granted', $2, $3, false, NOW())`,
      [requesterId, req.user.id, `${req.user.username} granted you access to their private photos!`]
    );

    await client.query('COMMIT');

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${requesterId}`).emit('private_photo_access_granted', {
        from_user_id: req.user.id,
        from_username: req.user.username,
      });
    }

    return res.status(200).json({ success: true, message: 'Access granted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PRIVATE] PUT /access-requests/:id/grant error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
});

// ─── PUT /access-requests/:id/deny ───────────────────────────────────────────

router.put('/access-requests/:id/deny', async (req, res) => {
  const client = await pool.connect();
  try {
    const accessId = parseInt(req.params.id, 10);
    if (isNaN(accessId)) return res.status(400).json({ success: false, message: 'Invalid access request ID.' });

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE private_photo_access
       SET status = 'denied'
       WHERE id = $1 AND owner_id = $2 AND status = 'pending'
       RETURNING requester_id`,
      [accessId, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Access request not found or already processed.' });
    }

    const requesterId = result.rows[0].requester_id;

    await client.query(
      `INSERT INTO notifications (user_id, type, related_user_id, body, is_read, created_at)
       VALUES ($1, 'private_photo_denied', $2, $3, false, NOW())`,
      [requesterId, req.user.id, `Your private photo access request was not approved.`]
    );

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Access denied.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PRIVATE] PUT /access-requests/:id/deny error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
});

module.exports = router;
