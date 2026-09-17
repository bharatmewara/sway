'use strict';

const pool = require('../config/database');
const userRepo = require('../repositories/user.repository');

class PaymentService {
  async getSubscriptionPlans() {
    const res = await pool.query('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_inr ASC');
    return res.rows;
  }

  async getCreditPacks() {
    return [
      { id: 'pack_50', name: 'Starter Pack', credits: 50, price_inr: 199 },
      { id: 'pack_150', name: 'Popular Pack', credits: 150, price_inr: 499 },
      { id: 'pack_500', name: 'Best Value', credits: 500, price_inr: 999 },
    ];
  }

  async addCredits(userId, packId, amount, paymentId) {
    const packs = {
      pack_50: 50,
      pack_150: 150,
      pack_500: 500,
    };
    const credits = packs[packId] || 50;

    await userRepo.updateCredits(userId, credits);
    await pool.query(
      `INSERT INTO transactions (user_id, razorpay_payment_id, pack_name, credits_purchased, amount_inr, status, created_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, 'success', NOW(), NOW())`,
      [userId, paymentId, packId, credits, amount]
    );

    return { creditsAdded: credits };
  }
}

module.exports = new PaymentService();
