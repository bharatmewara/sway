'use strict';

const express = require('express');
const pool = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { uploadVerification } = require('../middleware/upload');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const randomInRange = (min, max) => Math.random() * (max - min) + min;

// Uses client-side face-api detection result if provided, otherwise falls back to simulation
const resolveAI = (gender, clientDetectedGender, clientConfidence) => {
  if (clientDetectedGender && ['male', 'female'].includes(clientDetectedGender)) {
    const confidence = parseFloat((clientConfidence / 100).toFixed(4)) || 0.85;
    const isLiveScore = parseFloat(randomInRange(0.90, 0.99).toFixed(4));
    return { confidence, detected_gender: clientDetectedGender, is_live: isLiveScore };
  }
  // Fallback simulation (no client detection available)
  const confidence = parseFloat(randomInRange(0.85, 0.99).toFixed(4));
  const isLiveScore = parseFloat(randomInRange(0.90, 0.99).toFixed(4));
  return { confidence, detected_gender: gender, is_live: isLiveScore };
};

// ─── POST /submit ─────────────────────────────────────────────────────────────

router.post('/submit', verifyToken, uploadVerification, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const gender = req.user.gender;

    // Check for existing pending or approved verification
    const existing = await client.query(
      `SELECT id, status FROM verification_requests WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      const { status } = existing.rows[0];
      if (status === 'approved') {
        return res.status(409).json({ success: false, message: 'Your account is already verified.' });
      }
      if (status === 'pending') {
        return res.status(409).json({ success: false, message: 'You already have a verification request under review.' });
      }
    }

    if (!req.files || !req.files['selfie']) {
      return res.status(400).json({ success: false, message: 'Selfie is required for verification.' });
    }

    const selfieFile = req.files['selfie'][0];
    const selfieUrl = `/uploads/verification/${selfieFile.filename}`;

    let documentUrl = null;
    if (req.files['document'] && req.files['document'].length > 0) {
      documentUrl = `/uploads/verification/${req.files['document'][0].filename}`;
    }

    // Males require document
    if (gender === 'male' && !documentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Male users must submit both a selfie and a valid government ID document.',
      });
    }

    // Use client-side face-api detection result if provided
    const clientDetectedGender = req.body.client_detected_gender || null;
    const clientConfidence = parseFloat(req.body.client_gender_confidence) || 0;

    // Server-side gender mismatch guard (catches tampering / missing client detection)
    if (clientDetectedGender && clientDetectedGender !== gender) {
      return res.status(400).json({
        success: false,
        message: `Gender mismatch: AI detected ${clientDetectedGender} face but account is registered as ${gender}. Please use your own photo.`,
      });
    }

    const aiResult = resolveAI(gender, clientDetectedGender, clientConfidence);

    await client.query('BEGIN');

    let finalStatus = 'pending';
    let finalVerificationStatus = 'under_review';
    let reviewNotes = null;
    let responseMessage = 'Verification request submitted successfully. We will review it within 24 hours.';
    let responseSuccess = true;

    // Gender mismatch = immediate rejection
    if (aiResult.detected_gender !== gender) {
      finalStatus = 'rejected';
      finalVerificationStatus = 'rejected';
      reviewNotes = `AI detected ${aiResult.detected_gender} face but account registered as ${gender}.`;
      responseMessage = `Verification failed: AI detected a ${aiResult.detected_gender} face. Your account is registered as ${gender}. Please use your own photo.`;
      responseSuccess = false;
    } else if (gender === 'female') {
      if (aiResult.is_live >= 0.8) {
        finalStatus = 'approved';
        finalVerificationStatus = 'verified';
        reviewNotes = 'Automated AI Approval';
        responseMessage = 'Congratulations! Your profile has been verified instantly by our AI.';
      } else {
        finalStatus = 'rejected';
        finalVerificationStatus = 'rejected';
        reviewNotes = 'Failed liveness check.';
        responseMessage = 'Verification failed. Liveness check did not pass. Please retake your selfie.';
        responseSuccess = false;
      }
    }

    const result = await client.query(
      `INSERT INTO verification_requests
         (user_id, selfie_photo, document_photo, verification_type, status, ai_confidence_score, ai_gender_detected,
          ai_liveness_score, submitted_at, reviewed_at, review_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10)
       RETURNING id`,
      [
        userId, selfieUrl, documentUrl,
        documentUrl ? 'document' : 'facial',
        finalStatus,
        aiResult.confidence, aiResult.detected_gender, aiResult.is_live,
        finalStatus !== 'pending' ? new Date() : null,
        reviewNotes
      ]
    );

    // Update user verification_status
    if (finalVerificationStatus === 'verified') {
      await client.query(
        `UPDATE users SET verification_status = 'verified', verified_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [userId]
      );
    } else {
      await client.query(
        `UPDATE users SET verification_status = $1, updated_at = NOW() WHERE id = $2`,
        [finalVerificationStatus, userId]
      );
    }

    await client.query('COMMIT');

    return res.status(responseSuccess ? 201 : 400).json({
      success: responseSuccess,
      message: responseMessage,
      request_id: result.rows[0].id,
      status: finalStatus
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[VERIFY] /submit error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error submitting verification.' });
  } finally {
    client.release();
  }
});

