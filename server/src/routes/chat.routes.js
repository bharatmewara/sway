'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/conversations', ctrl.getConversations);
router.get('/conversations/:conversationId/messages', ctrl.getMessages);
router.post('/messages', ctrl.sendMessage);
router.put('/conversations/:conversationId/read', ctrl.markRead);

module.exports = router;
