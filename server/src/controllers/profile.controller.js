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

    if (payload.date_of_birth) {
      const dobStr = String(payload.date_of_birth).trim();
      const match = dobStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return fail(res, 'Date of birth must be in YYYY-MM-DD format.', 400);
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      const dateObj = new Date(year, month - 1, day);
      if (
        dateObj.getFullYear() !== year ||
        dateObj.getMonth() !== month - 1 ||
        dateObj.getDate() !== day
      ) {
        return fail(res, 'Invalid date of birth provided.', 400);
      }
      const today = new Date();
      if (dateObj > today) {
        return fail(res, 'Date of birth cannot be in the future.', 400);
      }
      let age = today.getFullYear() - year;
      const m = today.getMonth() - (month - 1);
      if (m < 0 || (m === 0 && today.getDate() < day)) age--;
      if (age < 18) {
        return fail(res, 'You must be at least 18 years old to join Sway.', 400);
      }
      if (age > 120) {
        return fail(res, 'Please provide a valid date of birth.', 400);
      }
      payload.age = age;
      payload.date_of_birth = dobStr;
    }

    if (payload.profile_photo && typeof payload.profile_photo === 'string' && payload.profile_photo.trim()) {
      payload.profile_photo = payload.profile_photo.trim();
    } else {
      delete payload.profile_photo;
    }

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
        profile_photo: profile.profile_photo || current.profile_photo,
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

const fs = require('fs');
const path = require('path');
const { processImage } = require('../utils/image.util');

const profilesDir = path.resolve(__dirname, '../../../uploads/profiles');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

async function saveAvatarFile(userId, buffer, mimetype) {
  const ext = mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg';
  const filename = `avatar_${userId}_${Date.now()}.${ext}`;
  const filePath = path.join(profilesDir, filename);
  await fs.promises.writeFile(filePath, buffer);

  // Clean up any older avatar files for this user
  try {
    const existing = await fs.promises.readdir(profilesDir);
    for (const f of existing) {
      if (f.startsWith(`avatar_${userId}_`) && f !== filename) {
        await fs.promises.unlink(path.join(profilesDir, f)).catch(() => {});
      }
    }
  } catch (_) {}

  return `/uploads/profiles/${filename}`;
}

exports.uploadAvatar = async (req, res) => {
  try {
    let photoUrl = req.body.photo_url;
    let photoBytes = null;
    let photoMime = null;

    if (req.file && req.file.buffer) {
      const processed = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 1000, maxHeight: 1000, quality: 85 });
      photoBytes = processed.buffer;
      photoMime = processed.mimetype || 'image/jpeg';
      photoUrl = await saveAvatarFile(req.user.id, processed.buffer, photoMime);
    } else if (photoUrl && photoUrl.startsWith('data:')) {
      const matches = photoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        photoMime = matches[1];
        photoBytes = Buffer.from(matches[2], 'base64');
        photoUrl = await saveAvatarFile(req.user.id, photoBytes, photoMime);
      }
    }

    if (!photoUrl) return fail(res, 'No photo provided.', 400);

    await profileService.updateAvatar(req.user.id, photoUrl, photoBytes, photoMime);
    const updatedUser = await userService.getUser(req.user.id);

    return ok(res, {
      message: 'Profile photo updated.',
      photo_url: photoUrl,
      photoUrl: photoUrl,
      user: updatedUser,
      profile: updatedUser,
    });
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
      photoMime = processed.mimetype || 'image/jpeg';
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
      if (photoBytes) {
        photoUrl = await saveAvatarFile(req.user.id, photoBytes, photoMime);
      }
      await profileService.updateAvatar(req.user.id, photoUrl, photoBytes, photoMime);
      const updatedUser = await userService.getUser(req.user.id);
      return ok(res, {
        message: 'Profile photo updated.',
        photo_url: photoUrl,
        photoUrl: photoUrl,
        user: updatedUser,
        profile: updatedUser,
      });
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

    let viewerId = req.user?.id || null;
    if (!viewerId) {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET);
          viewerId = decoded.id;
        } catch (_) {}
      }
    }

    if (viewerId && Number(viewerId) !== Number(userId)) {
      const blocked = await reportRepo.isBlocked(viewerId, userId);
      if (blocked) {
        return res.status(403).json({ success: false, message: 'Access denied: Profile is blocked.' });
      }
    }

    res.setHeader('Content-Type', data.photo_mime || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
      return res.status(404).json({ success: false, message: 'Photo not found.' });
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

    if (!viewerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view private photos.',
      });
    }

    const allowed = await hasPrivatePhotoAccessForOwner(viewerId, viewerRole, data.user_id);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Private photo access is restricted. Send a Private Photo Request and wait for approval.',
      });
    }

    res.setHeader('Content-Type', data.photo_mime || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
