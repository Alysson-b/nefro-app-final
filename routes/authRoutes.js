const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.get('/confirm-email', authController.confirmEmail);
router.post('/login', authController.login);
router.post('/resend-confirmation', authController.resendConfirmation);
router.post('/recover-password', authController.recoverPassword);


module.exports = router;


