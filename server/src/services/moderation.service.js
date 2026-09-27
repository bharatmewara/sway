'use strict';

const reportRepo = require('../repositories/report.repository');

class ModerationService {
  async submitReport(reporterId, reportedId, reason, description) {
    if (reporterId === reportedId) throw new Error('You cannot report yourself.');
    if (String(reason).toLowerCase() === 'block') {
      await reportRepo.blockUser(reporterId, reportedId, description || 'Blocked');
    }
    return reportRepo.createReport(reporterId, reportedId, reason, description);
  }

  async blockUser(blockerId, blockedId, reason) {
    if (blockerId === blockedId) throw new Error('You cannot block yourself.');
    await reportRepo.blockUser(blockerId, blockedId, reason);
    return true;
  }

  async unblockUser(blockerId, blockedId) {
    await reportRepo.unblockUser(blockerId, blockedId);
    return true;
  }

  async getBlockedUsers(blockerId) {
    return reportRepo.getBlockedUsers(blockerId);
  }
}

module.exports = new ModerationService();
