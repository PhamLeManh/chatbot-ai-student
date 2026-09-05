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
 * Tự động tạo dữ liệu mẫu ban đầu (Admin, Sinh viên mẫu, Môn học, Lộ trình học)
 */
async function seedInitialData() {
  try {
    // 1. Kiểm tra & Tạo tài khoản Admin mặc định
    let admin = await User.findOne({ email: 'admin@demo.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Quản Trị Viên Hệ Thống',
        email: 'admin@demo.com',
        password: 'password123',
        role: 'admin',
        studentId: 'ADMIN-001',
        university: 'Đại học Bách Khoa',
        major: 'Quản trị Hệ thống & AI',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        bio: 'Quản trị viên trưởng nền tảng AI Student Assistant.',
      });
      console.log('[Seed] Đã tạo tài khoản Admin demo (admin@demo.com / password123)');
    }

    // 2. Kiểm tra & Tạo tài khoản Sinh viên mặc định
    let student = await User.findOne({ email: 'student@demo.com' });
    if (!student) {
      student = await User.create({
        name: 'Nguyễn Văn Minh',
        email: 'student@demo.com',
        password: 'password123',
        role: 'student',
        studentId: '20261089',
        university: 'Đại học Bách Khoa / ĐHQG',
        major: 'Khoa học Máy tính & Kỹ thuật Phần mềm',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Sinh viên năm 3 chăm chỉ, mục tiêu đạt học bổng xuất sắc!',
        streak: { currentCount: 5, longestStreak: 12, lastActiveDate: new Date() },
      });
      console.log('[Seed] Đã tạo tài khoản Sinh viên demo (student@demo.com / password123)');
    }

    // 3. Kiểm tra & Tạo danh sách Môn học mẫu
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      await Course.insertMany([
        {
          code: 'IT2001',
          name: 'Cấu Trúc Dữ Liệu & Giải Thuật',
          description: 'Nghiên cứu về cây nhị phân, đồ thị, thuật toán sắp xếp (QuickSort, MergeSort) và tối ưu độ phức tạp thuật toán.',
          department: 'Khoa Công Nghệ Thông Tin',
          credits: 4,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'PGS. TS. Trần Quốc Hùng',
        },
        {
          code: 'MATH1010',
          name: 'Giải Tích & Toán Cao Cấp 1',
          description: 'Hàm số nhiều biến, đạo hàm riêng, tích phân bội, phương trình vi phân và chuỗi số.',
          department: 'Khoa Toán - Tin Ứng Dụng',
          credits: 4,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'TS. Lê Thị Mai Lan',
        },
        {
          code: 'IT3040',
          name: 'Lập Trình Web & Ứng Dụng Nâng Cao',
          description: 'Kiến trúc Fullstack hiện đại với Node.js, REST API, kiến trúc Client-Server và tích hợp AI.',
          department: 'Khoa Công Nghệ Thông Tin',
          credits: 3,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'ThS. Hoàng Văn Nam',
        },
        {
          code: 'ENG2020',
          name: 'Tiếng Anh Học Thuật & IELTS 6.5+',
          description: 'Rèn luyện 4 kỹ năng Nghe - Nói - Đọc - Viết học thuật, cấu trúc bài luận luận giải và từ vựng chuyên ngành.',
          department: 'Khoa Ngoại Ngữ',
          credits: 3,
          semester: 'Học kỳ 1 - 2026',
          instructor: 'ThS. Sarah Johnson',
        },
      ]);
      console.log('[Seed] Đã tạo 4 học phần môn học mẫu');
    }

    // 4. Kiểm tra & Tạo Kế hoạch học tập mẫu cho Sinh viên
    if (student) {
      const planCount = await StudyPlan.countDocuments({ userId: student._id });
      if (planCount === 0) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 10);

        await StudyPlan.create({
          userId: student._id,
          title: 'Lộ Trình Bứt Phá Điểm A+ Môn Cấu Trúc Dữ Liệu & Thuật Toán',
          goal: 'Ôn thi cuối kỳ đạt điểm tổng kết từ 9.0 trở lên',
          targetExam: 'Thi Cuối Kỳ Học Kỳ 1',
          targetDate,
          dailyHours: 3,
          subjects: ['Cấu trúc dữ liệu', 'Thuật toán đồ thị', 'Giải đề thi các năm'],
          progressPercentage: 35,
          schedule: [
            {
              dayIndex: 1,
              dayName: 'Ngày 1 - Nền tảng cấu trúc dữ liệu',
              date: new Date().toISOString().split('T')[0],
              focus: 'Cây nhị phân tìm kiếm (BST) & Cây AVL',
              tasks: [
                { title: 'Đọc lý thuyết phép quay cây AVL (Left-Left, Right-Right)', subject: 'Cấu trúc dữ liệu', duration: '45 phút', isCompleted: true },
                { title: 'Cài đặt thuật toán duyệt cây tiền thứ tự, trung thứ tự và hậu thứ tự', subject: 'Cấu trúc dữ liệu', duration: '60 phút', isCompleted: true },
                { title: 'Tự kiểm tra 5 câu hỏi trắc nghiệm cùng Chatbot AI', subject: 'Luyện tập', duration: '30 phút', isCompleted: false },
              ],
            },
            {
              dayIndex: 2,
              dayName: 'Ngày 2 - Thuật toán đồ thị & Đường đi ngắn nhất',
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              focus: 'Thuật toán Dijkstra & Floyd-Warshall',
              tasks: [
                { title: 'Ôn tập ma trận kề, danh sách kề và biểu diễn đồ thị', subject: 'Thuật toán đồ thị', duration: '45 phút', isCompleted: false },
                { title: 'Giải 3 bài tập đường đi ngắn nhất đồ thị có trọng số', subject: 'Thuật toán đồ thị', duration: '60 phút', isCompleted: false },
                { title: 'Nhờ AI giải thích chi tiết trường hợp trọng số âm (Bellman-Ford)', subject: 'Chatbot AI', duration: '30 phút', isCompleted: false },
              ],
            },
          ],
          studyTips: [
            'Học bằng phương pháp Active Recall: Tự viết lại code giải thuật ra giấy nháp trước khi gõ trên máy.',
            'Áp dụng quy tắc Pomodoro 50/10 để không bị mỏi mắt và duy trì độ tập trung.',
          ],
        });
        console.log('[Seed] Đã tạo Kế hoạch học tập mẫu cho sinh viên');
      }

      // 5. Kiểm tra & Tạo đoạn chat mẫu
      const convCount = await Conversation.countDocuments({ userId: student._id });
      if (convCount === 0) {
        const sampleConv = await Conversation.create({
          userId: student._id,
          title: 'Giải thích thuật toán QuickSort',
          subject: 'Cấu trúc Dữ liệu & Giải thuật',
          lastMessagePreview: 'QuickSort là thuật toán sắp xếp chia để trị với độ phức tạp trung bình O(N log N)...',
          messageCount: 2,
        });

        await Message.create([
          {
            conversationId: sampleConv._id,
            userId: student._id,
            sender: 'user',
            content: 'Chào AI, bạn giải thích giúp mình nguyên lý hoạt động của QuickSort và viết code JavaScript mẫu được không?',
          },
          {
            conversationId: sampleConv._id,
            userId: student._id,
            sender: 'assistant',
            content: `### ⚡ Thuật toán Sắp Xếp Nhanh (QuickSort)

**QuickSort** là thuật toán sắp xếp theo nguyên lý **Chia để trị (Divide and Conquer)** với độ phức tạp trung bình là **O(N log N)**.

#### 1. Nguyên lý hoạt động:
1. **Chọn phần tử chốt (Pivot)**: Có thể chọn phần tử đầu, cuối hoặc giữa mảng.
2. **Phân hoạch (Partitioning)**: Xếp các phần tử nhỏ hơn pivot sang bên trái, các phần tử lớn hơn pivot sang bên phải.
3. **Đệ quy**: Lặp lại quá trình trên cho 2 mảng con bên trái và bên phải của pivot.

\`\`\`javascript
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}
\`\`\``,
          },
        ]);
        console.log('[Seed] Đã tạo phiên hội thoại và tin nhắn chat mẫu');
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
    console.log(`🤖 CHATBOT AI STUDENT ASSISTANT ĐÃ KHỞI CHẠY THÀNH CÔNG!`);
    console.log(`🔗 Trang chủ Landing Page : http://localhost:${PORT}`);
    console.log(`💬 Không gian Chatbot AI  : http://localhost:${PORT}/chat`);
    console.log(`🗓️ Lộ trình học tập AI    : http://localhost:${PORT}/study-plan`);
    console.log(`🛡️ Bảng điều khiển Admin   : http://localhost:${PORT}/admin`);
    console.log(`🔑 Tài khoản Demo Student : student@demo.com / password123`);
    console.log(`🔑 Tài khoản Demo Admin   : admin@demo.com / password123`);
    console.log(`======================================================\n`);
  });
}

startServer();
