'use strict';

const profileService = require('../services/profile.service');
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
    const profile = await profileService.getProfile(parseInt(req.params.id, 10));
    return ok(res, { profile });
  } catch (err) {
    return fail(res, err.message, 404);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const profile = await profileService.updateProfile(req.user.id, req.body);
    return ok(res, { message: 'Profile updated.', profile });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.photo_url;
    if (!photoUrl) return fail(res, 'No photo provided.', 400);

    const isPrimary = req.body.is_primary === 'true' || req.body.is_primary === true;
    if (isPrimary) {
      await profileService.updateAvatar(req.user.id, photoUrl);
    }
    const photo = await profileService.addPhoto(req.user.id, photoUrl, req.body.is_blurred === 'true');
    return ok(res, { message: 'Photo uploaded.', photo, photoUrl });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.getPhotos = async (req, res) => {
  try {
    const targetUserId = req.params.userId ? parseInt(req.params.userId, 10) : req.user.id;
    const photos = await profileService.getPhotos(targetUserId);
    return ok(res, { photos });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    const success = await profileService.deletePhoto(parseInt(req.params.photoId, 10), req.user.id);
    if (!success) return fail(res, 'Photo not found.', 404);
    return ok(res, { message: 'Photo deleted.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
