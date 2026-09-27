'use strict';

const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../config/database');
const env = require('../config/env');
const userRepo = require('../repositories/user.repository');

class PaymentService {
  async getRazorpayConfig() {
    // Re-read .env in case keys were updated without full process restart
    require('dotenv').config({ override: true });

    let dbPaymentSettings = {};
    try {
      const { rows } = await pool.query(
        `SELECT settings FROM admin_platform_settings WHERE category = 'payment' LIMIT 1`
      );
      if (rows.length && rows[0].settings) {
        dbPaymentSettings = rows[0].settings;
      }
    } catch (_) {}

    const envKeyId = (process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || '').trim();
    const envKeySecret = (process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET || '').trim();
    const dbKeyId = (dbPaymentSettings.razorpay_key_id || '').trim();
    const dbKeySecret = (dbPaymentSettings.razorpay_key_secret || '').trim();

    // Prioritize .env keys when configured (especially if .env has rzp_live_ key)
    const keyId = envKeyId || dbKeyId;
    const keySecret = envKeySecret || dbKeySecret;
    const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || dbPaymentSettings.razorpay_webhook_secret || env.RAZORPAY_WEBHOOK_SECRET || '').trim();
    const enabled = dbPaymentSettings.razorpay_enabled !== undefined ? Boolean(dbPaymentSettings.razorpay_enabled) : Boolean(keyId);
    const currency = (dbPaymentSettings.currency || 'INR').toUpperCase();
    const brandName = dbPaymentSettings.brand_name || 'SWAY';

