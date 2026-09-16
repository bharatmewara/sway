'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy',
});

// GET /api/premium/plans
router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_inr ASC');
    res.json({ plans: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/premium/status
router.get('/status', verifyToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT is_premium, premium_expires_at FROM users WHERE id = $1', [req.user.id]);
    const sub = await pool.query(`
      SELECT s.*, sp.name, sp.billing_period, sp.features
      FROM subscriptions s JOIN subscription_plans sp ON sp.id = s.plan_id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.created_at DESC LIMIT 1
    `, [req.user.id]);
    
    res.json({
      is_premium: user.rows[0].is_premium,
      expires_at: user.rows[0].premium_expires_at,
      subscription: sub.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/premium/create-order
router.post('/create-order', verifyToken, async (req, res) => {
  const { plan_id } = req.body;
  try {
    const plan = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [plan_id]);
    if (!plan.rows.length) return res.status(404).json({ error: 'Plan not found' });
    const p = plan.rows[0];

    const order = await razorpay.orders.create({
      amount: p.price_paise,
      currency: 'INR',
      receipt: `sub_${req.user.id}_${Date.now()}`,
      notes: { user_id: req.user.id, plan_id, plan_name: p.name },
    });

    res.json({ orderId: order.id, amount: order.amount, plan: p });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create order' });
  }
});

// POST /api/premium/verify
router.post('/verify', verifyToken, async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan_id } = req.body;
  try {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy')
      .update(body).digest('hex');

    if (expected !== razorpaySignature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const plan = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [plan_id]);
    if (!plan.rows.length) return res.status(404).json({ error: 'Plan not found' });
    const p = plan.rows[0];

    // Calculate expiry based on billing period
    const expiryMonths = p.billing_period === 'monthly' ? 1 : p.billing_period === 'quarterly' ? 3 : 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);

    // Mark user premium
    await pool.query(`
      UPDATE users SET is_premium = true, premium_expires_at = $1 WHERE id = $2
    `, [expiresAt, req.user.id]);

    // Record subscription
    await pool.query(`
      INSERT INTO subscriptions (user_id, plan_id, razorpay_payment_id, status, expires_at)
      VALUES ($1, $2, $3, 'active', $4)
    `, [req.user.id, plan_id, razorpayPaymentId, expiresAt]);

    res.json({ success: true, expires_at: expiresAt, plan: p.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
