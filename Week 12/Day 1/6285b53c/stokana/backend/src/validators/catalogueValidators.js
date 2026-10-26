const { z } = require('zod');

const optionalNumberQuery = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? undefined : value),
  z.coerce.number().min(0, 'Price cannot be negative.').max(100_000_000).optional()
);

const productsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    category: z.string().trim().max(120).optional(),
    shop: z.string().trim().max(150).optional(),
    minPrice: optionalNumberQuery,
    maxPrice: optionalNumberQuery,
    inStock: z.enum(['true', 'false']).optional(),
    featured: z.enum(['true']).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating']).default('newest'),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12)
  })
  .refine(
    (data) => data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice,
    { message: 'Minimum price cannot be greater than maximum price.', path: ['minPrice'] }
  );

const slugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(220).regex(/^[a-z0-9-]+$/, 'Invalid product address.')
});

const shopParamsSchema = z.object({
  slug: z.string().trim().min(1).max(150).regex(/^[a-z0-9-]+$/, 'Invalid shop address.')
});

const shopProductsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating']).default('newest'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12)
});

const shopsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(24).default(12)
});

const productReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(5)
});

module.exports = {
  productsQuerySchema,
  slugParamsSchema,
  shopParamsSchema,
  shopProductsQuerySchema,
  shopsQuerySchema,
  productReviewsQuerySchema
};
