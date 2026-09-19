const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');
const { validateRegisterInput, validateLoginInput } = require('../utils/validators');

class AuthController {
  // Helper lấy base URL của request
  getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
  }

  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const { errors, isValid } = validateRegisterInput(req.body);
      if (!isValid) {
        return errorResponse(res, 'Dữ liệu đăng ký không hợp lệ.', errors, 400);
      }

      const baseUrl = this.getBaseUrl(req);
      const result = await authService.register(req.body, baseUrl);
      return successResponse(res, result.message, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/verify-otp
  async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return errorResponse(res, 'Vui lòng cung cấp email và mã OTP 6 số.', null, 400);
      }

      const result = await authService.verifyOTP({ email, otp });
      return successResponse(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // GET or POST /api/auth/verify-email
  async verifyEmail(req, res, next) {
    try {
      const token = req.query.token || req.body.token;
      if (!token) {
        return errorResponse(res, 'Token xác minh không tồn tại.', null, 400);
      }

      const result = await authService.verifyToken({ token });
      return successResponse(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/resend-verification
  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return errorResponse(res, 'Vui lòng cung cấp địa chỉ email.', null, 400);
      }

      const baseUrl = this.getBaseUrl(req);
      const result = await authService.resendVerification({ email }, baseUrl);
      return successResponse(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { errors, isValid } = validateLoginInput(req.body);
      if (!isValid) {
        return errorResponse(res, 'Vui lòng cung cấp email và mật khẩu.', errors, 400);
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return successResponse(res, 'Đăng nhập thành công!', result, 200);
    } catch (error) {
      if (error.code === 'NOT_VERIFIED') {
        return res.status(403).json({
          success: false,
          code: 'NOT_VERIFIED',
          message: error.message,
          email: error.email,
        });
      }
      next(error);
    }
  }

  // GET /api/auth/me
  async getMe(req, res, next) {
    try {
      const user = await authService.getProfile(req.user._id);
      return successResponse(res, 'Lấy thông tin tài khoản thành công.', user);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/auth/profile
  async updateProfile(req, res, next) {
    try {
      const updatedUser = await authService.updateProfile(req.user._id, req.body);
      return successResponse(res, 'Cập nhật thông tin hồ sơ thành công!', updatedUser);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/auth/change-password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return errorResponse(res, 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.', null, 400);
      }

      const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
      return successResponse(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/demo-login (1-Click Demo Login)
  async demoLogin(req, res, next) {
    try {
      const { role } = req.body; // 'student' hoặc 'admin'
      const email = role === 'admin' ? 'admin@demo.com' : 'student@demo.com';
      const password = 'password123';

      const result = await authService.login(email, password);
      return successResponse(res, `Đăng nhập thành công với tài khoản Demo ${role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}!`, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
