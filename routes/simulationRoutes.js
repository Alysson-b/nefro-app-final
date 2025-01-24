const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController'); 
const { validateApiKey } = require('../middlewares/authMiddleware');

router.use(validateApiKey);

router.get('/', simulationController.listTests);
router.post('/', simulationController.createTest);
// router.post('/:testId/questoes', simulationController.addQuestionsToTest);
router.post('/:testId/questoes', simulationController.addRandomQuestionsToTest);
router.post('/:testId/progresso', simulationController.saveProgress);
router.get('/:testId/progresso', simulationController.loadProgress);

router.patch('/:testId/progresso', validateApiKey, simulationController.updateProgress);

router.get('/:testId/detalhes', simulationController.getTestDetails);
router.get('/:testId/historico', simulationController.getTestHistory);
router.post('/:testId/iniciar', simulationController.startTestAttempt);
router.post('/:testId/responder', simulationController.saveAnswer);
router.put('/:testId', simulationController.updateTest);
router.delete('/:testId', simulationController.deleteTest);
router.post('/:testId/finalizar', simulationController.finalizeTest);

module.exports = router;
