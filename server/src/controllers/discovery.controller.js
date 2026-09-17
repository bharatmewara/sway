'use strict';

const matchingService = require('../services/matching.service');
const { ok, fail } = require('../utils/response');

exports.getFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const profiles = await matchingService.getDiscoveryQueue(req.user.id, limit);
    return ok(res, { profiles });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.swipe = async (req, res) => {
  try {
    const { target_user_id, type = 'like', message = null } = req.body;
    if (!target_user_id) return fail(res, 'target_user_id is required.', 400);

    const result = await matchingService.processSwipe(req.user.id, parseInt(target_user_id, 10), type, message);

    if (result.matched) {
      req.app.get('io')?.to(`user_${target_user_id}`).emit('new_match', {
        user: { id: req.user.id, username: req.user.username },
        match: result.match
      });
    }

    return ok(res, { message: 'Swipe recorded.', ...result });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