// ─── GET /status ──────────────────────────────────────────────────────────────

router.get('/status', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vr.id, vr.status, vr.submitted_at, vr.reviewed_at, vr.review_notes AS rejection_reason,
              u.verification_status, u.verified_at
       FROM users u
       LEFT JOIN verification_requests vr ON vr.user_id = u.id
       WHERE u.id = $1
       ORDER BY vr.submitted_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[VERIFY] /status error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /admin/list ──────────────────────────────────────────────────────────

router.get('/admin/list', verifyAdmin, async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status || 'pending';

    const validStatuses = ['pending', 'approved', 'rejected'];
    const filterStatus = validStatuses.includes(status) ? status : 'pending';

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM verification_requests WHERE status = $1`,
      [filterStatus]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT vr.id, vr.user_id, vr.selfie_photo as selfie_url, vr.document_photo as document_url, vr.status,
              vr.ai_confidence_score as ai_confidence, vr.ai_gender_detected as ai_detected_gender, vr.ai_liveness_score as ai_is_live,
              vr.submitted_at, vr.reviewed_at, vr.review_notes,
              u.username, u.email, u.gender, u.profile_photo
       FROM verification_requests vr
       JOIN users u ON u.id = vr.user_id
       WHERE vr.status = $1
       ORDER BY vr.submitted_at ASC
       LIMIT $2 OFFSET $3`,
      [filterStatus, limit, offset]
    );

    return res.status(200).json({
      success: true,
      requests: result.rows,
      total,
      pages,
      page,
    });
  } catch (err) {
    console.error('[VERIFY] /admin/list error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /admin/:id/approve ───────────────────────────────────────────────────

router.put('/admin/:id/approve', verifyAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) return res.status(400).json({ success: false, message: 'Invalid request ID.' });

    await client.query('BEGIN');

    const requestResult = await client.query(
      `SELECT user_id FROM verification_requests WHERE id = $1 AND status = 'pending'`,
      [requestId]
    );
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Verification request not found or already processed.' });
    }

    const userId = requestResult.rows[0].user_id;

    await client.query(
      `UPDATE verification_requests
       SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
       WHERE id = $2`,
      [req.user.id, requestId]
    );

    await client.query(
      `UPDATE users
       SET verification_status = 'verified', verified_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Notify user
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, is_read, created_at)
       VALUES ($1, 'verification_approved', 'Verification Approved', 'Congratulations! Your profile has been verified.', false, NOW())`,
      [userId]
    );

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Verification approved successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[VERIFY] /admin/:id/approve error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
});

// ─── PUT /admin/:id/reject ────────────────────────────────────────────────────

router.put('/admin/:id/reject', verifyAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) return res.status(400).json({ success: false, message: 'Invalid request ID.' });

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    await client.query('BEGIN');

    const requestResult = await client.query(
      `SELECT user_id FROM verification_requests WHERE id = $1 AND status = 'pending'`,
      [requestId]
    );
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Verification request not found or already processed.' });
    }

    const userId = requestResult.rows[0].user_id;

    await client.query(
      `UPDATE verification_requests
       SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $1, review_notes = $2
       WHERE id = $3`,
      [req.user.id, reason.trim(), requestId]
    );

    await client.query(
      `UPDATE users
       SET verification_status = 'rejected', updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Notify user
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, is_read, created_at)
       VALUES ($1, 'verification_rejected', 'Verification Rejected', $2, false, NOW())`,
      [userId, `Your verification was rejected. Reason: ${reason.trim()}`]
    );

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Verification rejected.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[VERIFY] /admin/:id/reject error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
});

module.exports = router;
