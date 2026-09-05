const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã học phần là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Tên học phần là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: 'Khoa Công Nghệ Thông Tin',
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, 'Số tín chỉ là bắt buộc'],
      min: 1,
      max: 10,
      default: 3,
    },
    semester: {
      type: String,
      default: 'Học kỳ 1 - 2026',
    },
    instructor: {
      type: String,
      default: 'TS. Nguyễn Văn A',
      trim: true,
    },
    syllabus: [
      {
        week: Number,
        topic: String,
        description: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
