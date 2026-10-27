const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('../validators/authValidators');

const router = express.Router();

router.get('/me', asyncHandler(authController.me));
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
router.patch('/profile', requireAuth, validate(updateProfileSchema), asyncHandler(authController.updateProfile));
router.patch(
  '/password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

module.exports = router;
