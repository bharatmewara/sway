'use strict';

const profileService = require('../services/profile.service');
const userService = require('../services/user.service');
const { ok, fail } = require('../utils/response');

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfile(req.user.id);
    return ok(res, { profile });
  } catch (err) {
    return fail(res, err.message, 404);
  }
};

exports.getProfileById = async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const profile = await userService.getUserById(targetId, req.user?.id);
    return ok(res, { profile, user: profile });
  } catch (err) {
    return fail(res, err.message, err.status || 404);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const current = await profileService.getProfile(req.user.id);
    if (
      !['verified', 'VERIFIED'].includes(current.verification_status) ||
      (current.gender_match_status && current.gender_match_status !== 'MATCH')
    ) {
      return fail(res, 'You must complete live AI selfie verification with matching gender before completing your profile.', 403);
    }

    const payload = { ...req.body };
    // Prevent client-side manipulation of gender or verification status
    delete payload.gender;
    delete payload.selected_gender;
    delete payload.verified_gender;
    delete payload.ai_detected_gender;
    delete payload.gender_match_status;
    delete payload.verification_status;
    delete payload.connect_required_for_chat;

    const finalBio = (payload.bio !== undefined ? payload.bio : current.bio || '').trim();
    const finalCity = (payload.city !== undefined ? payload.city : current.city || '').trim();
    const finalPhoto = payload.profile_photo || current.profile_photo;

    if (!current.profile_completed) {
      if (!finalBio) {
        return fail(res, 'Bio / About Me is required to complete your profile.', 400);
      }
      if (!finalCity) {
        return fail(res, 'City / Location is required to complete your profile.', 400);
      }
      if (!finalPhoto) {
        return fail(res, 'Profile photo is required to complete your profile.', 400);
      }
    }

    payload.profile_completed = true;
    payload.profile_status = 'COMPLETED';
    payload.onboarding_status = 'PROFILE_COMPLETED';

    const profile = await profileService.updateProfile(req.user.id, payload);
    const effectiveGender = (profile.verified_gender || profile.selected_gender || profile.gender || '').toLowerCase();
    const connectRequired = effectiveGender === 'female' ? false : true;
    const nextRoute = '/home';

    return ok(res, {
      message: 'Profile completed and saved.',
      profile: {
        ...profile,
        gender: effectiveGender,
        selected_gender: effectiveGender,
        verified_gender: effectiveGender,
        ai_detected_gender: effectiveGender,
        gender_match_status: 'MATCH',
        profile_completed: true,
        profile_status: 'COMPLETED',
        onboarding_status: 'PROFILE_COMPLETED',
        connect_required_for_chat: connectRequired,
      },
      next_route: nextRoute,
    });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

const { processImage } = require('../utils/image.util');

exports.uploadAvatar = async (req, res) => {
  try {
    let photoUrl = req.body.photo_url;
    let photoBytes = null;
    let photoMime = null;

    if (req.file && req.file.buffer) {
      const processed = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 1000, maxHeight: 1000, quality: 85 });
      photoBytes = processed.buffer;
      photoMime = processed.mimetype;
      photoUrl = processed.dataUri;
    } else if (photoUrl && photoUrl.startsWith('data:')) {
      const matches = photoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        photoMime = matches[1];
        photoBytes = Buffer.from(matches[2], 'base64');
      }
    }

    if (!photoUrl) return fail(res, 'No photo provided.', 400);

    await profileService.updateAvatar(req.user.id, photoUrl, photoBytes, photoMime);
    return ok(res, { message: 'Profile photo updated.', photo_url: photoUrl, photoUrl });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    let photoUrl = req.body.photo_url;
    let photoBytes = null;
    let photoMime = null;

    if (req.file && req.file.buffer) {
      const processed = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 1200, maxHeight: 1200, quality: 85 });
      photoBytes = processed.buffer;
      photoMime = processed.mimetype;
      photoUrl = processed.dataUri;
    } else if (photoUrl && photoUrl.startsWith('data:')) {
      const matches = photoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        photoMime = matches[1];
        photoBytes = Buffer.from(matches[2], 'base64');
      }
    }

    if (!photoUrl) return fail(res, 'No photo provided.', 400);

    const isPrimary = req.body.is_primary === 'true' || req.body.is_primary === true;
    if (isPrimary) {
      await profileService.updateAvatar(req.user.id, photoUrl, photoBytes, photoMime);
      return ok(res, { message: 'Profile photo updated.', photo_url: photoUrl, photoUrl });
    }
    const photo = await profileService.addPhoto(req.user.id, photoUrl, req.body.is_blurred === 'true', photoBytes, photoMime);
    return ok(res, { message: 'Private photo uploaded.', photo, photo_url: photoUrl, photoUrl });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.getAvatarRaw = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId || req.params.id, 10);
    const data = await profileService.getUserAvatarBytes(userId);
    if (!data || !data.photo_bytes) {
      return res.status(404).send('Photo not found');
    }
    res.setHeader('Content-Type', data.photo_mime || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(data.photo_bytes);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

const pool = require('../config/database');
const reportRepo = require('../repositories/report.repository');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

async function hasPrivatePhotoAccessForOwner(viewerId, viewerRole, ownerId) {
  if (!viewerId) return false;
  if (Number(viewerId) === Number(ownerId)) return true;
  if (viewerRole === 'admin' || viewerRole === 'superadmin') return true;

  const blocked = await reportRepo.isBlocked(viewerId, ownerId);
  if (blocked) return false;

  const res = await pool.query(
    `SELECT 1 FROM connection_requests
     WHERE sender_id = $1 AND receiver_id = $2
       AND UPPER(status) IN ('ACCESS_GRANTED', 'ACCEPTED', 'APPROVED')
     UNION
     SELECT 1 FROM private_photo_access
     WHERE requester_id = $1 AND owner_id = $2
       AND UPPER(status) IN ('ACCESS_GRANTED', 'ACCEPTED', 'APPROVED')
     LIMIT 1`,
    [viewerId, ownerId]
  );
  return res.rows.length > 0;
}

exports.getPrivatePhotoRaw = async (req, res) => {
  try {
    const photoId = parseInt(req.params.photoId || req.params.id, 10);
    const data = await profileService.getPrivatePhotoBytes(photoId);
    if (!data || !data.photo_bytes) {
      return res.status(404).send('Photo not found');
    }

    let viewerId = req.user?.id || null;
    let viewerRole = req.user?.role || null;
    if (!viewerId) {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET);
          viewerId = decoded.id;
          viewerRole = decoded.role;
        } catch (_) {}
      }
    }

    const allowed = await hasPrivatePhotoAccessForOwner(viewerId, viewerRole, data.user_id);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Private photo access is restricted. Send a Private Photo Request and wait for approval.',
      });
    }

    res.setHeader('Content-Type', data.photo_mime || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.send(data.photo_bytes);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

exports.getPhotos = async (req, res) => {
  try {
    const targetUserId = req.params.userId
      ? parseInt(req.params.userId, 10)
      : req.query.user_id
        ? parseInt(req.query.user_id, 10)
        : req.user.id;

    if (Number(targetUserId) !== Number(req.user.id)) {
      const blocked = await reportRepo.isBlocked(req.user.id, targetUserId);
      if (blocked) {
        return fail(res, 'Cannot view private photos due to blocking.', 403);
      }
    }

    const photos = await profileService.getPhotos(targetUserId);
    const allowed = await hasPrivatePhotoAccessForOwner(req.user.id, req.user.role, targetUserId);

    const sanitizedPhotos = photos.map((p) => {
      if (allowed) {
        return {
          ...p,
          is_blurred: false,
          is_locked: false,
          is_unlocked: true,
        };
      }
      return {
        id: p.id,
        user_id: p.user_id,
        photo_url: null,
        is_blurred: true,
        is_locked: true,
        is_unlocked: false,
        created_at: p.created_at,
      };
    });

    return ok(res, {
      photos: sanitizedPhotos,
      access_granted: allowed,
      total: sanitizedPhotos.length,
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    const photoId = parseInt(req.params.photoId || req.params.id, 10);
    if (!photoId) return fail(res, 'Invalid photo ID.', 400);

    const success = await profileService.deletePhoto(photoId, req.user.id);
    if (!success) return fail(res, 'Photo not found.', 404);
    return ok(res, { message: 'Photo deleted.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
