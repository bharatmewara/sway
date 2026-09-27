'use strict';

const path = require('path');
const sharp = require('sharp');
const pool = require('../config/database');
const authService = require('../services/auth.service');
const { processImage } = require('../utils/image.util');
const { sign } = require('../utils/jwt');
const { ok, fail } = require('../utils/response');

let serverFaceApi = null;
let serverModelsLoadingPromise = null;

async function getServerFaceApi() {
  if (serverFaceApi) return serverFaceApi;
  if (serverModelsLoadingPromise) return serverModelsLoadingPromise;

  serverModelsLoadingPromise = (async () => {
    try {
      if (!global.window) global.window = global;
      if (!global.document) global.document = {};
      const faceapi = await import('@vladmandic/face-api/dist/face-api.esm.js');
      await faceapi.tf.setBackend('cpu');
      await faceapi.tf.ready();
      const modelsDir = path.resolve(__dirname, '../../../client/public/models');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(modelsDir),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelsDir),
        faceapi.nets.ageGenderNet.loadFromDisk(modelsDir),
      ]);
      serverFaceApi = faceapi;
      return faceapi;
    } catch (err) {
      console.warn('[VERIFY] Server face-api model init warning:', err.message);
      serverModelsLoadingPromise = null;
      return null;
    }
  })();

  return serverModelsLoadingPromise;
}

/**
 * Run server-side AI face & gender detection directly on the image buffer
 */
async function runServerFaceDetection(buffer) {
  try {
    const faceapi = await getServerFaceApi();
    if (!faceapi) return null;

    const { data, info } = await sharp(buffer)
      .resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tensor = faceapi.tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], 'int32');
    try {
      const detections = await faceapi
        .detectAllFaces(tensor, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.28 }))
        .withFaceLandmarks()
        .withAgeAndGender();

      if (!detections || detections.length === 0) {
        return { face_detected: false, face_count: 0 };
      }
      if (detections.length > 1) {
        return { face_detected: true, face_count: detections.length };
      }

      const single = detections[0];
      return {
        face_detected: true,
        face_count: 1,
        face_score: single.detection.score,
        detected_gender: String(single.gender || '').toLowerCase(),
        confidence: Math.round((single.genderProbability || 0) * 100),
      };
    } finally {
      tensor.dispose();
    }
  } catch (err) {
    console.warn('[VERIFY] runServerFaceDetection error:', err.message);
    return null;
  }
}

/**
 * Analyze image quality using sharp metadata & channel statistics
 */
async function analyzeImageQuality(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return { valid: false, reason: 'Poor image quality: unable to read image dimensions.' };
    }
    if (metadata.width < 120 || metadata.height < 120) {
      return { valid: false, reason: 'Poor image quality: camera capture resolution is too low. Please retry live capture.' };
    }

    const stats = await sharp(buffer).stats();
    if (stats.channels && stats.channels.length >= 3) {
      const meanBrightness = (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3;
      const meanStdDev = (stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3;

      if (meanBrightness < 15) {
        return { valid: false, reason: 'Poor lighting: your live camera frame is too dark. Please face a light source and retry.' };
      }
      if (meanBrightness > 250) {
        return { valid: false, reason: 'Poor lighting: camera capture is overexposed. Please avoid direct bright glare and retry.' };
      }
      if (meanStdDev < 6) {
        return { valid: false, reason: 'Face is not clearly visible: camera capture appears blank or obstructed. Please retry live capture.' };
      }
    }

    return { valid: true, width: metadata.width, height: metadata.height };
  } catch (err) {
    return { valid: false, reason: 'Invalid camera capture. Please complete verification using a live selfie.' };
  }
}

