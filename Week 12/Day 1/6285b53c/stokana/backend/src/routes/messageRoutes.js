const express = require('express');
const messageController = require('../controllers/messageController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');
const {
  startConversationSchema,
  conversationIdParamsSchema,
  sendMessageSchema
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
  validate(sendMessageSchema),
  asyncHandler(messageController.sendMessage)
);
router.get('/unread-count', asyncHandler(messageController.unreadCount));

module.exports = router;
