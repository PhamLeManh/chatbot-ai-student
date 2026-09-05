const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const aiService = require('./ai.service');

class ChatService {
  /**
   * Lấy danh sách cuộc trò chuyện của người dùng
   */
  async getUserConversations(userId) {
    return await Conversation.find({ userId }).sort({ isPinned: -1, updatedAt: -1 });
  }

  /**
   * Lấy chi tiết cuộc trò chuyện và các tin nhắn bên trong
   */
  async getConversationMessages(conversationId, userId) {
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      throw new Error('Không tìm thấy cuộc trò chuyện này.');
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return { conversation, messages };
  }

  /**
   * Tạo cuộc trò chuyện mới
   */
  async createConversation(userId, title = 'Đoạn hội thoại mới', subject = 'Tổng hợp') {
    const conversation = await Conversation.create({
      userId,
      title,
      subject,
    });
    return conversation;
  }

  /**
   * Gửi tin nhắn và nhận phản hồi từ AI
   */
  async sendMessage({ userId, conversationId, content, attachments = [], userContext = {} }) {
    let conversation;

    // Nếu chưa có conversationId, tự động tạo mới
    if (!conversationId) {
      const summaryTitle = content.length > 30 ? content.substring(0, 30) + '...' : content;
      conversation = await Conversation.create({
        userId,
        title: summaryTitle || 'Chủ đề học tập mới',
      });
      conversationId = conversation._id;
    } else {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) {
        throw new Error('Cuộc trò chuyện không tồn tại.');
      }
    }

    // 1. Lưu tin nhắn của Người dùng
    const userMessage = await Message.create({
      conversationId,
      userId,
      sender: 'user',
      content,
      attachments,
    });

    // 2. Lấy ngữ cảnh các tin nhắn gần nhất trong đoạn hội thoại (tối đa 10 tin nhắn gần nhất)
    const recentMessages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(10);
    recentMessages.reverse();

    // 3. Gọi AI Service để sinh câu trả lời
    const aiResult = await aiService.generateChatResponse({
      messages: recentMessages,
      userContext,
    });

    // 4. Lưu tin nhắn của AI Assistant
    const aiMessage = await Message.create({
      conversationId,
      userId,
      sender: 'assistant',
      content: aiResult.content,
      meta: {
        model: aiResult.model,
        tokens: aiResult.tokens,
      },
    });

    // 5. Cập nhật preview và số lượng tin nhắn trong Conversation
    conversation.lastMessagePreview = aiResult.content.substring(0, 80);
    conversation.messageCount = await Message.countDocuments({ conversationId });
    if (conversation.title === 'Đoạn hội thoại mới' && content.length > 0) {
      conversation.title = content.length > 30 ? content.substring(0, 30) + '...' : content;
    }
    await conversation.save();

    return {
      conversation,
      userMessage,
      aiMessage,
    };
  }

  /**
   * Đổi tên cuộc hội thoại
   */
  async renameConversation(conversationId, userId, title) {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId },
      { title },
      { new: true }
    );
    if (!conversation) throw new Error('Không tìm thấy cuộc trò chuyện.');
    return conversation;
  }

  /**
   * Ghim / Bỏ ghim cuộc trò chuyện
   */
  async togglePinConversation(conversationId, userId) {
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) throw new Error('Không tìm thấy cuộc trò chuyện.');
    conversation.isPinned = !conversation.isPinned;
    await conversation.save();
    return conversation;
  }

  /**
   * Xóa cuộc trò chuyện và toàn bộ tin nhắn
   */
  async deleteConversation(conversationId, userId) {
    const conversation = await Conversation.findOneAndDelete({ _id: conversationId, userId });
    if (!conversation) throw new Error('Không tìm thấy cuộc trò chuyện để xóa.');
    await Message.deleteMany({ conversationId });
    return { message: 'Đã xóa cuộc trò chuyện thành công.' };
  }

  /**
   * Xóa toàn bộ lịch sử tin nhắn trong cuộc trò chuyện
   */
  async clearMessages(conversationId, userId) {
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) throw new Error('Không tìm thấy cuộc trò chuyện.');
    await Message.deleteMany({ conversationId });
    conversation.lastMessagePreview = '';
    conversation.messageCount = 0;
    await conversation.save();
    return conversation;
  }
}

module.exports = new ChatService();
