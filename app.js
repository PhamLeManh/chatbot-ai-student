const express = require('express');
const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

// Khởi tạo Express App
const app = express();

// Tin cậy proxy (Hỗ trợ HTTPS trên Render, Railway, Vercel, Cloudflare, Nginx)
app.set('trust proxy', 1);

// Middlewares xử lý Request & Bảo mật
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Phục vụ thư mục tệp tĩnh (CSS, JS, Images, Uploads)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// ĐỊNH TUYẾN GIAO DIỆN (HTML Page Routes)
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'verify.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

app.get('/study-plan', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'study-plan.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// Admin Pages
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'dashboard.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'dashboard.html'));
});

app.get('/admin/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'users.html'));
});

app.get('/admin/courses', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'courses.html'));
});

app.get('/admin/documents', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'documents.html'));
});

app.get('/admin/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'profile.html'));
});


// ==========================================
// GẮN CÁC RESTFUL API ROUTES (/api/...)
// ==========================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/conversations', require('./routes/conversation.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/study-plans', require('./routes/studyPlan.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'Trợ Lý AI Sinh Viên NTU API Server is running smoothly!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
  });
});

// Xử lý Route không tồn tại & Bắt lỗi hệ thống
app.use(notFound);
app.use(errorHandler);

module.exports = app;
