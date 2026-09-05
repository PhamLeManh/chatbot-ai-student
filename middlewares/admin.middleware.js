const { errorResponse } = require('../utils/response');

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Yêu cầu xác thực trước khi truy cập.', null, 401);
  }

  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Từ chối truy cập! Quyền hạn Quản trị viên (Admin) là bắt buộc.', null, 403);
  }

  next();
};

module.exports = {
  requireAdmin,
};
