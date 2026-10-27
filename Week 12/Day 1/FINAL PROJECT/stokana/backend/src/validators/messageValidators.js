const { z } = require('zod');

const startConversationSchema = z.object({
  sellerId: z.coerce.number().int().positive()
});

const conversationIdParamsSchema = z.object({
  conversationId: z.coerce.number().int().positive()
});

const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a message first.')
    .max(4000, 'Messages must be 4000 characters or fewer.')
});

module.exports = { startConversationSchema, conversationIdParamsSchema, sendMessageSchema };
