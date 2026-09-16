'use strict';

const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

const CREDIT_PLANS = [
  { id: 'pack_25',  name: 'Pack 25',  credits: 25,  price_inr: 1500,  price_paise: 150000  },
  { id: 'pack_100', name: 'Pack 100', credits: 100, price_inr: 4200,  price_paise: 420000  },
  { id: 'pack_400', name: 'Pack 400', credits: 400, price_inr: 9600,  price_paise: 960000  },
];

const getRazorpay = () => {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ─── GET /plans ───────────────────────────────────────────────────────────────

router.get('/plans', (req, res) => {
  return res.status(200).json({ success: true, plans: CREDIT_PLANS });
});

// ─── GET /credit-balance ──────────────────────────────────────────────────────

router.get('/credit-balance', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT credits FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, credits: result.rows[0].credits });
  } catch (err) {
    console.error('[PAYMENTS] /credit-balance error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /create-order ───────────────────────────────────────────────────────

router.post('/create-order', async (req, res) => {
  const client = await pool.connect();
  try {
    const { plan_id } = req.body;
    if (!plan_id) {
      return res.status(400).json({ success: false, message: 'plan_id is required.' });
    }

    const plan = CREDIT_PLANS.find((p) => p.id === plan_id);
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan ID.' });
    }

    const razorpay = getRazorpay();

    const orderOptions = {
      amount: plan.price_paise,
      currency: 'INR',
      receipt: `rcpt_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: req.user.id.toString(),
        plan_id: plan.id,
        credits: plan.credits.toString(),
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO transactions
         (user_id, razorpay_order_id, plan_id, credits, amount_inr, amount_paise, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
      [
        req.user.id, order.id, plan.id, plan.credits,
        plan.price_inr, plan.price_paise,
      ]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: plan.price_paise,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
      plan,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PAYMENTS] /create-order error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error creating order.' });
  } finally {
    client.release();
  }
});

// ─── POST /verify ─────────────────────────────────────────────────────────────

router.post('/verify', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      });
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    await client.query('BEGIN');

    // Find the pending transaction
    const txResult = await client.query(
      `SELECT * FROM transactions
       WHERE razorpay_order_id = $1 AND user_id = $2 AND status = 'pending'
       FOR UPDATE`,
      [razorpay_order_id, req.user.id]
    );

    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already processed.',
      });
    }

    const tx = txResult.rows[0];

    // Update transaction status
    await client.query(
      `UPDATE transactions
       SET status = 'success', razorpay_payment_id = $1, razorpay_signature = $2, updated_at = NOW()
       WHERE id = $3`,
      [razorpay_payment_id, razorpay_signature, tx.id]
    );

    // Add credits to user
    await client.query(
      `UPDATE users SET credits = credits + $1, updated_at = NOW() WHERE id = $2`,
      [tx.credits, req.user.id]
    );

    // Log credit addition
    await client.query(
      `INSERT INTO credit_logs (user_id, action, amount, description, transaction_id, created_at)
       VALUES ($1, 'purchase', $2, $3, $4, NOW())`,
      [req.user.id, tx.credits, `Purchased ${tx.credits} credits (${tx.plan_id})`, tx.id]
    );

    await client.query('COMMIT');

    // Fetch updated balance
    const balResult = await pool.query(`SELECT credits FROM users WHERE id = $1`, [req.user.id]);

    return res.status(200).json({
      success: true,
      message: `Payment verified. ${tx.credits} credits added to your account.`,
      credits_added: tx.credits,
      new_balance: balResult.rows[0].credits,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PAYMENTS] /verify error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error verifying payment.' });
  } finally {
    client.release();
  }
});

// ─── GET /history ─────────────────────────────────────────────────────────────

router.get('/history', async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions WHERE user_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const pages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT id, plan_id, credits, amount_inr, status,
              razorpay_order_id, razorpay_payment_id, created_at, updated_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.status(200).json({
      success: true,
      transactions: result.rows,
      total,
      pages,
      page,
    });
  } catch (err) {
    console.error('[PAYMENTS] /history error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error fetching history.' });
  }
});

module.exports = router;
