const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/stats', protect, userController.getStudentStats);
router.put('/preferences', protect, userController.updatePreferences);
router.post('/avatar', protect, upload.uploadAvatar.single('avatar'), userController.uploadAvatar);

module.exports = router;

