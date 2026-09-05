const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/stats', protect, userController.getStudentStats);
router.put('/preferences', protect, userController.updatePreferences);

module.exports = router;
