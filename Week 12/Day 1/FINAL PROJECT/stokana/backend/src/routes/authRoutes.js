const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const accountController = require('../controllers/accountController');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  verificationSendSchema,
  verificationCodeSchema,
  twoFactorCodeSchema,
  twoFactorLoginSchema,
  twoFactorDisableSchema
} = require('../validators/authValidators');

const router = express.Router();

router.get('/me', asyncHandler(authController.me));
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/login/2fa', validate(twoFactorLoginSchema), asyncHandler(authController.verifyTwoFactorLogin));
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
router.post('/verification/send', requireAuth, validate(verificationSendSchema), asyncHandler(accountController.sendVerification));
router.post('/verification/verify', requireAuth, validate(verificationCodeSchema), asyncHandler(accountController.verify));
router.post('/2fa/setup', requireAuth, asyncHandler(authController.twoFactorSetup));
router.post('/2fa/enable', requireAuth, validate(twoFactorCodeSchema), asyncHandler(authController.twoFactorEnable));
router.post('/2fa/disable', requireAuth, validate(twoFactorDisableSchema), asyncHandler(authController.twoFactorDisable));

module.exports = router;
