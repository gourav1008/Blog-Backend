const express = require('express');
const validate = require('../../middleware/validate');
const authValidator = require('../../validators/auth.validator');
const authController = require('../../controllers/auth.controller');
const { authLimiter } = require('../../middleware/rateLimiter');
const { auth } = require('../../middleware/auth');

const router = express.Router();

router.post('/register', authLimiter, validate(authValidator.register), authController.register);
router.post('/login', authLimiter, validate(authValidator.login), authController.login);
router.post('/logout', auth, authController.logout);
router.post('/refresh', authController.refresh);

module.exports = router;
