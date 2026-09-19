const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatbot_student_db';
    const isAtlas = mongoURI.includes('mongodb+srv') || mongoURI.includes('mongodb.net');
    
    console.log(`[Database] Đang kết nối tới ${isAtlas ? 'MongoDB Atlas Cloud' : 'MongoDB Local'}...`);

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });

    console.log(`[Database] Kết nối MongoDB thành công: Host = ${conn.connection.host} | Database = ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Không thể kết nối MongoDB: ${error.message}`);
    console.warn('[Database Notice] Nếu sử dụng MongoDB Atlas, hãy kiểm tra Network Access (IP Whitelist 0.0.0.0/0) và Connection String trong .env.');
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] Mongoose mất kết nối đến MongoDB. Đang chờ kết nối lại...');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] Lỗi kết nối Mongoose:', err.message);
});

module.exports = connectDB;
