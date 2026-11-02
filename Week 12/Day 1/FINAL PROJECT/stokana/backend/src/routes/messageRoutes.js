const express = require('express');
const messageController = require('../controllers/messageController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  startConversationSchema,
  conversationIdParamsSchema,
  sendMessageSchema,
  reportConversationSchema,
  setBlockSchema
} = require('../validators/messageValidators');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'You are sending messages too quickly. Please slow down.' }
});

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many conversation reports. Please try again later.' }
});

router.use(requireRole('buyer', 'seller'));

router.get('/conversations', asyncHandler(messageController.listConversations));
router.post(
  '/conversations',
  validate(startConversationSchema),
  asyncHandler(messageController.startConversation)
);
router.get(
  '/conversations/:conversationId',
  validate(conversationIdParamsSchema, 'params'),
  asyncHandler(messageController.getMessages)
);
router.post(
  '/conversations/:conversationId/messages',
  messageLimiter,
  validate(conversationIdParamsSchema, 'params'),
  upload.single('image'),
  validate(sendMessageSchema),
  asyncHandler(messageController.sendMessage)
);
router.patch(
  '/conversations/:conversationId/block',
  validate(conversationIdParamsSchema, 'params'),
  validate(setBlockSchema),
  asyncHandler(messageController.setBlock)
);
router.post(
  '/conversations/:conversationId/reports',
  reportLimiter,
  validate(conversationIdParamsSchema, 'params'),
  validate(reportConversationSchema),
  asyncHandler(messageController.reportConversation)
);
router.get('/unread-count', asyncHandler(messageController.unreadCount));

module.exports = router;
