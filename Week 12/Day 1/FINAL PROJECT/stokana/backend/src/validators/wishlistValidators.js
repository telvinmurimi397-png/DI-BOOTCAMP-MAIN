const { z } = require('zod');

const wishlistProductSchema = z.object({
  productId: z.coerce.number().int().positive()
});

const wishlistProductParamsSchema = z.object({
  productId: z.coerce.number().int().positive()
});

module.exports = { wishlistProductSchema, wishlistProductParamsSchema };
