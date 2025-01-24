const express = require('express');
const router = express.Router({ mergeParams: true });
const questionController = require('../controllers/questionController');
const { validateApiKey } = require('../middlewares/authMiddleware');

router.post('/:idModulo/questoes', validateApiKey, questionController.createQuestion);

router.get('/modulo/:idModulo/questoes', validateApiKey, questionController.listQuestionsByModule);
router.get('/prova/:idProva/questoes', validateApiKey, questionController.listQuestionsByQuiz); 
router.get('/todas', validateApiKey, questionController.listAllQuestions);
// router.post('/historico', validateApiKey, questionController.saveUserHistory);
// router.get('/historico', validateApiKey, questionController.getUserHistory);

router.get('/:id', validateApiKey, questionController.getQuestionById);
router.post('/respostas', validateApiKey, questionController.saveAnswer);



module.exports = router;
