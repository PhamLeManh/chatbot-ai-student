const chatService = require('../services/chat.service');
const { successResponse } = require('../utils/response');

class ConversationController {
  // GET /api/conversations
  async getConversations(req, res, next) {
    try {
      const conversations = await chatService.getUserConversations(req.user._id);
      return successResponse(res, 'Lấy danh sách đoạn hội thoại thành công.', conversations);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/conversations/:id
  async getConversation(req, res, next) {
    try {
      const result = await chatService.getConversationMessages(req.params.id, req.user._id);
      return successResponse(res, 'Lấy chi tiết đoạn hội thoại thành công.', result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/conversations
  async createConversation(req, res, next) {
    try {
      const { title, subject } = req.body;
      const conversation = await chatService.createConversation(req.user._id, title, subject);
      return successResponse(res, 'Tạo cuộc hội thoại mới thành công.', conversation, 201);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/conversations/:id/rename
  async renameConversation(req, res, next) {
    try {
      const { title } = req.body;
      const conversation = await chatService.renameConversation(req.params.id, req.user._id, title);
      return successResponse(res, 'Đổi tên cuộc hội thoại thành công.', conversation);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/conversations/:id/pin
  async togglePin(req, res, next) {
    try {
      const conversation = await chatService.togglePinConversation(req.params.id, req.user._id);
      return successResponse(res, 'Cập nhật ghim hội thoại thành công.', conversation);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/conversations/:id
  async deleteConversation(req, res, next) {
    try {
      const result = await chatService.deleteConversation(req.params.id, req.user._id);
      return successResponse(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/conversations/:id/clear
  async clearMessages(req, res, next) {
    try {
      const result = await chatService.clearMessages(req.params.id, req.user._id);
      return successResponse(res, 'Đã làm mới nội dung đoạn chat.', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConversationController();
