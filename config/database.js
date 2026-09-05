const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatbot_student_db';
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Không thể kết nối MongoDB: ${error.message}`);
    console.warn('[Database Warning] Hệ thống đang chạy nhưng cần MongoDB để lưu trữ dữ liệu vĩnh viễn.');
    // In development, allow server to continue running even if local Mongo isn't started yet
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] Mongoose mất kết nối đến MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] Lỗi kết nối Mongoose:', err.message);
});

module.exports = connectDB;