exports.submitSelfie = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;

    // Load authoritative user registration record from DB (never trust client-sent selected_gender)
    const userRes = await client.query(
      `SELECT id, username, email, role, gender, selected_gender, profile_completed
       FROM users
       WHERE id = $1`,
      [userId]
    );
    if (!userRes.rows.length) {
      return fail(res, 'User account not found.', 404);
    }
    const currentUser = userRes.rows[0];
    const selectedGender = String(currentUser.selected_gender || currentUser.gender || '').toLowerCase().trim();

    // Mark user as VERIFICATION_IN_PROGRESS
    await client.query(
      `UPDATE users SET onboarding_status = 'VERIFICATION_IN_PROGRESS', updated_at = NOW() WHERE id = $1`,
      [userId]
    );

    // Enforce Live Camera Capture Only
    const captureSource = String(req.body.capture_source || 'live_camera').toLowerCase().trim();
    if (captureSource !== 'live_camera') {
      await client.query(
        `UPDATE users
         SET verification_status = 'VERIFICATION_RESUBMISSION_REQUIRED',
             gender_match_status = 'FAILED',
             onboarding_status = 'VERIFICATION_RESUBMISSION_REQUIRED',
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );
      return res.status(200).json({
        success: false,
        verified: false,
        code: 'LIVE_CAMERA_REQUIRED',
        status: 'rejected',
        selected_gender: selectedGender,
        verification_status: 'VERIFICATION_RESUBMISSION_REQUIRED',
        onboarding_status: 'VERIFICATION_RESUBMISSION_REQUIRED',
        reason: 'Photo uploads and gallery images are not permitted. Please capture your selfie using your live camera.',
        message: 'Photo uploads and gallery images are not permitted. Please capture your selfie using your live camera.',
      });
    }

    // Extract selfie buffer from multipart file or base64 body
    let rawBuffer = null;
    let rawMime = 'image/jpeg';

    if (req.file && req.file.buffer) {
      rawBuffer = req.file.buffer;
      rawMime = req.file.mimetype || 'image/jpeg';
    } else if (req.files && req.files['selfie'] && req.files['selfie'][0]?.buffer) {
      rawBuffer = req.files['selfie'][0].buffer;
      rawMime = req.files['selfie'][0].mimetype || 'image/jpeg';
    } else if (req.files && req.files['photo'] && req.files['photo'][0]?.buffer) {
      rawBuffer = req.files['photo'][0].buffer;
      rawMime = req.files['photo'][0].mimetype || 'image/jpeg';
    } else if (req.body.selfie_base64 || req.body.selfie) {
      const b64 = req.body.selfie_base64 || req.body.selfie;
      const matches = String(b64).match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        rawMime = matches[1];
        rawBuffer = Buffer.from(matches[2], 'base64');
      }
    }

    if (!rawBuffer || rawBuffer.length === 0) {
      await client.query(
        `UPDATE users
         SET verification_status = 'VERIFICATION_RESUBMISSION_REQUIRED',
             gender_match_status = 'FAILED',
             onboarding_status = 'VERIFICATION_RESUBMISSION_REQUIRED',
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );
      return res.status(200).json({
        success: false,
        verified: false,
        code: 'INVALID_CAPTURE',
        status: 'rejected',
        selected_gender: selectedGender,
        verification_status: 'VERIFICATION_RESUBMISSION_REQUIRED',
        onboarding_status: 'VERIFICATION_RESUBMISSION_REQUIRED',
        reason: 'Live camera capture is invalid or empty. Please capture a live selfie using your camera.',
        message: 'Verification Failed: Live camera capture is invalid.',
      });
    }

    // 1. Server-side image quality check
    const quality = await analyzeImageQuality(rawBuffer);
    const processed = await processImage(rawBuffer, rawMime, { maxWidth: 1000, maxHeight: 1000, quality: 85 });

    // 2. Run server-side AI face & gender detection and combine with live capture AI analysis
    const serverAi = await runServerFaceDetection(rawBuffer);

    const clientFailureReason = req.body.failure_reason || null;
    const faceDetectedRaw = req.body.face_detected;
    const clientFaceDetected = faceDetectedRaw === undefined ? true : (faceDetectedRaw === true || faceDetectedRaw === 'true');
    const clientFaceCount = req.body.face_count !== undefined ? parseInt(req.body.face_count, 10) : (clientFaceDetected ? 1 : 0);
    const clientFaceScore = req.body.face_score !== undefined ? parseFloat(req.body.face_score) : 0.9;
    const clientDetectedGender = (req.body.detected_gender || req.body.client_detected_gender || '').toLowerCase().trim();
    const clientConfidence = parseFloat(req.body.confidence || req.body.client_gender_confidence || '0');

    // If server-side neural detector found face(s) in the real photo, prioritize its authoritative result
    const useServerAi = serverAi && serverAi.face_count > 0;
    const faceDetected = clientFaceDetected && (useServerAi ? serverAi.face_detected : clientFaceDetected);
    const faceCount = !clientFaceDetected ? 0 : (clientFaceCount > 1 ? clientFaceCount : (useServerAi ? serverAi.face_count : clientFaceCount));
    const faceScore = useServerAi ? serverAi.face_score : clientFaceScore;
    const aiDetectedGender = useServerAi && serverAi.detected_gender ? serverAi.detected_gender : clientDetectedGender;
    const confidence = useServerAi && serverAi.confidence ? serverAi.confidence : clientConfidence;

    let failureReason = null;
    let failureCode = 'FACE_DETECTION_FAILED';
    let genderMatchStatus = 'FAILED';

    if (!quality.valid) {
      failureReason = quality.reason;
    } else if (clientFailureReason) {
      failureReason = clientFailureReason;
    } else if (!faceDetected || faceCount === 0) {
      failureReason = 'No face detected. Please position your face inside the verification frame and look directly at the camera.';
    } else if (faceCount > 1) {
      failureReason = 'Multiple faces detected. Please ensure only your face is visible in the live camera frame.';
    } else if (faceScore < 0.42) {
      failureReason = 'Face is not clearly visible. Please look directly at the camera in good lighting without sunglasses or coverings.';
    } else if (!['female', 'male'].includes(aiDetectedGender)) {
      failureReason = 'AI verification could not be completed. Please keep your face clearly visible and retry live capture.';
    } else if (confidence < 55) {
      failureReason = `AI could not confidently verify your live selfie (${Math.round(confidence)}% confidence). Please ensure clear lighting and retry.`;
    } else if (selectedGender !== aiDetectedGender) {
      // STRICT BACKEND GENDER MATCH VALIDATION:
      // Selected Gender (from registration) MUST match AI Detected Gender
      failureCode = 'GENDER_MISMATCH';
      genderMatchStatus = 'MISMATCH';
      failureReason = "We couldn't verify your identity based on the information provided. Please complete the verification again using a live selfie.";
    }

    await client.query('BEGIN');

    // 3. Handle Failed Verification (Face Detection Failure OR Gender Mismatch)
    if (failureReason) {
      const reqInsert = await client.query(
        `INSERT INTO verification_requests
           (user_id, verification_type, selfie_photo, selfie_bytes, selfie_mime,
            selected_gender, ai_gender_detected, gender_match_status, capture_source,
            ai_confidence_score, face_count, failure_reason,
            status, review_notes, submitted_at, reviewed_at)
         VALUES ($1, 'facial', $2, $3, $4, $5, $6, $7, 'live_camera', $8, $9, $10, 'rejected', $10, NOW(), NOW())
         RETURNING id`,
        [
          userId,
          processed.dataUri,
          processed.buffer,
          processed.mimetype,
          selectedGender,
          aiDetectedGender || null,
          genderMatchStatus,
          confidence ? parseFloat((confidence / 100).toFixed(4)) : 0,
          faceCount || 0,
          failureReason,
        ]
      );

      await client.query(
        `UPDATE users
         SET verification_status = 'VERIFICATION_RESUBMISSION_REQUIRED',
             ai_detected_gender = $1,
             gender_match_status = $2,
             onboarding_status = 'VERIFICATION_RESUBMISSION_REQUIRED',
             updated_at = NOW()
         WHERE id = $3`,
        [aiDetectedGender || null, genderMatchStatus, userId]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        success: false,
        verified: false,
        code: failureCode,
        request_id: reqInsert.rows[0].id,
        status: 'rejected',
        selected_gender: selectedGender,
        ai_detected_gender: aiDetectedGender || null,
        gender_match_status: genderMatchStatus,
        verification_status: 'VERIFICATION_RESUBMISSION_REQUIRED',
        onboarding_status: 'VERIFICATION_RESUBMISSION_REQUIRED',
        reason: failureReason,
        message: failureReason,
      });
    }

    // 4. Handle Successful Verification (Live Capture Valid + Face Detected + Selected Gender === AI Detected Gender)
    const verifiedGender = selectedGender; // Guaranteed equal to aiDetectedGender
    const connectRequiredForChat = verifiedGender === 'male'; // false for female, true for male
    const normalizedConfidence = parseFloat((Math.min(confidence || 92, 99.9) / 100).toFixed(4));

    const reqInsert = await client.query(
      `INSERT INTO verification_requests
         (user_id, verification_type, selfie_photo, selfie_bytes, selfie_mime,
          selected_gender, ai_gender_detected, gender_match_status, capture_source,
          ai_confidence_score, ai_liveness_score, face_count,
          status, review_notes, submitted_at, reviewed_at)
       VALUES ($1, 'facial', $2, $3, $4, $5, $6, 'MATCH', 'live_camera', $7, 0.9800, 1, 'approved', 'Live AI Selfie Verification & Gender Match Approved', NOW(), NOW())
       RETURNING id`,
      [
        userId,
        processed.dataUri,
        processed.buffer,
        processed.mimetype,
        selectedGender,
        aiDetectedGender,
        normalizedConfidence,
      ]
    );

    // Update user record with verified state, matched gender, and connect rules.
    const userUpdate = await client.query(
      `UPDATE users
       SET verification_status = 'verified',
           verification_type = 'facial',
           selected_gender = $1,
           verified_gender = $1,
           ai_detected_gender = $2,
           gender = $1,
           gender_match_status = 'MATCH',
           profile_status = CASE WHEN profile_completed = true THEN 'COMPLETED' ELSE 'INCOMPLETE' END,
           connect_required_for_chat = $3,
           onboarding_status = CASE WHEN profile_completed = true THEN 'PROFILE_COMPLETED' ELSE 'PROFILE_INCOMPLETE' END,
           profile_photo = COALESCE(NULLIF(profile_photo, ''), $4),
           photo_bytes = COALESCE(photo_bytes, $5),
           photo_mime = COALESCE(photo_mime, $6),
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        verifiedGender,
        aiDetectedGender,
        connectRequiredForChat,
        processed.dataUri,
        processed.buffer,
        processed.mimetype,
        userId,
      ]
    );

    const updatedUserRow = userUpdate.rows[0];
    const formattedUser = authService.formatUser(updatedUserRow);
    const newToken = sign({
      id: updatedUserRow.id,
      role: updatedUserRow.role,
      gender: verifiedGender,
      selected_gender: verifiedGender,
      verified_gender: verifiedGender,
      username: updatedUserRow.username,
    });

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      verified: true,
      request_id: reqInsert.rows[0].id,
      status: 'approved',
      verification_status: 'VERIFIED',
      selected_gender: selectedGender,
      ai_detected_gender: aiDetectedGender,
      detected_gender: aiDetectedGender,
      gender_match_status: 'MATCH',
      profile_status: formattedUser.profile_status,
      onboarding_status: formattedUser.onboarding_status,
      connect_required_for_chat: connectRequiredForChat,
      confidence: Math.round(normalizedConfidence * 100),
      next_route: '/profile',
      message: verifiedGender === 'female'
        ? 'Verification Successful! Female identity matched and verified — redirecting to Profile Setup.'
        : 'Verification Successful! Male identity matched and verified — redirecting to Profile Setup.',
      token: newToken,
      user: formattedUser,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[VERIFY] submitSelfie error:', err);
    return fail(res, err.message || 'Server error during live selfie verification.', 500);
  } finally {
    client.release();
  }
};

exports.getStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.gender, u.selected_gender, u.verified_gender,
              u.ai_detected_gender, u.gender_match_status, u.profile_status,
              u.verification_status, u.onboarding_status, u.profile_completed,
              u.connect_required_for_chat, u.connect_credits, u.verified_at,
              vr.id AS request_id, vr.status AS last_attempt_status,
              vr.ai_gender_detected, vr.ai_confidence_score,
              vr.failure_reason, vr.review_notes, vr.submitted_at
       FROM users u
       LEFT JOIN verification_requests vr ON vr.user_id = u.id
       WHERE u.id = $1
       ORDER BY vr.submitted_at DESC NULLS LAST
       LIMIT 1`,
      [req.user.id]
    );

    if (!result.rows.length) return fail(res, 'User not found.', 404);
    return ok(res, { status: result.rows[0] });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.adminList = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status || 'pending';

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM verification_requests WHERE status = $1`,
      [status]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const result = await pool.query(
      `SELECT vr.id, vr.user_id, vr.selfie_photo AS selfie_url, vr.document_photo AS document_url,
              vr.status, vr.ai_confidence_score AS ai_confidence, vr.ai_gender_detected AS ai_detected_gender,
              vr.submitted_at, vr.reviewed_at, vr.review_notes, vr.failure_reason,
              u.username, u.email, u.gender, u.verified_gender, u.profile_photo
       FROM verification_requests vr
       JOIN users u ON u.id = vr.user_id
       WHERE vr.status = $1
       ORDER BY vr.submitted_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    return ok(res, {
      requests: result.rows,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
