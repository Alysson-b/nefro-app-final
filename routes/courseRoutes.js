const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { validateApiKey } = require('../middlewares/authMiddleware'); 

router.get('/', validateApiKey, courseController.listCourses);
router.post('/', validateApiKey, courseController.createCourse);

module.exports = router;
