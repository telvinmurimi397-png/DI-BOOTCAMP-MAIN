const { z } = require('zod');

const checkoutSchema = z.object({
  shippingName: z.string().trim().min(3, 'Enter the recipient name.').max(120),
  shippingPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid delivery phone number.'),
  shippingCounty: z.string().trim().min(2, 'Choose your county.').max(80),
  shippingTown: z.string().trim().min(2, 'Enter your town or estate.').max(80),
  shippingAddress: z.string().trim().min(8, 'Enter a delivery address with a landmark.').max(500),
  notes: z.string().trim().max(500).optional(),
  promotionCode: z.string().trim().min(3).max(40).optional(),
  loyaltyPoints: z.coerce.number().int().min(0).default(0),
  useReferralCredit: z.boolean().default(false)
});

const orderNumberParamsSchema = z.object({
  orderNumber: z.string().trim().regex(/^STK-[A-Z0-9-]{4,26}$/, 'Invalid order number.')
});

const orderShipmentParamsSchema = z.object({
  orderNumber: z.string().trim().regex(/^STK-[A-Z0-9-]{4,26}$/, 'Invalid order number.'),
  shipmentId: z.coerce.number().int().positive()
});

const buyerOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10),
  status: z.enum(['all', 'active', 'awaiting_payment', 'delivered', 'cancelled']).default('all')
});

const orderIdParamsSchema = z.object({
  orderId: z.coerce.number().int().positive()
});

const simulatePaymentSchema = z.object({
  outcome: z.enum(['success', 'failed']).default('success')
});

const mpesaPaymentSchema = z.object({
  phone: z.string().trim().min(7).max(20)
});

const orderAdjustmentRequestSchema = z.discriminatedUnion('requestType', [
  z.object({
    requestType: z.literal('cancellation'),
    reason: z.string().trim().min(10).max(2000)
  }),
  z.object({
    requestType: z.literal('return_refund'),
    orderItemId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(99),
    reason: z.string().trim().min(10).max(2000)
  })
]);

const orderRequestParamsSchema = z.object({
  requestId: z.coerce.number().int().positive()
});

const orderRequestsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'refunded', 'all']).default('pending'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

const reviewOrderRequestSchema = z.object({
  action: z.enum(['approve', 'reject', 'refund']),
  refundReference: z.string().trim().min(2).max(120).optional(),
  refundAmount: z.coerce.number().positive().max(1000000000).optional()
}).superRefine((data, ctx) => {
  if (data.action === 'refund' && !data.refundReference) {
    ctx.addIssue({
      code: 'custom',
      path: ['refundReference'],
      message: 'Enter the payment provider refund reference.'
    });
  }
});

const reviewSchema = z.object({
  orderItemId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1, 'Choose a rating.').max(5),
  title: z.string().trim().max(150).optional(),
  comment: z.string().trim().max(2000).optional()
});

module.exports = {
  checkoutSchema,
  orderNumberParamsSchema,
  orderShipmentParamsSchema,
  buyerOrdersQuerySchema,
  orderIdParamsSchema,
  simulatePaymentSchema,
  mpesaPaymentSchema,
  orderAdjustmentRequestSchema,
  orderRequestParamsSchema,
  orderRequestsQuerySchema,
  reviewOrderRequestSchema,
  reviewSchema
};
