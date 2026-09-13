const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Họ và tên là bắt buộc'],
      trim: true,
      maxlength: [100, 'Họ tên không được vượt quá 100 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Vui lòng cung cấp email hợp lệ'],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false, // Ẩn trường password khi query mặc định
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'teacher'],
      default: 'student',
    },
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    university: {
      type: String,
      trim: true,
      default: 'Trường Đại học Nguyễn Trãi (NTU)',
    },
    major: {
      type: String,
      trim: true,
      default: 'Công nghệ thông tin',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    bio: {
      type: String,
      trim: true,
      default: 'Sinh viên chăm chỉ, yêu thích học hỏi và khám phá tri thức mới!',
    },
    streak: {
      currentCount: { type: Number, default: 1 },
      lastActiveDate: { type: Date, default: Date.now },
      longestStreak: { type: Number, default: 1 },
    },
    preferences: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      aiTone: { type: String, enum: ['friendly', 'formal', 'concise'], default: 'friendly' },
      notifications: { type: Boolean, default: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Băm mật khẩu trước khi lưu
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Cập nhật streak học tập
userSchema.methods.updateStreak = async function () {
  const now = new Date();
  const lastActive = new Date(this.streak.lastActiveDate || now);
  
  // Tính khoảng cách ngày
  const diffTime = Math.abs(now.setHours(0, 0, 0, 0) - lastActive.setHours(0, 0, 0, 0));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    this.streak.currentCount += 1;
    if (this.streak.currentCount > (this.streak.longestStreak || 1)) {
      this.streak.longestStreak = this.streak.currentCount;
    }
  } else if (diffDays > 1) {
    this.streak.currentCount = 1;
  }
  this.streak.lastActiveDate = new Date();
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
