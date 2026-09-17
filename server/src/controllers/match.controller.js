'use strict';

const matchingService = require('../services/matching.service');
const { ok, fail } = require('../utils/response');

exports.getMatches = async (req, res) => {
  try {
    const matches = await matchingService.getMatches(req.user.id);
    return ok(res, { matches });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

exports.unmatch = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    await matchingService.unmatch(req.user.id, targetUserId);
    return ok(res, { message: 'Unmatched successfully.' });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};
