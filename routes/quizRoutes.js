const express = require('express');
const router = express.Router({ mergeParams: true });
const quizController = require('../controllers/quizController');
const { validateApiKey } = require('../middlewares/authMiddleware'); 

router.get('/:idModulo/provas', validateApiKey, quizController.listQuizzes);
router.post('/:idModulo/provas', validateApiKey, quizController.createQuiz);
router.get('/todas', validateApiKey, quizController.listAllQuizzes);

module.exports = router;
