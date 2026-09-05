const User = require('../models/User');
const { signToken } = require('../utils/generateToken');

class AuthService {
  async register(userData) {
    const { name, email, password, studentId, university, major } = userData;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email này đã được sử dụng. Vui lòng chọn email khác.');
    }

    // Tạo tài khoản mới
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      studentId: studentId || '',
      university: university || 'Đại học Bách Khoa / ĐHQG',
      major: major || 'Công nghệ thông tin',
      role: 'student',
    });

    const token = signToken({ id: user._id, role: user.role });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        university: user.university,
        major: user.major,
        avatar: user.avatar,
        streak: user.streak,
      },
      token,
    };
  }

  async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    if (!user.isActive) {
      throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.');
    }

    // Cập nhật streak học tập
    await user.updateStreak();

    const token = signToken({ id: user._id, role: user.role });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        university: user.university,
        major: user.major,
        avatar: user.avatar,
        bio: user.bio,
        streak: user.streak,
        preferences: user.preferences,
      },
      token,
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy thông tin người dùng.');
    }
    return user;
  }

  async updateProfile(userId, updateData) {
    const allowedFields = ['name', 'studentId', 'university', 'major', 'bio', 'avatar', 'preferences'];
    const filteredData = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    });

    return updatedUser;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('Người dùng không tồn tại.');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Mật khẩu hiện tại không chính xác.');
    }

    if (newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Đổi mật khẩu thành công.' };
  }
}

module.exports = new AuthService();