    return {
      enabled,
      keyId,
      keySecret,
      webhookSecret,
      currency,
      brandName,
      isConfigured: Boolean(keyId && keySecret),
      mode: keyId.startsWith('rzp_live_') ? 'live' : 'test',
    };
  }

  async getSubscriptionPlans() {
    const res = await pool.query('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_inr ASC');
    return res.rows;
  }

  async getCreditPacks() {
    try {
      const res = await pool.query(
        `SELECT id, name, credits, COALESCE(bonus_connects, 0) AS bonus_connects,
                price_inr, COALESCE(currency, 'INR') AS currency,
                COALESCE(discount, 0) AS discount, is_popular AS popular
         FROM connect_packs
         WHERE is_active = true
         ORDER BY display_order ASC, credits ASC`
      );
      if (res.rows.length > 0) {
        return res.rows.map((r, idx) => ({
          ...r,
          id: `pack_${r.credits}`,
          db_id: r.id,
          total_credits: Number(r.credits) + Number(r.bonus_connects || 0),
          variant: idx === 1 ? 'purple' : idx >= 2 ? 'dark' : '',
        }));
      }
    } catch (_) {}
    return [
      { id: 'pack_25',  db_id: 1, name: 'Pack 25',  credits: 25,  bonus_connects: 0, total_credits: 25,  price_inr: 1500, currency: 'INR', popular: true },
      { id: 'pack_100', db_id: 2, name: 'Pack 100', credits: 100, bonus_connects: 0, total_credits: 100, price_inr: 4200, currency: 'INR', variant: 'purple' },
      { id: 'pack_400', db_id: 3, name: 'Pack 400', credits: 400, bonus_connects: 0, total_credits: 400, price_inr: 9600, currency: 'INR', variant: 'dark' },
    ];
  }

  async resolvePack(packId, packName, amountInr) {
    const packs = await this.getCreditPacks();
    const matched = packs.find(
      (p) =>
        (packId && (String(p.id) === String(packId) || String(p.db_id) === String(packId))) ||
        (packName && String(p.name).toLowerCase() === String(packName).toLowerCase()) ||
        (amountInr && Number(p.price_inr) === Number(amountInr))
    );
    if (matched) return matched;

    const fallbackCredits = String(packId || packName || '').includes('400')
      ? 400
      : String(packId || packName || '').includes('100')
      ? 100
      : 25;
    return {
      id: packId || `pack_${fallbackCredits}`,
      name: packName || `Pack ${fallbackCredits}`,
      credits: fallbackCredits,
      bonus_connects: 0,
      total_credits: fallbackCredits,
      price_inr: Number(amountInr) || 1500,
      currency: 'INR',
    };
  }

  async createRazorpayOrder(userId, { pack_id, pack_name, amount_inr }) {
    const rzpConfig = await this.getRazorpayConfig();
    const pack = await this.resolvePack(pack_id, pack_name, amount_inr);
    const priceInr = Number(pack.price_inr || amount_inr || 1500);
    const amountPaise = Math.round(priceInr * 100);
    const currency = rzpConfig.currency || 'INR';
    const receipt = `sway_rcpt_${userId}_${Date.now()}`;

    let orderId = null;
    let gatewayMode = 'razorpay_sdk';

    if (rzpConfig.keyId && rzpConfig.keySecret) {
      try {
        const rzp = new Razorpay({
          key_id: rzpConfig.keyId,
          key_secret: rzpConfig.keySecret,
        });
        const rzpOrder = await rzp.orders.create({
          amount: amountPaise,
          currency,
          receipt,
          notes: {
            user_id: String(userId),
            pack_id: String(pack.id),
            pack_name: String(pack.name),
            credits: String(pack.total_credits || pack.credits),
          },
        });
        orderId = rzpOrder.id;
      } catch (sdkErr) {
        console.warn('[RAZORPAY] SDK order creation fallback (check API key/secret if in live mode):', sdkErr.error?.description || sdkErr.message);
        gatewayMode = 'razorpay_checkout_direct';
      }
    } else {
      gatewayMode = 'razorpay_unconfigured';
    }

    const trackingOrderId = orderId || `order_sway_${userId}_${Date.now()}`;

    // Log pending transaction in PostgreSQL
    const txRes = await pool.query(
      `INSERT INTO transactions (
         user_id, razorpay_order_id, pack_name, credits_purchased,
         amount_inr, amount_paise, currency, gateway, status, payment_method, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'razorpay', 'pending', 'razorpay', NOW())
       RETURNING *`,
      [
        userId,
        trackingOrderId,
        pack.name,
        pack.total_credits || pack.credits,
        priceInr,
        amountPaise,
        currency,
      ]
    );

    return {
      orderId: orderId, // Native Razorpay order_id (or null if using standard amount-based checkout)
      trackingOrderId,
      transactionId: txRes.rows[0].id,
      amount: amountPaise,
      amountInr: priceInr,
      currency,
      keyId: rzpConfig.keyId,
      brandName: rzpConfig.brandName,
      pack: {
        id: pack.id,
        name: pack.name,
        credits: pack.total_credits || pack.credits,
        price_inr: priceInr,
      },
      gatewayMode,
    };
  }

  async verifyRazorpayPayment(userId, payload) {
    const {
      orderCreationId,
      trackingOrderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      pack_id,
      pack_name,
      amount_inr,
    } = payload;

    const paymentId = razorpayPaymentId || payload.razorpay_payment_id;
    const orderId = razorpayOrderId || payload.razorpay_order_id || orderCreationId || trackingOrderId;
    const signature = razorpaySignature || payload.razorpay_signature;

    if (!paymentId) {
      throw new Error('Missing Razorpay Payment ID.');
    }

    const rzpConfig = await this.getRazorpayConfig();

    // If Razorpay returned both razorpay_order_id and razorpay_signature, verify HMAC-SHA256 signature
    if ( (razorpayOrderId || payload.razorpay_order_id) && signature && rzpConfig.keySecret ) {
      const rzpOrdId = razorpayOrderId || payload.razorpay_order_id;
      const expectedSig = crypto
        .createHmac('sha256', rzpConfig.keySecret)
        .update(`${rzpOrdId}|${paymentId}`)
        .digest('hex');

      if (expectedSig !== signature) {
        await pool.query(
          `UPDATE transactions
           SET status = 'failed', failure_reason = 'Invalid Razorpay HMAC signature'
           WHERE razorpay_order_id = $1`,
          [rzpOrdId]
        ).catch(() => {});
        throw new Error('Razorpay payment signature verification failed.');
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Idempotency check: ensure this paymentId hasn't already been credited
      const existingPaid = await client.query(
        `SELECT * FROM transactions WHERE razorpay_payment_id = $1 AND status = 'success' LIMIT 1`,
        [paymentId]
      );
      if (existingPaid.rows.length > 0) {
        const userRow = await client.query(`SELECT connect_credits FROM users WHERE id = $1`, [userId]);
        await client.query('COMMIT');
        return {
          alreadyProcessed: true,
          creditsAdded: existingPaid.rows[0].credits_purchased,
          connect_credits: userRow.rows[0]?.connect_credits || 0,
          transaction: existingPaid.rows[0],
        };
      }

      // Look up pending transaction by orderId
      let pendingTx = null;
      if (orderId) {
        const pRes = await client.query(
          `SELECT * FROM transactions WHERE razorpay_order_id = $1 AND user_id = $2 ORDER BY id DESC LIMIT 1 FOR UPDATE`,
          [orderId, userId]
        );
        pendingTx = pRes.rows[0] || null;
      }

      const pack = await this.resolvePack(
        pack_id,
        pendingTx?.pack_name || pack_name,
        pendingTx?.amount_inr || amount_inr
      );
      const creditsToAdd = Number(pendingTx?.credits_purchased || pack.total_credits || pack.credits || 25);
      const priceInr = Number(pendingTx?.amount_inr || pack.price_inr || amount_inr || 1500);

      // Lock user row and update Connect balance
      const uRes = await client.query(
        `SELECT id, username, COALESCE(connect_credits, 0) AS connect_credits FROM users WHERE id = $1 FOR UPDATE`,
        [userId]
      );
      if (!uRes.rows.length) {
        throw new Error('User not found.');
      }
      const previousBalance = Number(uRes.rows[0].connect_credits) || 0;
      const newBalance = previousBalance + creditsToAdd;

      await client.query(
        `UPDATE users SET connect_credits = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance, userId]
      );

      let finalTxRow = null;
      if (pendingTx) {
        const upTx = await client.query(
          `UPDATE transactions
           SET razorpay_payment_id = $1,
               razorpay_signature = $2,
               status = 'success',
               payment_method = 'razorpay',
               completed_at = NOW()
           WHERE id = $3
           RETURNING *`,
          [paymentId, signature || null, pendingTx.id]
        );
        finalTxRow = upTx.rows[0];
      } else {
        const insTx = await client.query(
          `INSERT INTO transactions (
             user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
             pack_name, credits_purchased, amount_inr, amount_paise,
             currency, gateway, status, payment_method, created_at, completed_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INR', 'razorpay', 'success', 'razorpay', NOW(), NOW())
           RETURNING *`,
          [
            userId,
            orderId || `order_${Date.now()}`,
            paymentId,
            signature || null,
            pack.name,
            creditsToAdd,
            priceInr,
            Math.round(priceInr * 100),
          ]
        );
        finalTxRow = insTx.rows[0];
      }

      const ledgerRes = await client.query(
        `INSERT INTO connect_transactions (
           user_id, transaction_type, amount, previous_balance, new_balance,
           payment_reference, status, description, created_at
         ) VALUES ($1, 'PURCHASE', $2, $3, $4, $5, 'COMPLETED', $6, NOW())
         RETURNING *`,
        [
          userId,
          creditsToAdd,
          previousBalance,
          newBalance,
          paymentId,
          `Purchased ${pack.name} (${creditsToAdd} Connects) via Razorpay`,
        ]
      );

      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, is_read, created_at)
         VALUES ($1, 'CONNECT_PURCHASE', 'Connects Added', $2, false, NOW())`,
        [userId, `${creditsToAdd} Connects have been credited to your wallet (New balance: ${newBalance} Connects).`]
      ).catch(() => {});

      await client.query('COMMIT');

      return {
        creditsAdded: creditsToAdd,
        previous_balance: previousBalance,
        new_balance: newBalance,
        connect_credits: newBalance,
        paymentTransaction: finalTxRow,
        transaction: ledgerRes.rows[0],
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  async addCredits(userId, packId, amount, paymentId) {
    return this.verifyRazorpayPayment(userId, {
      razorpayPaymentId: paymentId || `pay_${Date.now()}`,
      pack_id: packId,
      amount_inr: amount,
    });
  }

  async getConnectTransactions(userId, limit = 50) {
    const res = await pool.query(
      `SELECT ct.*,
              ct.new_balance AS balance_after,
              CASE
                WHEN ct.transaction_type IN ('PURCHASE', 'ADMIN_CREDIT', 'ADMIN_ADJUSTMENT', 'PROMOTIONAL_CREDIT', 'REFUND') AND ct.amount >= 0 THEN ct.amount
                WHEN ct.amount < 0 THEN ct.amount
                ELSE -ct.amount
              END AS connects_amount,
              u.username AS related_username, u.profile_photo AS related_photo
       FROM connect_transactions ct
       LEFT JOIN users u ON u.id = ct.related_user_id
       WHERE ct.user_id = $1
       ORDER BY ct.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  async adjustConnects({ userId, amount, transactionType = 'ADMIN_CREDIT', description = 'Admin adjustment' }) {
    const validTypes = ['ADMIN_CREDIT', 'ADMIN_DEBIT', 'PROMOTIONAL_CREDIT', 'REFUND'];
    const txType = validTypes.includes(transactionType) ? transactionType : 'ADMIN_CREDIT';
    const userBefore = await userRepo.findById(userId);
    if (!userBefore) throw new Error('User not found.');
    const previousBalance = userBefore.connect_credits || 0;
    const delta = txType === 'ADMIN_DEBIT' ? -Math.abs(amount) : Math.abs(amount);
    const newBalance = await userRepo.updateCredits(userId, delta);

    const txRes = await pool.query(
      `INSERT INTO connect_transactions (
         user_id, transaction_type, amount, previous_balance, new_balance,
         status, description, created_at
       ) VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6, NOW())
       RETURNING *`,
      [userId, txType, Math.abs(amount), previousBalance, newBalance, description]
    );

    return {
      previous_balance: previousBalance,
      new_balance: newBalance,
      connect_credits: newBalance,
      transaction: txRes.rows[0],
    };
  }
}

module.exports = new PaymentService();
