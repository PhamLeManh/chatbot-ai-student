const chatService = require('../services/chat.service');
const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/response');

class ChatController {
  // POST /api/chat/send
  async sendMessage(req, res, next) {
    try {
      const { conversationId, content, attachments } = req.body;

      if (!content || content.trim().length === 0) {
        return errorResponse(res, 'Nội dung tin nhắn không được để trống.', null, 400);
      }

      const userContext = {
        name: req.user.name,
        major: req.user.major,
        university: req.user.university,
      };

      const result = await chatService.sendMessage({
        userId: req.user._id,
        conversationId,
        content: content.trim(),
        attachments: attachments || [],
        userContext,
      });

      return successResponse(res, 'Gửi tin nhắn thành công.', result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/chat/quick-prompts
  async getQuickPrompts(req, res) {
    const quickPrompts = [
      {
        id: 'math-calc',
        category: 'Toán học',
        icon: 'fa-calculator',
        title: 'Giải tích & Đạo hàm',
        prompt: 'Hãy giải thích và nêu các bước tính tích phân từng phần của hàm số f(x) = x * e^x kèm ví dụ minh họa.',
      },
      {
        id: 'coding-algo',
        category: 'Lập trình',
        icon: 'fa-code',
        title: 'Thuật toán QuickSort',
        prompt: 'Giải thích nguyên lý hoạt động của thuật toán QuickSort, viết code bằng JavaScript và đánh giá độ phức tạp thuật toán.',
      },
      {
        id: 'study-plan',
        category: 'Luyện thi',
        icon: 'fa-calendar-check',
        title: 'Lộ trình ôn thi 7 ngày',
        prompt: 'Tôi còn 7 ngày nữa là thi môn Cấu trúc Dữ liệu và Giải thuật, hãy lập cho tôi lộ trình ôn thi hiệu quả mỗi ngày 3 giờ.',
      },
      {
        id: 'english-ielts',
        category: 'Tiếng Anh',
        icon: 'fa-language',
        title: 'Cải thiện bài viết Essay',
        prompt: 'Hãy hướng dẫn cách viết phần Mở bài (Introduction) chuẩn bài luận IELTS Writing Task 2 về chủ đề Công nghệ và Giáo dục.',
      },
      {
        id: 'physics-circuits',
        category: 'Vật lý / Điện',
        icon: 'fa-bolt',
        title: 'Định luật Kirchhoff',
        prompt: 'Phát biểu định luật Kirchhoff 1 (KCL) và định luật Kirchhoff 2 (KVL) trong mạch điện xoay chiều kèm ví dụ tính dòng điện.',
      },
      {
        id: 'study-methods',
        category: 'Kỹ năng học',
        icon: 'fa-lightbulb',
        title: 'Kỹ thuật Feynman',
        prompt: 'Kỹ thuật học tập Feynman là gì? Làm thế nào để áp dụng kỹ thuật này để hiểu sâu một định lý phức tạp trong 20 phút?',
      },
    ];

    return successResponse(res, 'Lấy danh sách gợi ý câu hỏi thành công.', quickPrompts);
  }

  // PUT /api/chat/messages/:id/feedback
  async giveFeedback(req, res, next) {
    try {
      const { feedback } = req.body; // 'like', 'dislike', 'none'
      const message = await Message.findByIdAndUpdate(
        req.params.id,
        { feedback },
        { new: true }
      );
      if (!message) return errorResponse(res, 'Không tìm thấy tin nhắn.', null, 404);
      return successResponse(res, 'Cảm ơn bạn đã gửi đánh giá phản hồi!', message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
