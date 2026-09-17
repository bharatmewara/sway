'use strict';

const userRepo = require('../repositories/user.repository');
const { hash, compare } = require('../utils/password');
const { sign } = require('../utils/jwt');

class AuthService {
  formatUser(u) {
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      gender: u.gender,
      dob: u.date_of_birth,
      age: u.age,
      city: u.city,
      state: u.state,
      country: u.country,
      profile_photo: u.profile_photo,
      bio: u.bio,
      role: u.role,
      verification_status: u.verification_status || 'verified',
      connect_credits: u.connect_credits,
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
    const { username, email, password, gender, dob, city, state, country } = data;
    const age = this.calcAge(dob);
    if (age < 18) throw new Error('You must be at least 18 years old.');

    const exists = await userRepo.exists(email, username);
    if (exists) throw new Error('Email or username already in use.');

    const passwordHash = await hash(password);
    const user = await userRepo.create({
      username, email, passwordHash, gender, dob, age, city, state, country
    });

    const token = sign({ id: user.id, role: user.role, gender: user.gender, username: user.username });
    return { token, user: this.formatUser(user) };
  }

  async login(identifier, password) {
    const user = await userRepo.findByEmailOrUsername(identifier);
    if (!user) throw new Error('Invalid credentials.');
    if (user.is_banned) throw new Error(`Account banned: ${user.ban_reason || 'Terms violation.'}`);

    const isValid = await compare(password, user.password_hash);
    if (!isValid) throw new Error('Invalid credentials.');

    await userRepo.updateOnlineStatus(user.id, true);
    const token = sign({ id: user.id, role: user.role, gender: user.gender, username: user.username });
    return { token, user: this.formatUser({ ...user, is_online: true }) };
  }

  async logout(userId) {
    await userRepo.updateOnlineStatus(userId, false);
    return true;
  }

  async getCurrentUser(userId) {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error('User not found.');
    delete user.password_hash;
    return user;
  }
}

module.exports = new AuthService();
