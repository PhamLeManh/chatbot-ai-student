const studyPlanService = require('../services/studyPlan.service');
const { successResponse, errorResponse } = require('../utils/response');
const { validateStudyPlanInput } = require('../utils/validators');

class StudyPlanController {
  // POST /api/study-plans
  async createPlan(req, res, next) {
    try {
      const { errors, isValid } = validateStudyPlanInput(req.body);
      if (!isValid) {
        return errorResponse(res, 'Thông tin tạo lộ trình học tập chưa hợp lệ.', errors, 400);
      }

      const { goal, targetExam, targetDate, dailyHours, subjects } = req.body;
      const plan = await studyPlanService.createStudyPlan({
        userId: req.user._id,
        goal,
        targetExam,
        targetDate,
        dailyHours,
        subjects,
      });

      return successResponse(res, 'AI đã xây dựng lộ trình học tập cá nhân hóa thành công!', plan, 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/study-plans
  async getPlans(req, res, next) {
    try {
      const plans = await studyPlanService.getUserPlans(req.user._id);
      return successResponse(res, 'Lấy danh sách lộ trình học tập thành công.', plans);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/study-plans/:id
  async getPlan(req, res, next) {
    try {
      const plan = await studyPlanService.getPlanById(req.params.id, req.user._id);
      return successResponse(res, 'Lấy chi tiết lộ trình học tập thành công.', plan);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/study-plans/:id/tasks/:taskId/toggle
  async toggleTask(req, res, next) {
    try {
      const plan = await studyPlanService.toggleTask(req.params.id, req.params.taskId, req.user._id);
      return successResponse(res, 'Cập nhật trạng thái nhiệm vụ thành công!', plan);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/study-plans/:id
  async deletePlan(req, res, next) {
    try {
      const result = await studyPlanService.deletePlan(req.params.id, req.user._id);
      return successResponse(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudyPlanController();
