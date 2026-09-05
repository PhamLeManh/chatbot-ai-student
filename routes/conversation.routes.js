const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Tất cả các route conversation yêu cầu đăng nhập

router.get('/', conversationController.getConversations);
router.post('/', conversationController.createConversation);
router.get('/:id', conversationController.getConversation);
router.put('/:id/rename', conversationController.renameConversation);
router.put('/:id/pin', conversationController.togglePin);
router.delete('/:id', conversationController.deleteConversation);
router.delete('/:id/clear', conversationController.clearMessages);

module.exports = router;
