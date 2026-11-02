const { z } = require('zod');

const startConversationSchema = z
  .object({
    sellerId: z.coerce.number().int().positive(),
    productId: z.coerce.number().int().positive().optional(),
    orderNumber: z.string().trim().min(1).max(64).optional()
  })
  .refine((data) => !(data.productId && data.orderNumber), {
    message: 'A conversation can refer to a product or an order, not both.'
  });

const conversationIdParamsSchema = z.object({
  conversationId: z.coerce.number().int().positive()
});

const sendMessageSchema = z.object({
  body: z.string().trim().max(4000, 'Messages must be 4000 characters or fewer.').default('')
});

const reportConversationSchema = z.object({
  reason: z.string().trim().min(10, 'Explain why you are reporting this conversation.').max(2000)
});

const messageReportsQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'reviewed', 'dismissed']).default('pending'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

const messageReportParamsSchema = z.object({
  reportId: z.coerce.number().int().positive()
});

const reviewMessageReportSchema = z.object({
  status: z.enum(['reviewed', 'dismissed'])
});

const setBlockSchema = z.object({
  blocked: z.boolean()
});

module.exports = {
  startConversationSchema,
  conversationIdParamsSchema,
  sendMessageSchema,
  reportConversationSchema,
  messageReportsQuerySchema,
  messageReportParamsSchema,
  reviewMessageReportSchema,
  setBlockSchema
};
