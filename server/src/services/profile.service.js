'use strict';

const profileRepo = require('../repositories/profile.repository');

class ProfileService {
  async getProfile(userId) {
    const profile = await profileRepo.getProfile(userId);
    if (!profile) throw new Error('Profile not found.');
    return profile;
  }

  async updateProfile(userId, updates) {
    return profileRepo.updateProfile(userId, updates);
  }

  async updateAvatar(userId, photoUrl) {
    return profileRepo.updatePhoto(userId, photoUrl);
  }

  async getPhotos(userId) {
    return profileRepo.getPhotos(userId);
  }

  async addPhoto(userId, photoUrl, isBlurred = false) {
    return profileRepo.addPhoto(userId, photoUrl, isBlurred);
  }

  async deletePhoto(photoId, userId) {
    return profileRepo.deletePhoto(photoId, userId);
  }
}

module.exports = new ProfileService();
