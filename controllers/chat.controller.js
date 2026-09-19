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
        university: req.user.university || 'Trường Đại học Nguyễn Trãi',
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
      // Kiến thức tổng quát & Kỹ năng
      { id: 'coding-python', category: 'Lập trình', icon: 'fa-code', title: 'Viết code & Thuật toán', prompt: 'Hãy viết một hàm giải thuật toán tìm đường đi ngắn nhất Dijkstra và giải thích từng dòng code chi tiết.' },
      { id: 'math-calc', category: 'Toán học', icon: 'fa-square-root-variable', title: 'Giải toán & Công thức', prompt: 'Giải thích ý nghĩa của đạo hàm, tích phân và ứng dụng trong các bài toán tối ưu hóa thực tế.' },
      { id: 'english-ielts', category: 'Ngoại ngữ', icon: 'fa-language', title: 'Luyện dịch & Ngoại ngữ', prompt: 'Dịch đoạn văn sau sang tiếng Anh học thuật và chỉ ra 3 cấu trúc ngữ pháp nâng cao hữu ích.' },
      { id: 'study-tips', category: 'Phương pháp học', icon: 'fa-lightbulb', title: 'Bí quyết Pomodoro & Ôn thi', prompt: 'Hướng dẫn phương pháp Active Recall và Spaced Repetition để ôn thi đạt điểm A+ trong 2 tuần.' },
      
      // 10 Ngành Đào tạo NTU
      { id: 'graphic-design', category: 'Thiết kế đồ họa', icon: 'fa-palette', title: 'Nguyên lý CRAP & Thiết kế', prompt: 'Hãy giải thích 4 nguyên lý thiết kế CRAP (Contrast, Repetition, Alignment, Proximity) và cách xây dựng bộ nhận diện thương hiệu chuyên nghiệp.' },
      { id: 'it-coding', category: 'Công nghệ thông tin', icon: 'fa-laptop-code', title: 'Công nghệ thông tin & AI', prompt: 'Tư vấn lộ trình học lập trình Web Fullstack và các kiến thức nền tảng về Trí tuệ nhân tạo (AI/ML) tại NTU.' },
      { id: 'business-admin', category: 'Quản trị kinh doanh', icon: 'fa-briefcase', title: 'Quản trị kinh doanh & Startup', prompt: 'Hướng dẫn phân tích ma trận SWOT và mô hình Canvas cho dự án khởi nghiệp đổi mới sáng tạo.' },
      { id: 'finance-banking', category: 'Tài chính – Ngân hàng', icon: 'fa-chart-line', title: 'Ngân hàng số & Fintech', prompt: 'Giải thích xu hướng Ngân hàng số (Digital Banking), Công nghệ tài chính (Fintech) và thẩm định dự án đầu tư.' },
      { id: 'japanese-jlpt', category: 'Ngôn ngữ Nhật', icon: 'fa-torii-gate', title: 'Ngôn ngữ Nhật & JLPT', prompt: 'Chia sẻ lộ trình học tiếng Nhật thương mại và chuẩn bị thi chứng chỉ JLPT N3-N2.' },
      { id: 'korean-topik', category: 'Ngôn ngữ Hàn Quốc', icon: 'fa-globe-asia', title: 'Ngôn ngữ Hàn & TOPIK', prompt: 'Hướng dẫn phương pháp ôn thi TOPIK 4-6 và kỹ năng biên phiên dịch cho doanh nghiệp Hàn Quốc.' },
    ];

    return successResponse(res, 'Lấy danh sách gợi ý câu hỏi thành công.', quickPrompts);
  }

  // PUT /api/chat/messages/:id/feedback
  async giveFeedback(req, res, next) {
    try {
      const { feedback } = req.body;
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
