const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, default: 'Chung' },
  duration: { type: String, default: '45 phút' },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  notes: { type: String, default: '' },
});

const dayScheduleSchema = new mongoose.Schema({
  dayIndex: { type: Number, required: true },
  dayName: { type: String, required: true }, // Thứ 2, Thứ 3, Ngày 1, ...
  date: { type: String, default: '' },
  focus: { type: String, default: 'Ôn tập kiến thức trọng tâm' },
  tasks: [taskSchema],
});

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề kế hoạch là bắt buộc'],
      trim: true,
    },
    goal: {
      type: String,
      required: [true, 'Mục tiêu ôn thi là bắt buộc'],
      trim: true,
    },
    targetExam: {
      type: String,
      default: 'Thi Cuối Kỳ',
    },
    targetDate: {
      type: Date,
      required: [true, 'Ngày thi hoặc hạn hoàn thành là bắt buộc'],
    },
    dailyHours: {
      type: Number,
      default: 3,
      min: 1,
      max: 16,
    },
    subjects: [
      {
        type: String,
        trim: true,
      },
    ],
    schedule: [dayScheduleSchema],
    studyTips: [
      {
        type: String,
      },
    ],
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'archived'],
      default: 'in_progress',
    },
    generatedByAi: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tính toán lại tỷ lệ phần trăm hoàn thành
studyPlanSchema.methods.calculateProgress = function () {
  let totalTasks = 0;
  let completedTasks = 0;

  if (this.schedule && this.schedule.length > 0) {
    this.schedule.forEach((day) => {
      if (day.tasks && day.tasks.length > 0) {
        day.tasks.forEach((task) => {
          totalTasks += 1;
          if (task.isCompleted) completedTasks += 1;
        });
      }
    });
  }

  this.progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  if (this.progressPercentage === 100) {
    this.status = 'completed';
  } else if (this.status === 'completed' && this.progressPercentage < 100) {
    this.status = 'in_progress';
  }
  return this.progressPercentage;
};

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

module.exports = StudyPlan;
