const { errorResponse } = require('../utils/response');

// Middleware bắt lỗi 404 cho các API routes chưa khai báo
const notFound = (req, res, next) => {
  // Nếu là API request
  if (req.originalUrl.startsWith('/api/')) {
    return errorResponse(res, `Endpoint API '${req.originalUrl}' không tồn tại.`, null, 404);
  }
  // Nếu là page request
  res.status(404).sendFile('index.html', { root: './public' });
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  console.error('[Error Caught]:', err.stack || err.message);

  // Xử lý lỗi từ Multer upload
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'Kích thước tệp vượt quá giới hạn tối đa cho phép (20MB).', null, 400);
    }
    return errorResponse(res, `Lỗi tải lên tệp tin: ${err.message}`, null, 400);
  }

  // Xử lý lỗi Mongoose CastError (Id không hợp lệ)
  if (err.name === 'CastError') {
    return errorResponse(res, 'Mã định danh (ID) đối tượng không hợp lệ.', null, 400);
  }

  // Xử lý lỗi Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, 'Dữ liệu không hợp lệ.', messages, 422);
  }

  // Xử lý lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Mã xác thực không hợp lệ. Vui lòng đăng nhập lại.', null, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', null, 401);
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  return errorResponse(
    res,
    err.message || 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau ít phút.',
    process.env.NODE_ENV === 'development' ? err.stack : null,
    statusCode
  );
};

module.exports = {
  notFound,
  errorHandler,
};
