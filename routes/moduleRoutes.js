const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { validateApiKey } = require('../middlewares/authMiddleware'); 

router.get('/:idCurso/modulos', validateApiKey, moduleController.listModules);

router.get('/search', validateApiKey, moduleController.searchModules);

router.post('/:idCurso/modulos', validateApiKey, moduleController.createModule);
router.get('/todos', validateApiKey, moduleController.listAllModules);

module.exports = router;
