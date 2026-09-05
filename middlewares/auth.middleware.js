const { verifyJwt } = require('../utils/generateToken');
const { errorResponse } = require('../utils/response');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Kiểm tra Bearer Token trong Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Kiểm tra token từ query param hoặc cookie nếu có
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return errorResponse(res, 'Vui lòng đăng nhập để thực hiện thao tác này.', null, 401);
    }

    // Giải mã token
    const decoded = verifyJwt(token);
    
    // Tìm user tương ứng
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(res, 'Tài khoản người dùng không tồn tại hoặc đã bị xóa.', null, 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', null, 401);
  }
};

// Middleware kiểm tra user tùy chọn (không bắt buộc đăng nhập)
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = verifyJwt(token);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    }
  } catch (e) {
    // Ignore error for optional auth
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
};
