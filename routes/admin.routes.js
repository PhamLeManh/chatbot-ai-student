const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');

// Tất cả các route admin đều yêu cầu đăng nhập và có role === 'admin'
router.use(protect, requireAdmin);

// Thống kê Dashboard
router.get('/stats', adminController.getDashboardStats);

// Quản lý người dùng
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Quản lý học phần / môn học
router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

module.exports = router;
