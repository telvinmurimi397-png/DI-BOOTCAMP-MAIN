const { z } = require('zod');

const adminUsersQuerySchema = z.object({
  role: z.enum(['all', 'buyer', 'seller', 'admin']).default('all'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

const adminSellersQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'approved', 'rejected', 'suspended']).default('all'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

const adminProductsQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'approved', 'rejected', 'archived']).default('pending'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

const reviewSellerSchema = z
  .object({
    action: z.enum(['approve', 'reject', 'suspend']),
    reason: z.string().trim().max(500).optional()
  })
  .superRefine((data, ctx) => {
    if ((data.action === 'reject' || data.action === 'suspend') && !data.reason) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Give the seller a reason.' });
    }
  });

const reviewProductSchema = z
  .object({
    action: z.enum(['approve', 'reject', 'archive']),
    reason: z.string().trim().max(500).optional()
  })
  .superRefine((data, ctx) => {
    if (data.action === 'reject' && !data.reason) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Give the seller a reason for rejection.' });
    }
  });

const userIdParamsSchema = z.object({ userId: z.coerce.number().int().positive() });
const sellerIdParamsSchema = z.object({ sellerId: z.coerce.number().int().positive() });
const adminProductIdParamsSchema = z.object({ productId: z.coerce.number().int().positive() });
const categoryIdParamsSchema = z.object({ categoryId: z.coerce.number().int().positive() });
const orderIdParamsSchema = z.object({ orderId: z.coerce.number().int().positive() });

const updateUserStatusSchema = z.object({
  isActive: z.boolean({ message: 'Provide true or false.' })
});

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is too short.').max(100),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(40).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional()
});

const updateCategorySchema = categorySchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'Provide at least one field to update.' }
);

const adminOrdersQuerySchema = z.object({
  status: z.enum(['all', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']).default('all'),
  q: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

const reportsQuerySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD dates.').optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD dates.').optional()
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: 'The start date must be on or before the end date.',
    path: ['from']
  });

const commissionsQuerySchema = z.object({
  status: z.enum(['all', 'earned', 'paid']).default('all')
});

const payoutSchema = z.object({
  sellerId: z.coerce.number().int().positive(),
  reference: z.string().trim().min(3, 'Add a payout reference.').max(120)
});

const updateSettingsSchema = z
  .object({
    commissionRate: z.coerce
      .number()
      .min(0, 'Commission rate cannot be negative.')
      .max(0.5, 'Commission rate cannot exceed 50%.')
      .optional(),
    shippingFee: z.coerce
      .number()
      .min(0, 'Shipping fee cannot be negative.')
      .max(100000, 'Shipping fee is too high.')
      .optional(),
    freeShippingThreshold: z.coerce
      .number()
      .min(0, 'Free shipping threshold cannot be negative.')
      .max(1000000, 'Free shipping threshold is too high.')
      .optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one setting to update.'
  });

const updateOrderStatusSchema = z.object({
  status: z.enum(['processing', 'shipped', 'delivered', 'cancelled'])
});

module.exports = {
  adminUsersQuerySchema,
  adminSellersQuerySchema,
  adminProductsQuerySchema,
  reviewSellerSchema,
  reviewProductSchema,
  userIdParamsSchema,
  sellerIdParamsSchema,
  adminProductIdParamsSchema,
  categoryIdParamsSchema,
  orderIdParamsSchema,
  updateUserStatusSchema,
  categorySchema,
  updateCategorySchema,
  adminOrdersQuerySchema,
  reportsQuerySchema,
  commissionsQuerySchema,
  payoutSchema,
  updateSettingsSchema,
  updateOrderStatusSchema
};
