'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/config',                                     ctrl.getConfig);
router.put('/config',                                     ctrl.updateConfig);
router.post('/start',                                     ctrl.startSession);
router.post('/reinitiate',                                ctrl.reinitiateSession);
router.post('/unlock',                                    ctrl.unlockMessages);
router.post('/messages/:messageId/unlock',                ctrl.unlockMessages);
router.post('/:messageId/unlock',                         ctrl.unlockMessages);
router.get('/conversations',                              ctrl.getConversations);
router.get('/conversations/:conversationId/messages',     ctrl.getMessages);
router.put('/conversations/:conversationId/read',         ctrl.markRead);
router.get('/with/:userId',                               ctrl.getMessagesByUserId);
router.post('/messages',                                  ctrl.sendMessage);
router.delete('/conversations/:conversationId',            ctrl.deleteConversation);

module.exports = router;
