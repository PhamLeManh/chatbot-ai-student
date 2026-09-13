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
      // 1. THIẾT KẾ ĐỒ HỌA
      { id: 'graphic-design', category: 'Thiết kế đồ họa', icon: 'fa-palette', title: 'Nguyên lý CRAP & Thiết kế', prompt: 'Hãy giải thích 4 nguyên lý thiết kế CRAP (Contrast, Repetition, Alignment, Proximity) và cách xây dựng bộ nhận diện thương hiệu chuyên nghiệp tại NTU.' },
      // 2. NGÔN NGỮ NHẬT
      { id: 'japanese-jlpt', category: 'Ngôn ngữ Nhật', icon: 'fa-torii-gate', title: 'Lộ trình JLPT N3-N1', prompt: 'Hãy chia sẻ lộ trình học tiếng Nhật từ sơ cấp đến chuẩn JLPT N3-N1 cho sinh viên ngành Ngôn ngữ Nhật Đại học Nguyễn Trãi.' },
      // 3. NGÔN NGỮ HÀN QUỐC
      { id: 'korean-topik', category: 'Ngôn ngữ Hàn Quốc', icon: 'fa-globe-asia', title: 'Ôn thi TOPIK & DN Hàn', prompt: 'Hướng dẫn phương pháp ôn thi TOPIK đạt cấp độ 4-6 và các kỹ năng làm việc tại tập đoàn Hàn Quốc (Samsung, LG, CJ) cho sinh viên NTU.' },
      // 4. QUỐC TẾ HỌC
      { id: 'international-studies', category: 'Quốc tế học', icon: 'fa-earth-americas', title: 'Ngoại giao & Dự án NGO', prompt: 'Tư vấn về cơ hội nghề nghiệp ngành Quốc tế học tại Đại học Nguyễn Trãi: làm việc tại các cơ quan ngoại giao, tổ chức phi chính phủ (NGO) và tập đoàn quốc tế.' },
      // 5. QUAN HỆ CÔNG CHÚNG
      { id: 'pr-crisis', category: 'Quan hệ công chúng', icon: 'fa-bullhorn', title: 'Xử lý khủng hoảng PR', prompt: 'Trình bày quy trình 5 bước xử lý khủng hoảng truyền thông mạng xã hội và kỹ năng viết thông cáo báo chí chuẩn ngành Quan hệ công chúng.' },
      // 6. QUẢN TRỊ KINH DOANH
      { id: 'business-admin', category: 'Quản trị kinh doanh', icon: 'fa-briefcase', title: 'SWOT & Vườn ươm Startup', prompt: "Hướng dẫn phân tích ma trận SWOT và mô hình 5 áp lực cạnh tranh của Porter cho dự án khởi nghiệp sinh viên Quản trị kinh doanh NTU." },
      // 7. TÀI CHÍNH - NGÂN HÀNG
      { id: 'finance-banking', category: 'Tài chính – Ngân hàng', icon: 'fa-chart-line', title: 'Ngân hàng số & Fintech', prompt: 'Giải thích xu hướng Ngân hàng số (Digital Banking), Công nghệ tài chính (Fintech) và công thức tính giá trị hiện tại (PV) của dòng tiền.' },
      // 8. KẾ TOÁN
      { id: 'accounting-basics', category: 'Kế toán', icon: 'fa-file-invoice-dollar', title: 'Định khoản Nợ - Có & IFRS', prompt: 'Giải thích nguyên tắc định khoản kế toán Nợ - Có (Debit/Credit) với ví dụ thực tế doanh nghiệp và xu hướng áp dụng chuẩn mực IFRS.' },
      // 9. CÔNG NGHỆ THÔNG TIN
      { id: 'it-coding', category: 'Công nghệ thông tin', icon: 'fa-laptop-code', title: 'Thuật toán & Lập trình Fullstack', prompt: 'Giải thích thuật toán QuickSort và phân tích kiến trúc xây dựng ứng dụng Web Fullstack chuẩn bảo mật dành cho sinh viên CNTT NTU.' },
      // 10. THIẾT KẾ NỘI THẤT
      { id: 'interior-design', category: 'Thiết kế nội thất', icon: 'fa-couch', title: 'Phong cách nội thất & Bản vẽ', prompt: 'So sánh phong cách thiết kế nội thất Minimalism, Japandi và Scandinavian, cùng quy chuẩn đọc bản vẽ mặt bằng/mặt cắt kiến trúc.' },
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
