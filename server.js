const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/database');
const User = require('./models/User');
const Course = require('./models/Course');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const StudyPlan = require('./models/StudyPlan');
const Document = require('./models/Document');

const PORT = process.env.PORT || 5000;

/**
 * Tự động tạo dữ liệu mẫu ban đầu cho Trường Đại học Nguyễn Trãi (NTU)
 */
async function seedInitialData() {
  try {
    // 1. Kiểm tra & Tạo tài khoản Admin mặc định
    let admin = await User.findOne({ email: 'admin@demo.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Quản Trị Viên NTU',
        email: 'admin@demo.com',
        password: 'password123',
        role: 'admin',
        studentId: 'NTU-ADMIN-01',
        university: 'Trường Đại học Nguyễn Trãi (NTU)',
        major: 'Quản trị Hệ thống & AI',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        bio: 'Quản trị viên trưởng hệ thống AI Assistant - Trường Đại học Nguyễn Trãi.',
        isVerified: true,
      });
      console.log('[Seed] Đã tạo tài khoản Admin demo NTU (admin@demo.com / password123)');
    } else if (!admin.isVerified) {
      admin.isVerified = true;
      await admin.save();
    }

    // 2. Kiểm tra & Tạo tài khoản Sinh viên mặc định
    let student = await User.findOne({ email: 'student@demo.com' });
    if (!student) {
      student = await User.create({
        name: 'Nguyễn Văn Minh',
        email: 'student@demo.com',
        password: 'password123',
        role: 'student',
        studentId: '2026NTU1089',
        university: 'Trường Đại học Nguyễn Trãi (NTU)',
        major: 'Công nghệ thông tin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Sinh viên NTU năng động, mục tiêu tốt nghiệp loại Giỏi và làm việc tại tập đoàn đa quốc gia!',
        streak: { currentCount: 7, longestStreak: 15, lastActiveDate: new Date() },
        isVerified: true,
      });
      console.log('[Seed] Đã tạo tài khoản Sinh viên demo NTU (student@demo.com / password123)');
    } else if (!student.isVerified) {
      student.isVerified = true;
      await student.save();
    }

    // 3. Kiểm tra & Tạo danh sách 10 Môn học đại diện cho 10 ngành đào tạo tại NTU
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      await Course.insertMany([
        {
          code: 'NTU-GD101',
          name: 'Nguyên Lý Thị Giác & Thiết Kế Nhận Diện',
          description: 'Học phần nền tảng ngành Thiết kế đồ họa: Quy chuẩn CRAP, nghệ thuật Typography, phối màu và bộ nhận diện thương hiệu.',
          department: 'Khoa Mỹ Thuật Ứng Dụng (Thiết Kế Đồ Họa)',
          credits: 3,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'ThS. Nguyễn Hoàng Anh',
        },
        {
          code: 'NTU-JPN201',
          name: 'Tiếng Nhật Thương Mại & Giao Tiếp Doanh Nghiệp',
          description: 'Rèn luyện kỹ năng đàm phán thương mại, tác phong Hou-Ren-So và chuẩn bị thi chứng chỉ JLPT N3-N2.',
          department: 'Khoa Ngôn Ngữ & Văn Hóa Nhật Bản',
          credits: 3,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'Sensei Takahashi Kenji',
        },
        {
          code: 'NTU-KOR201',
          name: 'Biên - Phiên Dịch Tiếng Hàn Ứng Dụng',
          description: 'Thực hành dịch thuật văn bản kinh tế - thương mại và giao tiếp cabin chuẩn TOPIK 4-6.',
          department: 'Khoa Ngôn Ngữ & Văn Hóa Hàn Quốc',
          credits: 3,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'ThS. Park Min-woo',
        },
        {
          code: 'NTU-IS301',
          name: 'Ngoại Giao & Quản Trị Dự Án Quốc Tế',
          description: 'Nghiên cứu thể chế quốc tế, kỹ năng đàm phán đa phương và vận hành dự án tổ chức phi chính phủ (NGO).',
          department: 'Khoa Quốc Tế Học',
          credits: 3,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'TS. Phạm Quang Dũng',
        },
        {
          code: 'NTU-PR202',
          name: 'Quản Trị Khủng Hoảng Truyền Thông & Sự Kiện',
          description: 'Chiến lược PR đa kênh, quy trình xử lý khủng hoảng truyền thông mạng xã hội và tổ chức sự kiện chuyên nghiệp.',
          department: 'Khoa Quan Hệ Công Chúng & Truyền Thông',
          credits: 3,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'ThS. Lê Mai Phương',
        },
        {
          code: 'NTU-BA301',
          name: 'Quản Trị Chiến Lược & Khởi Nghiệp Đổi Mới Sáng Tạo',
          description: 'Phát triển mô hình kinh doanh Canvas, phân tích SWOT, định giá doanh nghiệp và vườn ươm khởi nghiệp.',
          department: 'Khoa Quản Trị Kinh Doanh',
          credits: 4,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'PGS. TS. Trần Đình Hải',
        },
        {
          code: 'NTU-FIN202',
          name: 'Tài Chính Doanh Nghiệp & Ngân Hàng Số',
          description: 'Thẩm định dự án đầu tư, định giá dòng tiền, mô hình Fintech và phân tích báo cáo tài chính.',
          department: 'Khoa Tài Chính – Ngân Hàng',
          credits: 3,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'TS. Vũ Minh Châu',
        },
        {
          code: 'NTU-ACC101',
          name: 'Nguyên Lý Kế Toán & Chuẩn Mực IFRS',
          description: 'Quy tắc định khoản Nợ - Có, lập bảng cân đối kế toán, báo cáo lưu chuyển tiền tệ và thực hành phần mềm MISA.',
          department: 'Khoa Kế Toán - Kiểm Toán',
          credits: 3,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'ThS. Hoàng Thị Lan',
        },
        {
          code: 'NTU-IT201',
          name: 'Cấu Trúc Dữ Liệu & Phát Triển Ứng Dụng Web/AI',
          description: 'Giải thuật tối ưu (QuickSort, Dijkstra), kiến trúc RESTful API, Fullstack Node.js và tích hợp Trí tuệ nhân tạo.',
          department: 'Khoa Công Nghệ Thông Tin',
          credits: 4,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'TS. Nguyễn Thanh Tùng',
        },
        {
          code: 'NTU-ID102',
          name: 'Thiết Kế Không Gian Nội Thất & Đồ Họa 3D',
          description: 'Quy hoạch không gian sống, phong cách nội thất đương đại (Minimalism/Japandi) và mô phỏng 3ds Max/AutoCAD.',
          department: 'Khoa Kiến Trúc - Thiết Kế Nội Thất',
          credits: 4,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'KTS. Đỗ Quốc Hưng',
        },
      ]);
      console.log('[Seed] Đã tạo danh mục 10 học phần đại diện cho 10 ngành đào tạo tại ĐH Nguyễn Trãi');
    }

    // 4. Kiểm tra & Tạo Kế hoạch học tập mẫu cho Sinh viên
    if (student) {
      const planCount = await StudyPlan.countDocuments({ userId: student._id });
      if (planCount === 0) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 10);

        await StudyPlan.create({
          userId: student._id,
          title: 'Lộ Trình Ôn Thi Cuối Kỳ - Chuyên Ngành Công Nghệ Thông Tin NTU',
          goal: 'Đạt điểm A+ học phần Cấu trúc dữ liệu & Lập trình ứng dụng',
          targetExam: 'Thi Cuối Kỳ Học Kỳ 1 - NTU',
          targetDate,
          dailyHours: 3,
          subjects: ['Cấu trúc dữ liệu', 'Thuật toán đồ thị', 'Luyện giải đề thi NTU'],
          progressPercentage: 40,
          schedule: [
            {
              dayIndex: 1,
              dayName: 'Ngày 1 - Nền tảng Cấu trúc dữ liệu & Cây AVL',
              date: new Date().toISOString().split('T')[0],
              focus: 'Cây nhị phân tìm kiếm (BST) & Phép cân bằng cây AVL',
              tasks: [
                { title: 'Ôn tập lý thuyết cây nhị phân và các phép xoay Left/Right', subject: 'Cấu trúc dữ liệu', duration: '45 phút', isCompleted: true },
                { title: 'Cài đặt thuật toán duyệt cây tiền/trung/hậu thứ tự bằng C++/JS', subject: 'Thực hành lập trình', duration: '60 phút', isCompleted: true },
                { title: 'Tự kiểm tra 5 câu trắc nghiệm cùng Trợ lý AI NTU', subject: 'Luyện tập', duration: '30 phút', isCompleted: false },
              ],
            },
            {
              dayIndex: 2,
              dayName: 'Ngày 2 - Thuật toán Đồ thị & Đường đi ngắn nhất',
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              focus: 'Thuật toán Dijkstra & Biểu diễn ma trận kề',
              tasks: [
                { title: 'Hệ thống hóa ma trận kề và danh sách kề', subject: 'Thuật toán đồ thị', duration: '45 phút', isCompleted: false },
                { title: 'Giải 3 bài tập tìm đường đi ngắn nhất', subject: 'Luyện đề', duration: '60 phút', isCompleted: false },
                { title: 'Nhờ Trợ lý AI NTU giải thích chi tiết trường hợp trọng số âm', subject: 'Hỏi đáp AI', duration: '30 phút', isCompleted: false },
              ],
            },
          ],
          studyTips: [
            'Áp dụng phương pháp Active Recall: Tự viết lại code giải thuật ra giấy trước khi gõ trên máy.',
            'Áp dụng quy tắc Pomodoro 50/10 để duy trì năng lượng tập trung cao độ.',
          ],
        });
        console.log('[Seed] Đã tạo Kế hoạch học tập mẫu NTU cho sinh viên');
      }

      // 5. Kiểm tra & Tạo đoạn chat mẫu
      const convCount = await Conversation.countDocuments({ userId: student._id });
      if (convCount === 0) {
        const sampleConv = await Conversation.create({
          userId: student._id,
          title: 'Tư vấn 10 ngành đào tạo Đại học Nguyễn Trãi',
          subject: 'Cố vấn Học thuật 10 Ngành NTU',
          lastMessagePreview: 'Trường Đại học Nguyễn Trãi đào tạo 10 ngành trọng điểm chuẩn ứng dụng quốc tế...',
          messageCount: 2,
        });

        await Message.create([
          {
            conversationId: sampleConv._id,
            userId: student._id,
            sender: 'user',
            content: 'Chào AI, bạn giới thiệu giúp mình về 10 ngành đào tạo tại Trường Đại học Nguyễn Trãi (NTU) được không?',
          },
          {
            conversationId: sampleConv._id,
            userId: student._id,
            sender: 'assistant',
            content: `### 🏛️ Chào bạn! Trường Đại học Nguyễn Trãi (NTU) đào tạo **10 ngành trọng điểm chuẩn quốc tế**:

| STT | Ngành Đào Tạo | Điểm Nổi Bật |
| :---: | :--- | :--- |
| 1 | **Thiết kế đồ họa** | Mỹ thuật ứng dụng, 2D/3D, UI/UX, Branding & Studio thực chiến |
| 2 | **Ngôn ngữ Nhật** | Chuẩn JLPT N3-N1, tiếng Nhật thương mại, cơ hội việc làm tại Nhật Bản |
| 3 | **Ngôn ngữ Hàn Quốc** | Chuẩn TOPIK 3-6, làm việc tại tập đoàn FDI Hàn Quốc (Samsung, LG, CJ) |
| 4 | **Quốc tế học** | Ngoại giao, quan hệ quốc tế, tổ chức phi chính phủ (NGO) & đàm phán toàn cầu |
| 5 | **Quan hệ công chúng (PR)** | Quản trị truyền thông, tổ chức sự kiện, xử lý khủng hoảng PR |
| 6 | **Quản trị kinh doanh** | Quản trị 4.0, Marketing số, vườn ươm khởi nghiệp Startup NTU |
| 7 | **Tài chính – Ngân hàng** | Tài chính doanh nghiệp, Ngân hàng số, Fintech & đầu tư chứng khoán |
| 8 | **Kế toán** | Kế toán tài chính & Quản trị, thuế, kiểm toán, chuẩn mực IFRS, MISA/SAP |
| 9 | **Công nghệ thông tin** | Kỹ thuật phần mềm, Trí tuệ nhân tạo (AI/ML), Lập trình Web/Mobile |
| 10 | **Thiết kế nội thất** | Kiến trúc nội thất, vật liệu & ánh sáng, AutoCAD, 3ds Max, SketchUp |

*Bạn muốn mình tư vấn chuyên sâu hơn về chương trình học hoặc cơ hội việc làm của ngành nào?* 🚀`,
          },
        ]);
        console.log('[Seed] Đã tạo phiên hội thoại tư vấn NTU mẫu');
      }
    }
  } catch (err) {
    console.warn('[Seed Error] Lỗi khởi tạo dữ liệu mẫu:', err.message);
  }
}

// Khởi chạy Server
async function startServer() {
  await connectDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🏛️ TRỢ LÝ AI - TRƯỜNG ĐẠI HỌC NGUYỄN TRÃI (NTU)`);
    console.log(`🔗 Trang chủ Landing Page : http://localhost:${PORT}`);
    console.log(`💬 Chatbot AI NTU         : http://localhost:${PORT}/chat`);
    console.log(`🗓️ Lộ trình học tập NTU   : http://localhost:${PORT}/study-plan`);
    console.log(`🛡️ Bảng điều khiển Admin   : http://localhost:${PORT}/admin`);
    console.log(`🔑 Demo Student           : student@demo.com / password123`);
    console.log(`🔑 Demo Admin             : admin@demo.com / password123`);
    console.log(`======================================================\n`);
  });
}

startServer();
