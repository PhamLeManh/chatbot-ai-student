const User = require('../models/User');
const Course = require('../models/Course');
const Document = require('../models/Document');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const StudyPlan = require('../models/StudyPlan');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

class AdminController {
  // GET /api/admin/stats
  async getDashboardStats(req, res, next) {
    try {
      const [
        totalUsers,
        totalStudents,
        totalConversations,
        totalMessages,
        totalDocuments,
        totalCourses,
        totalStudyPlans,
        recentUsers,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'student' }),
        Conversation.countDocuments(),
        Message.countDocuments(),
        Document.countDocuments(),
        Course.countDocuments(),
        StudyPlan.countDocuments(),
        User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
      ]);

      const stats = {
        totalUsers,
        totalStudents,
        totalConversations,
        totalMessages,
        totalDocuments,
        totalCourses,
        totalStudyPlans,
        recentUsers,
      };

      return successResponse(res, 'Lấy dữ liệu thống kê Admin thành công.', stats);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/users
  async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || '';
      const role = req.query.role || '';

      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
        ];
      }
      if (role) {
        query.role = role;
      }

      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return paginatedResponse(res, 'Lấy danh sách người dùng thành công.', users, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/admin/users/:id
  async updateUser(req, res, next) {
    try {
      const { role, isActive, university, major, name } = req.body;
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { role, isActive, university, major, name },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return errorResponse(res, 'Không tìm thấy người dùng.', null, 404);
      }

      return successResponse(res, 'Cập nhật thông tin người dùng thành công.', updatedUser);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/admin/users/:id
  async deleteUser(req, res, next) {
    try {
      if (req.params.id === req.user._id.toString()) {
        return errorResponse(res, 'Bạn không thể tự xóa tài khoản của chính mình!', null, 400);
      }

      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser) {
        return errorResponse(res, 'Người dùng không tồn tại.', null, 404);
      }

      // Xóa các dữ liệu liên quan
      await Promise.all([
        Conversation.deleteMany({ userId: req.params.id }),
        Message.deleteMany({ userId: req.params.id }),
        StudyPlan.deleteMany({ userId: req.params.id }),
      ]);

      return successResponse(res, 'Đã xóa người dùng và dữ liệu liên quan thành công.');
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/courses
  async getCourses(req, res, next) {
    try {
      const courses = await Course.find().sort({ createdAt: -1 });
      return successResponse(res, 'Lấy danh sách môn học thành công.', courses);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/admin/courses
  async createCourse(req, res, next) {
    try {
      const { code, name, description, department, credits, semester, instructor } = req.body;
      if (!code || !name) {
        return errorResponse(res, 'Mã và tên học phần là bắt buộc.', null, 400);
      }

      const existingCourse = await Course.findOne({ code: code.toUpperCase() });
      if (existingCourse) {
        return errorResponse(res, `Mã học phần ${code.toUpperCase()} đã tồn tại.`, null, 400);
      }

      const course = await Course.create({
        code: code.toUpperCase(),
        name,
        description,
        department,
        credits: Number(credits) || 3,
        semester,
        instructor,
      });

      return successResponse(res, 'Thêm mới học phần thành công!', course, 201);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/admin/courses/:id
  async updateCourse(req, res, next) {
    try {
      const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updatedCourse) {
        return errorResponse(res, 'Không tìm thấy học phần.', null, 404);
      }

      return successResponse(res, 'Cập nhật học phần thành công!', updatedCourse);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/admin/courses/:id
  async deleteCourse(req, res, next) {
    try {
      const course = await Course.findByIdAndDelete(req.params.id);
      if (!course) {
        return errorResponse(res, 'Không tìm thấy học phần.', null, 404);
      }
      return successResponse(res, 'Đã xóa học phần thành công.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
