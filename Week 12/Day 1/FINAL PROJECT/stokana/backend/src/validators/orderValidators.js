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
  notes: z.string().trim().max(500).optional()
});

const orderNumberParamsSchema = z.object({
  orderNumber: z.string().trim().regex(/^STK-[A-Z0-9-]{4,26}$/, 'Invalid order number.')
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

const reviewSchema = z.object({
  orderItemId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1, 'Choose a rating.').max(5),
  title: z.string().trim().max(150).optional(),
  comment: z.string().trim().max(2000).optional()
});

module.exports = {
  checkoutSchema,
  orderNumberParamsSchema,
  buyerOrdersQuerySchema,
  orderIdParamsSchema,
  simulatePaymentSchema,
  mpesaPaymentSchema,
  reviewSchema
};
