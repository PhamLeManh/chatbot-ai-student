const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlan.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Tất cả các API lộ trình ôn thi yêu cầu đăng nhập

router.post('/', studyPlanController.createPlan);
router.get('/', studyPlanController.getPlans);
router.get('/:id', studyPlanController.getPlan);
router.put('/:id/tasks/:taskId/toggle', studyPlanController.toggleTask);
router.delete('/:id', studyPlanController.deletePlan);

module.exports = router;
