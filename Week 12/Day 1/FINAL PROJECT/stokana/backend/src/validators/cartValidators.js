const { z } = require('zod');

const addCartItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1, 'Choose at least one item.').max(99, 'Maximum quantity is 99.').default(1)
});

const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Choose at least one item.').max(99, 'Maximum quantity is 99.')
});

const cartItemParamsSchema = z.object({
  itemId: z.coerce.number().int().positive()
});

module.exports = { addCartItemSchema, updateCartItemSchema, cartItemParamsSchema };
