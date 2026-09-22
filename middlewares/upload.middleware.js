const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads luôn tồn tại
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Đảm bảo thư mục avatars tồn tại
const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Cấu hình lưu trữ (tài liệu chung)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Chuyển đổi tên file an toàn (tránh ký tự đặc biệt)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// Cấu hình lưu trữ riêng cho Avatar
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user ? req.user._id : 'unknown';
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
  },
});

// Kiểm tra định dạng file (tài liệu)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.png', '.jpg', '.jpeg', '.zip', '.pptx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng tệp ${ext} không được hỗ trợ. Vui lòng tải lên PDF, Word, Text, PowerPoint hoặc Hình ảnh.`), false);
  }
};

// Kiểm tra định dạng file ảnh (avatar)
const avatarFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF cho avatar.'), false);
  }
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 20 * 1024 * 1024; // 20MB

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter,
});

// Multer riêng cho upload avatar (tối đa 5MB)
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: avatarFilter,
});

module.exports = upload;
module.exports.uploadAvatar = uploadAvatar;
