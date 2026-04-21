const express = require('express');
const validate = require('../../middleware/validate');
const authValidator = require('../../validators/auth.validator');
const authController = require('../../controllers/auth.controller');
const { authLimiter } = require('../../middleware/rateLimiter');
const { protect } = require('../../middleware/auth');

const router = express.Router();

router.post('/register', authLimiter, validate(authValidator.register), authController.register);
router.post('/login', authLimiter, validate(authValidator.login), authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authLimiter, validate(authValidator.forgotPassword), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(authValidator.resetPassword), authController.resetPassword);
router.get('/verify-email', validate(authValidator.verifyEmail), authController.verifyEmail);

module.exports = router;
