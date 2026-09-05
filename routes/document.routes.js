const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Lấy danh sách và chi tiết tài liệu (công khai cho sinh viên xem)
router.get('/', optionalAuth, documentController.getDocuments);
router.get('/:id', optionalAuth, documentController.getDocument);

// Tải lên tài liệu và xóa tài liệu (yêu cầu đăng nhập)
router.post('/upload', protect, upload.single('file'), documentController.uploadDocument);
router.delete('/:id', protect, documentController.deleteDocument);

module.exports = router;
