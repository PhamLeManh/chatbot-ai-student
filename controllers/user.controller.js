const path = require('path');
const Conversation = require('../models/Conversation');
const StudyPlan = require('../models/StudyPlan');
const Document = require('../models/Document');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

class UserController {
  // GET /api/users/stats
  async getStudentStats(req, res, next) {
    try {
      const userId = req.user._id;

      const [totalConversations, totalStudyPlans, totalDocuments, userDoc] = await Promise.all([
        Conversation.countDocuments({ userId }),
        StudyPlan.find({ userId }),
        Document.countDocuments({ uploadedBy: userId }),
        User.findById(userId),
      ]);

      let totalTasks = 0;
      let completedTasks = 0;

      totalStudyPlans.forEach((plan) => {
        if (plan.schedule) {
          plan.schedule.forEach((day) => {
            if (day.tasks) {
              totalTasks += day.tasks.length;
              completedTasks += day.tasks.filter((t) => t.isCompleted).length;
            }
          });
        }
      });

      const stats = {
        streak: userDoc.streak || { currentCount: 1, longestStreak: 1 },
        totalConversations,
        totalStudyPlans: totalStudyPlans.length,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalDocuments,
        user: {
          name: userDoc.name,
          email: userDoc.email,
          studentId: userDoc.studentId,
          university: userDoc.university,
          major: userDoc.major,
          role: userDoc.role,
          bio: userDoc.bio,
          avatar: userDoc.avatar,
        },
      };

      return successResponse(res, 'Lấy thống kê sinh viên thành công.', stats);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/preferences
  async updatePreferences(req, res, next) {
    try {
      const { theme, aiTone, notifications } = req.body;
      const user = await User.findById(req.user._id);

      if (theme) user.preferences.theme = theme;
      if (aiTone) user.preferences.aiTone = aiTone;
      if (notifications !== undefined) user.preferences.notifications = notifications;

      await user.save();
      return successResponse(res, 'Cập nhật cài đặt giao diện & trợ lý thành công.', user.preferences);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/users/avatar
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 'Vui lòng chọn file ảnh để tải lên.', null, 400);
      }

      // Tạo URL công khai cho ảnh
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Cập nhật avatar trong DB
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: avatarUrl },
        { new: true }
      );

      return successResponse(res, 'Cập nhật ảnh đại diện thành công!', {
        avatar: updatedUser.avatar,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          studentId: updatedUser.studentId,
          university: updatedUser.university,
          major: updatedUser.major,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          streak: updatedUser.streak,
          preferences: updatedUser.preferences,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

