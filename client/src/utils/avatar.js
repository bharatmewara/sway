'use strict';

/**
 * Standardized Avatar Resolution Utility for Sway Dating App
 * Ensures proper image resolution, cache-busting, zero selfie leakage, and brand fallbacks.
 */

export const getDefaultAvatar = (gender) => {
  return String(gender || '').toLowerCase() === 'female' ? '/img/girl.png' : '/img/profile-man.png';
};

/**
 * Resolves a profile photo URL to a valid loadable URL with fallback support.
 * @param {string|null|undefined} photoUrl - The profile_photo string from database or user object
 * @param {string} [gender='male'] - User's gender ('female' or 'male')
 * @returns {string} Fully resolved path or brand placeholder
 */
export const resolveAvatarUrl = (photoUrl, gender = 'male') => {
  if (!photoUrl || typeof photoUrl !== 'string') {
    return getDefaultAvatar(gender);
  }

  const clean = photoUrl.trim();
  if (!clean) {
    return getDefaultAvatar(gender);
  }

  // Never render raw data URI (which may be a legacy leaked selfie)
  if (clean.startsWith('data:')) {
    return getDefaultAvatar(gender);
  }

  // Absolute HTTP / HTTPS URLs
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // Root-relative paths like /uploads/profiles/... or /img/...
  if (clean.startsWith('/')) {
    return clean;
  }

  return `/${clean}`;
};

/**
 * Image error event handler for avatars to gracefully fallback without broken image icons.
 * @param {Event} e - React SyntheticEvent from img.onError
 * @param {string} [gender='male'] - User's gender
 */
export const handleAvatarError = (e, gender = 'male') => {
  if (!e || !e.currentTarget) return;
  e.currentTarget.onerror = null;
  e.currentTarget.src = getDefaultAvatar(gender);
};
