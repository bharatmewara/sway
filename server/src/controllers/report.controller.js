'use strict';

const moderationService = require('../services/moderation.service');
const { ok, fail } = require('../utils/response');

exports.reportUser = async (req, res) => {
  try {
    const { reported_id, reason, description } = req.body;
    if (!reported_id || !reason) return fail(res, 'reported_id and reason are required.', 400);

    const report = await moderationService.submitReport(
      req.user.id,
      parseInt(reported_id, 10),
      reason,
      description
    );
    return ok(res, { message: 'Report submitted for review.', report }, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { blocked_id, reason } = req.body;
    if (!blocked_id) return fail(res, 'blocked_id is required.', 400);

    await moderationService.blockUser(req.user.id, parseInt(blocked_id, 10), reason);
    return ok(res, { message: 'User blocked successfully.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
