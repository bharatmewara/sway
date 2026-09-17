'use strict';

const reportRepo = require('../repositories/report.repository');

class ModerationService {
  async submitReport(reporterId, reportedId, reason, description) {
    if (reporterId === reportedId) throw new Error('You cannot report yourself.');
    return reportRepo.createReport(reporterId, reportedId, reason, description);
  }

  async blockUser(blockerId, blockedId, reason) {
    if (blockerId === blockedId) throw new Error('You cannot block yourself.');
    await reportRepo.blockUser(blockerId, blockedId, reason);
    return true;
  }
}

module.exports = new ModerationService();
