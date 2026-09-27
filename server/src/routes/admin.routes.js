'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { requireAdmin, requirePermission } = require('../middleware/admin.middleware');

// ── Public / Health / Login ───────────────────────────────────────────────────
router.get('/health', ctrl.health);
router.post('/login', ctrl.login);

// ── Protected Admin Routes ────────────────────────────────────────────────────
router.use(requireAdmin);

router.get('/me', ctrl.getMe);

// ── Dashboard & Analytics ─────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);
router.get('/analytics', requirePermission('analytics.view'), ctrl.getAnalytics);

// ── Users Management ──────────────────────────────────────────────────────────
router.get('/users', requirePermission('users.view'), ctrl.getUsers);
router.get('/users/:id', requirePermission('users.view'), ctrl.getUserDetail);
router.put('/users/:id', requirePermission('users.edit'), ctrl.updateUser);
router.put('/users/:id/status', requirePermission('users.status'), ctrl.updateUserStatus);
router.put('/users/:id/ban', requirePermission('users.status'), ctrl.banUser);
router.put('/users/:id/unban', requirePermission('users.status'), ctrl.unbanUser);
router.post('/users/:id/block', requirePermission('users.block'), ctrl.banUser);
router.post('/users/:id/unblock', requirePermission('users.block'), ctrl.unbanUser);
router.put('/users/:id/verify', requirePermission('users.verify'), ctrl.verifyUser);
router.post('/users/:id/connects', requirePermission('connects.manage'), ctrl.adjustUserConnects);
router.put('/users/:id/add-credits', requirePermission('connects.manage'), ctrl.adjustUserConnects);
router.delete('/users/:id', requirePermission('users.delete'), ctrl.deleteUser);

// ── Verification Queue ────────────────────────────────────────────────────────
router.get('/verifications', requirePermission('users.verify'), ctrl.getVerifications);
router.put('/verifications/:id/approve', requirePermission('users.verify'), (req, res) => {
  req.params.action = 'approve';
  return ctrl.reviewVerificationRequest(req, res);
});
router.put('/verifications/:id/reject', requirePermission('users.verify'), (req, res) => {
  req.params.action = 'reject';
  return ctrl.reviewVerificationRequest(req, res);
});
router.put('/verifications/:id/:action', requirePermission('users.verify'), ctrl.reviewVerificationRequest);

// ── Reports Management ────────────────────────────────────────────────────────
router.get('/reports', requirePermission('reports.view'), ctrl.getReports);
router.get('/reports/:id', requirePermission('reports.view'), ctrl.getReportDetail);
router.put('/reports/:id', requirePermission('reports.resolve'), ctrl.handleReportAction);
router.put('/reports/:id/resolve', requirePermission('reports.resolve'), (req, res) => {
  req.params.action = 'resolve';
  return ctrl.handleReportAction(req, res);
});
router.put('/reports/:id/reject', requirePermission('reports.resolve'), (req, res) => {
  req.params.action = 'reject';
  return ctrl.handleReportAction(req, res);
});
router.put('/reports/:id/escalate', requirePermission('reports.resolve'), (req, res) => {
  req.params.action = 'escalate';
  return ctrl.handleReportAction(req, res);
});
router.put('/reports/:id/:action', requirePermission('reports.resolve'), ctrl.handleReportAction);

// ── Blocks Management ─────────────────────────────────────────────────────────
router.get('/blocks', requirePermission('users.block'), ctrl.getBlocks);
router.delete('/blocks/:id', requirePermission('users.block'), ctrl.removeBlock);

// ── Transactions, Payments & Refunds ──────────────────────────────────────────
router.get('/transactions', requirePermission('transactions.view'), ctrl.getTransactions);
router.get('/payments', requirePermission('transactions.view'), ctrl.getTransactions);
router.post('/payments/:id/refund', requirePermission('payments.refund'), ctrl.refundPayment);
router.post('/transactions/:id/refund', requirePermission('payments.refund'), ctrl.refundPayment);

// ── Connects & Packages ───────────────────────────────────────────────────────
router.get('/connects', requirePermission('connects.manage'), ctrl.getConnectsOverview);
router.get('/connects/packages', requirePermission('connects.manage'), ctrl.getConnectPackages);
router.post('/connects/packages', requirePermission('connects.manage'), ctrl.createConnectPackage);
router.put('/connects/packages/:id', requirePermission('connects.manage'), ctrl.updateConnectPackage);
router.delete('/connects/packages/:id', requirePermission('connects.manage'), ctrl.deleteConnectPackage);
router.post('/connects/adjust', requirePermission('connects.manage'), ctrl.adjustUserConnects);

// ── Subscriptions ─────────────────────────────────────────────────────────────
router.get('/subscriptions', requirePermission('transactions.view'), ctrl.getSubscriptions);

// ── Chats & Private Messages Moderation ───────────────────────────────────────
router.get('/chats', requirePermission('chats.view'), ctrl.getChats);
router.get('/private-messages', requirePermission('chats.view'), ctrl.getPrivateMessages);
router.get('/conversations/:id/messages', requirePermission('chats.view'), ctrl.getConversationMessages);
router.put('/conversations/:id/status', requirePermission('chats.moderate'), ctrl.moderateConversation);

// ── Platform & Communication Settings ─────────────────────────────────────────
router.get('/settings', requirePermission('settings.view'), ctrl.getSettings);
router.put('/settings', requirePermission('settings.edit'), ctrl.updateSettings);
router.put('/settings/connects', requirePermission('settings.edit'), ctrl.updateSettings);
router.put('/settings/chat', requirePermission('settings.edit'), ctrl.updateSettings);
router.put('/settings/private-messages', requirePermission('settings.edit'), ctrl.updateSettings);

// ── Notifications Broadcast ───────────────────────────────────────────────────
router.get('/notifications', requirePermission('notifications.send'), ctrl.getNotifications);
router.post('/notifications', requirePermission('notifications.send'), ctrl.sendNotification);

// ── Admin Users, Roles & Audit Logs ───────────────────────────────────────────
router.get('/admins', ctrl.getAdmins);
router.post('/admins', requirePermission('settings.edit'), ctrl.updateAdminRole);
router.put('/admins/:id', requirePermission('settings.edit'), ctrl.updateAdminRole);
router.get('/audit-logs', requirePermission('audit.view'), ctrl.getAuditLogs);

module.exports = router;
