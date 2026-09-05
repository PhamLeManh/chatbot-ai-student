const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');

// Lấy gợi ý câu hỏi (có thể xem không cần đăng nhập)
router.get('/quick-prompts', optionalAuth, chatController.getQuickPrompts);

// Gửi tin nhắn chat và đánh giá phản hồi (yêu cầu đăng nhập)
router.post('/send', protect, chatController.sendMessage);
router.put('/messages/:id/feedback', protect, chatController.giveFeedback);

module.exports = router;
