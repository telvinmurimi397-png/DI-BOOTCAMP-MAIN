const { z } = require('zod');

const createPromotionSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).optional(),
  kind: z.enum(['coupon', 'flash_sale']),
  productId: z.coerce.number().int().positive().optional(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.coerce.number().positive().max(10000000),
  maxDiscount: z.coerce.number().positive().max(10000000).optional(),
  minimumSubtotal: z.coerce.number().min(0).max(10000000).default(0),
  usageLimit: z.coerce.number().int().positive().max(1000000).nullable().optional(),
  startsAt: z.string().datetime({ offset: true }).optional(),
  endsAt: z.string().datetime({ offset: true }).nullable().optional()
}).superRefine((data, ctx) => {
  if (data.discountType === 'percent' && data.discountValue > 100) {
    ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentage cannot exceed 100.' });
  }
  if (data.kind === 'coupon' && !data.code) {
    ctx.addIssue({ code: 'custom', path: ['code'], message: 'A discount code is required.' });
  }
  if (data.kind === 'coupon' && data.productId) {
    ctx.addIssue({ code: 'custom', path: ['productId'], message: 'Discount codes are not product-specific.' });
  }
  if (data.kind === 'flash_sale' && !data.productId) {
    ctx.addIssue({ code: 'custom', path: ['productId'], message: 'Choose a product for the flash sale.' });
  }
  if (data.kind === 'flash_sale' && data.code) {
    ctx.addIssue({ code: 'custom', path: ['code'], message: 'Flash sales do not use discount codes.' });
  }
  if (data.endsAt && data.startsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End time must be after start time.' });
  }
});

const promotionParamsSchema = z.object({ promotionId: z.coerce.number().int().positive() });
const promotionActiveSchema = z.object({ isActive: z.boolean() });
const promotionQuoteSchema = z.object({
  code: z.string().trim().min(1).max(40).optional(),
  loyaltyPoints: z.coerce.number().int().min(0).default(0),
  useReferralCredit: z.boolean().default(false)
});

module.exports = {
  createPromotionSchema,
  promotionParamsSchema,
  promotionActiveSchema,
  promotionQuoteSchema
};
