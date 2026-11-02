const express = require('express');
const notificationController = require('../controllers/notificationController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { notificationParamsSchema } = require('../validators/marketingValidators');

const router = express.Router();
router.use(requireAuth);
router.get('/', asyncHandler(notificationController.list));
router.patch('/read-all', asyncHandler(notificationController.markAllRead));
router.patch(
  '/:notificationId/read',
  validate(notificationParamsSchema, 'params'),
  asyncHandler(notificationController.markRead)
);

module.exports = router;
