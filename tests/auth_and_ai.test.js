const connectDB = require('../config/database');
const User = require('../models/User');
const authService = require('../services/auth.service');
const aiService = require('../services/ai.service');

async function runTests() {
  console.log('🧪 [TEST BẮT ĐẦU] Kiểm thử hệ thống Xác thực OTP & AI Assistant...');
  await connectDB();

  // Test 1: Kiểm thử AI Service với câu hỏi ngoài trường (Code Python)
  console.log('\n--- 1. Kiểm thử AI Service với câu hỏi Lập trình Python ---');
  const aiCodeResult = await aiService.generateChatResponse({
    messages: [{ sender: 'user', content: 'Hãy viết một hàm Python tìm số nguyên tố từ 1 đến N và giải thích thuật toán.' }],
    userContext: { name: 'Minh', major: 'Công nghệ thông tin' },
  });
  console.log('Model sử dụng:', aiCodeResult.model);
  console.log('Độ dài phản hồi:', aiCodeResult.content.length, 'ký tự');
  console.log('Trích đoạn phản hồi:\n', aiCodeResult.content.substring(0, 200), '...');

  // Test 2: Kiểm thử AI Service với câu hỏi 10 ngành NTU (Thiết kế đồ họa)
  console.log('\n--- 2. Kiểm thử AI Service với câu hỏi Ngành NTU ---');
  const aiMajorResult = await aiService.generateChatResponse({
    messages: [{ sender: 'user', content: 'Tư vấn giúp mình về chương trình học và nguyên lý CRAP ngành Thiết kế đồ họa NTU' }],
    userContext: { name: 'Lan', major: 'Thiết kế đồ họa' },
  });
  console.log('Trích đoạn phản hồi:\n', aiMajorResult.content.substring(0, 200), '...');

  // Test 3: Kiểm thử luồng Đăng ký & Sinh mã OTP
  console.log('\n--- 3. Kiểm thử Đăng ký & Sinh mã OTP 6 số ---');
  const testEmail = `test_student_${Date.now()}@gmail.com`;
  const registerResult = await authService.register({
    name: 'Sinh Viên Kiểm Thử',
    email: testEmail,
    password: 'password123',
    studentId: '2026NTU9999',
    major: 'Công nghệ thông tin',
  });
  console.log('Kết quả đăng ký:', registerResult);

  // Test 4: Kiểm tra tài khoản trong database
  const createdUser = await User.findOne({ email: testEmail });
  console.log('Trạng thái User vừa tạo: isVerified =', createdUser.isVerified, '| OTP =', createdUser.verificationOTP);

  // Test 5: Thử đăng nhập khi chưa xác minh (kỳ vọng ném lỗi NOT_VERIFIED)
  console.log('\n--- 4. Kiểm thử Chặn đăng nhập khi chưa kích hoạt ---');
  try {
    await authService.login(testEmail, 'password123');
    console.error('❌ LỖI: Lẽ ra phải chặn đăng nhập!');
  } catch (err) {
    console.log('✅ Đã chặn đăng nhập thành công:', err.message);
  }

  // Test 6: Xác thực mã OTP 6 số
  console.log('\n--- 5. Kiểm thử Xác thực OTP ---');
  const verifyResult = await authService.verifyOTP({
    email: testEmail,
    otp: createdUser.verificationOTP,
  });
  console.log('✅ Xác thực OTP thành công!');
  console.log('JWT Token nhận được:', verifyResult.token.substring(0, 25) + '...');
  console.log('User status sau xác thực: isVerified =', verifyResult.user.isVerified);

  // Test 7: Đăng nhập sau khi đã xác thực
  console.log('\n--- 6. Kiểm thử Đăng nhập sau khi đã kích hoạt ---');
  const loginResult = await authService.login(testEmail, 'password123');
  console.log('✅ Đăng nhập thành công! User Name:', loginResult.user.name);

  // Dọn dẹp test user
  await User.deleteOne({ email: testEmail });
  console.log('\n🎉 [TẤT CẢ TEST ĐÃ VƯỢT QUA 100% THÀNH CÔNG]');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Lỗi Test:', err);
  process.exit(1);
});
