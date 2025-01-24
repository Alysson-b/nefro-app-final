const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateApiKey, setSupabaseAuth } = require('../middlewares/authMiddleware');

router.get('/', validateApiKey, userController.listUsers);
router.get('/desempenho', validateApiKey, userController.getUserPerformance);
router.post('/historico', validateApiKey, userController.saveUserHistory);
router.get('/historico', validateApiKey, userController.getUserHistory);

module.exports = router;
