const StudyPlan = require('../models/StudyPlan');
const aiService = require('./ai.service');

class StudyPlanService {
  /**
   * Tạo kế hoạch học tập mới với sự hỗ trợ của AI
   */
  async createStudyPlan({ userId, goal, targetExam, targetDate, dailyHours = 3, subjects = [] }) {
    const aiPlanData = await aiService.generateStudyPlan({
      goal,
      targetExam,
      targetDate,
      dailyHours,
      subjects,
    });

    const studyPlan = await StudyPlan.create({
      userId,
      title: aiPlanData.title || `Lộ trình ôn thi: ${goal}`,
      goal,
      targetExam: targetExam || 'Kỳ thi Cuối Kỳ',
      targetDate: new Date(targetDate),
      dailyHours: Number(dailyHours),
      subjects,
      schedule: aiPlanData.schedule || [],
      studyTips: aiPlanData.studyTips || [],
      progressPercentage: 0,
      status: 'in_progress',
    });

    return studyPlan;
  }

  /**
   * Lấy danh sách kế hoạch học tập của sinh viên
   */
  async getUserPlans(userId) {
    return await StudyPlan.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Lấy chi tiết một kế hoạch học tập
   */
  async getPlanById(planId, userId) {
    const plan = await StudyPlan.findOne({ _id: planId, userId });
    if (!plan) {
      throw new Error('Kế hoạch học tập không tồn tại.');
    }
    return plan;
  }

  /**
   * Bật/Tắt trạng thái hoàn thành của một Task trong lịch trình
   */
  async toggleTask(planId, taskId, userId) {
    const plan = await StudyPlan.findOne({ _id: planId, userId });
    if (!plan) {
      throw new Error('Không tìm thấy kế hoạch học tập.');
    }

    let found = false;
    for (const day of plan.schedule) {
      for (const task of day.tasks) {
        if (task._id.toString() === taskId.toString()) {
          task.isCompleted = !task.isCompleted;
          task.completedAt = task.isCompleted ? new Date() : null;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      throw new Error('Không tìm thấy nhiệm vụ (Task) trong lịch trình.');
    }

    plan.calculateProgress();
    await plan.save();

    return plan;
  }

  /**
   * Xóa kế hoạch học tập
   */
  async deletePlan(planId, userId) {
    const plan = await StudyPlan.findOneAndDelete({ _id: planId, userId });
    if (!plan) {
      throw new Error('Không tìm thấy kế hoạch học tập để xóa.');
    }
    return { message: 'Đã xóa kế hoạch học tập thành công.' };
  }
}

module.exports = new StudyPlanService();
