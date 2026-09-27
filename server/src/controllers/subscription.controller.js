'use strict';

const paymentService = require('../services/payment.service');
const chatService = require('../services/chat.service');
const { ok, fail } = require('../utils/response');

exports.getPlans = async (req, res) => {
  try {
    const plans = await paymentService.getSubscriptionPlans();
    return ok(res, { plans });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.getCreditPacks = async (req, res) => {
  try {
    const [packs, config, rzpConfig] = await Promise.all([
      paymentService.getCreditPacks(),
      chatService.getAdminConfig(),
      paymentService.getRazorpayConfig(),
    ]);
    return ok(res, {
      packs,
      config,
      razorpay: {
        enabled: rzpConfig.enabled,
        keyId: rzpConfig.keyId,
        currency: rzpConfig.currency,
        brandName: rzpConfig.brandName,
        mode: rzpConfig.mode,
      },
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const orderData = await paymentService.createRazorpayOrder(req.user.id, req.body);
    return ok(res, orderData);
  } catch (err) {
    console.error('[PAYMENTS] createOrder error:', err);
    return fail(res, err.message || 'Could not create Razorpay order.', 500);
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const result = await paymentService.verifyRazorpayPayment(req.user.id, req.body);
    return ok(res, {
      message: `${result.creditsAdded} Connects added to your wallet!`,
      ...result,
    });
  } catch (err) {
    console.error('[PAYMENTS] verifyPayment error:', err);
    return fail(res, err.message || 'Payment verification failed.', 400);
  }
};

exports.purchaseCredits = async (req, res) => {
  try {
    const { pack_id, amount, payment_id } = req.body;
    const result = await paymentService.addCredits(
      req.user.id,
      pack_id,
      amount,
      payment_id || `pay_${Date.now()}`
    );
    return ok(res, { message: 'Connects successfully added.', ...result });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await paymentService.getConnectTransactions(req.user.id);
    return ok(res, { transactions });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.adjustConnects = async (req, res) => {
  try {
    const { user_id, amount, transaction_type, description } = req.body;
    const targetUserId = parseInt(user_id || req.user.id, 10);
    const result = await paymentService.adjustConnects({
      userId: targetUserId,
      amount: parseInt(amount || '0', 10),
      transactionType: transaction_type,
      description,
    });
    return ok(res, { message: 'Connect balance adjusted.', ...result });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};
