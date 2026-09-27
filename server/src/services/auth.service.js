'use strict';

const userRepo = require('../repositories/user.repository');
const { hash, compare } = require('../utils/password');
const { sign } = require('../utils/jwt');

class AuthService {
  formatUser(u) {
    const isVerified = ['verified', 'VERIFIED'].includes(u.verification_status);
    const selectedGender = (u.selected_gender || u.gender || '').toLowerCase();
    const verifiedGender = u.verified_gender || (isVerified ? selectedGender : null);
    const connectRequired = isVerified && String(verifiedGender).toLowerCase() === 'female'
      ? false
      : (u.connect_required_for_chat !== undefined && u.connect_required_for_chat !== null ? !!u.connect_required_for_chat : true);

    return {
      id: u.id,
      username: u.username,
      nickname: u.nickname || '',
      email: u.email,
      gender: (verifiedGender || selectedGender || '').toLowerCase(),
      selected_gender: selectedGender || null,
      verified_gender: verifiedGender ? String(verifiedGender).toLowerCase() : null,
      ai_detected_gender: u.ai_detected_gender ? String(u.ai_detected_gender).toLowerCase() : null,
      gender_match_status: u.gender_match_status || (isVerified ? 'MATCH' : 'PENDING'),
      dob: u.date_of_birth,
      date_of_birth: u.date_of_birth,
      age: u.age,
      city: u.city,
      state: u.state,
      country: u.country,
      profile_photo: u.profile_photo,
      bio: u.bio,
      role: u.role,
      verification_status: u.verification_status || 'NOT_VERIFIED',
      profile_status: u.profile_status || (u.profile_completed ? 'COMPLETED' : 'INCOMPLETE'),
      onboarding_status: u.onboarding_status || (isVerified ? (u.profile_completed ? 'PROFILE_COMPLETED' : 'PROFILE_INCOMPLETE') : 'NOT_VERIFIED'),
      profile_completed: !!u.profile_completed,
      connect_required_for_chat: connectRequired,
      connect_credits: u.connect_credits || 0,
      is_premium: !!u.is_premium,
      marital_status: u.marital_status || null,
      preferred_age_min: u.preferred_age_min || null,
      preferred_age_max: u.preferred_age_max || null,
      preferred_distance: u.preferred_distance || null,
      is_online: u.is_online,
      created_at: u.created_at,
    };
  }

  calcAge(dob) {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  async register(data) {
    const { username, email, password, city, state = '', country = 'India' } = data;
    const rawGender = String(data.selected_gender || data.gender || '').toLowerCase().trim();
    if (!['female', 'male'].includes(rawGender)) {
      throw new Error('Please select your gender (Female or Male) to register.');
    }
    const gender = rawGender;
    const dob = data.dob || data.date_of_birth;
    const age = this.calcAge(dob);
    if (age < 18) throw new Error('You must be at least 18 years old.');

    const exists = await userRepo.exists(email, username);
    if (exists) throw new Error('Email or username already in use.');

    const passwordHash = await hash(password);
    const user = await userRepo.create({
      username, email, passwordHash, gender, dob, age, city, state, country
    });

    const token = sign({ id: user.id, role: user.role, gender: user.gender, username: user.username });
    return { token, user: this.formatUser(user), next_route: '/verify' };
  }

  async login(identifier, password) {
    const user = await userRepo.findByEmailOrUsername(identifier);
    if (!user) throw new Error('Invalid credentials.');
    if (user.is_banned) throw new Error(`Account banned: ${user.ban_reason || 'Terms violation.'}`);

    const isValid = await compare(password, user.password_hash);
    if (!isValid) throw new Error('Invalid credentials.');

    await userRepo.updateOnlineStatus(user.id, true);
    const formatted = this.formatUser({ ...user, is_online: true });
    const token = sign({ id: user.id, role: user.role, gender: formatted.gender, username: user.username });
    return { token, user: formatted };
  }

  async logout(userId) {
    await userRepo.updateOnlineStatus(userId, false);
    return true;
  }

  async getCurrentUser(userId) {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error('User not found.');
    delete user.password_hash;
    delete user.photo_bytes;
    return { ...user, ...this.formatUser(user) };
  }
}

module.exports = new AuthService();
