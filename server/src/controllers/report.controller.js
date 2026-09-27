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
    const blockedId = parseInt(req.body.blocked_id || req.body.user_id || req.body.reported_id, 10);
    if (!blockedId || isNaN(blockedId)) return fail(res, 'blocked_id is required.', 400);

    await moderationService.blockUser(req.user.id, blockedId, req.body.reason || 'Blocked by user');
    return ok(res, { message: 'User blocked successfully.', blocked_id: blockedId });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const blockedId = parseInt(req.params.blockedId || req.body.blocked_id, 10);
    if (!blockedId || isNaN(blockedId)) return fail(res, 'blocked_id is required.', 400);

    await moderationService.unblockUser(req.user.id, blockedId);
    return ok(res, { message: 'User unblocked successfully.', blocked_id: blockedId });
  } catch (err) {
    return fail(res, err.message, 400);
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const blocks = await moderationService.getBlockedUsers(req.user.id);
    return ok(res, { blocks });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
