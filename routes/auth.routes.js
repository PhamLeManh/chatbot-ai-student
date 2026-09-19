const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// 1. Đăng ký & Xác thực Email
router.post('/register', authController.register.bind(authController));
router.post('/verify-otp', authController.verifyOTP.bind(authController));
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/verify-email', authController.verifyEmail.bind(authController));
router.post('/resend-verification', authController.resendVerification.bind(authController));

// 2. Đăng nhập & Demo
router.post('/login', authController.login.bind(authController));
router.post('/demo-login', authController.demoLogin.bind(authController));

// 3. Quản lý Tài khoản (Protected)
router.get('/me', protect, authController.getMe.bind(authController));
router.put('/profile', protect, authController.updateProfile.bind(authController));
router.put('/change-password', protect, authController.changePassword.bind(authController));

module.exports = router;
