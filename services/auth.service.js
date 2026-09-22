const crypto = require('crypto');
const User = require('../models/User');
const { signToken } = require('../utils/generateToken');
const emailService = require('./email.service');

class AuthService {
  /**
   * Đăng ký tài khoản mới (Bước 1 & Bước 2: Tạo User & Gửi OTP/Link Gmail)
   */
  async register(userData, baseUrl = 'http://localhost:5000') {
    const { name, email, password, studentId, university, major } = userData;
    const normalizedEmail = email.toLowerCase().trim();

    // Sinh mã OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    // Kiểm tra xem email đã tồn tại chưa
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.isVerified) {
        throw new Error('Email này đã được sử dụng và xác minh. Vui lòng đăng nhập.');
      }
      // Nếu tài khoản đã tạo nhưng chưa xác minh -> cập nhật lại thông tin & gửi mã mới
      user.name = name;
      user.password = password; // Sẽ tự băm ở pre-save
      user.studentId = studentId || user.studentId;
      user.university = university || 'Trường Đại học Nguyễn Trãi (NTU)';
      user.major = major || user.major;
      user.verificationOTP = otp;
      user.verificationOTPExpires = otpExpires;
      user.verificationToken = token;
      await user.save();
    } else {
      // Tạo tài khoản mới với trạng thái chưa xác minh
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        studentId: studentId || '',
        university: university || 'Trường Đại học Nguyễn Trãi (NTU)',
        major: major || 'Công nghệ thông tin',
        role: 'student',
        isVerified: false,
        verificationOTP: otp,
        verificationOTPExpires: otpExpires,
        verificationToken: token,
      });
    }

    // Gửi email xác thực kèm OTP và Link kích hoạt
    const verificationUrl = `${baseUrl}/verify?token=${token}`;
    const emailResult = await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      otp,
      verificationUrl,
    });

    return {
      email: user.email,
      name: user.name,
      requireVerification: true,
      message: 'Mã xác minh (OTP) đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (hoặc mục Spam).',
      devOtp: emailResult.devOtp || otp,
    };
  }

  /**
   * Xác minh tài khoản qua mã OTP 6 số (Bước 3)
   */
  async verifyOTP({ email, otp }) {
    if (!email || !otp) {
      throw new Error('Vui lòng cung cấp email và mã OTP 6 số.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error('Không tìm thấy tài khoản với email này.');
    }

    if (user.isVerified) {
      const token = signToken({ id: user._id, role: user.role });
      return {
        user: this.sanitizeUser(user),
        token,
        message: 'Tài khoản đã được xác minh trước đó.',
      };
    }

    // Kiểm tra mã OTP và thời hạn
    if (!user.verificationOTP || user.verificationOTP !== otp.trim()) {
      throw new Error('Mã xác minh (OTP) không chính xác. Vui lòng thử lại.');
    }

    if (user.verificationOTPExpires && user.verificationOTPExpires < new Date()) {
      throw new Error('Mã xác minh (OTP) đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.');
    }

    // Kích hoạt tài khoản
    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationOTPExpires = null;
    user.verificationToken = null;
    await user.save();

    const token = signToken({ id: user._id, role: user.role });

    return {
      user: this.sanitizeUser(user),
      token,
      message: 'Xác thực tài khoản thành công! Bạn có thể bắt đầu sử dụng Trợ Lý AI NTU.',
    };
  }

  /**
   * Xác minh tài khoản qua Link bấm trong Email (Bước 3)
   */
  async verifyToken({ token }) {
    if (!token) {
      throw new Error('Token xác minh không hợp lệ.');
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationOTPExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new Error('Liên kết xác minh không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã xác minh mới.');
    }

    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationOTPExpires = null;
    user.verificationToken = null;
    await user.save();

    const jwtToken = signToken({ id: user._id, role: user.role });

    return {
      user: this.sanitizeUser(user),
      token: jwtToken,
      message: 'Xác thực tài khoản thành công!',
    };
  }

  /**
   * Gửi lại mã xác minh OTP
   */
  async resendVerification({ email }, baseUrl = 'http://localhost:5000') {
    if (!email) {
      throw new Error('Vui lòng cung cấp email.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error('Không tìm thấy tài khoản với email này.');
    }

    if (user.isVerified) {
      throw new Error('Tài khoản này đã được xác minh. Vui lòng tiến hành đăng nhập.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationOTP = otp;
    user.verificationOTPExpires = otpExpires;
    user.verificationToken = token;
    await user.save();

    const verificationUrl = `${baseUrl}/verify?token=${token}`;
    const emailResult = await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      otp,
      verificationUrl,
    });

    return {
      message: 'Mã xác minh mới đã được gửi tới email của bạn.',
      devOtp: emailResult.devOtp || otp,
    };
  }

  /**
   * Đăng nhập (Bước 4 & Bước 5: Kiểm tra Password, Xác thực Email & Cấp JWT)
   */
  async login(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    // Kiểm tra trạng thái kích hoạt qua Email
    if (!user.isVerified) {
      const err = new Error('Tài khoản của bạn chưa được xác minh qua Email. Vui lòng nhập mã OTP để kích hoạt.');
      err.statusCode = 403;
      err.code = 'NOT_VERIFIED';
      err.email = user.email;
      throw err;
    }

    if (!user.isActive) {
      throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.');
    }

    // Cập nhật streak học tập
    await user.updateStreak();

    const token = signToken({ id: user._id, role: user.role });

    return {
      user: this.sanitizeUser(user),
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

  sanitizeUser(user) {
    return {
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
      isVerified: user.isVerified,
    };
  }
}

module.exports = new AuthService();
