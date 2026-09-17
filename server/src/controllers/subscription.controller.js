'use strict';

const paymentService = require('../services/payment.service');
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
    const packs = await paymentService.getCreditPacks();
    return ok(res, { packs });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.purchaseCredits = async (req, res) => {
  try {
    const { pack_id, amount, payment_id } = req.body;
    const result = await paymentService.addCredits(req.user.id, pack_id, amount, payment_id || 'manual');
    return ok(res, { message: 'Credits successfully added.', ...result });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
