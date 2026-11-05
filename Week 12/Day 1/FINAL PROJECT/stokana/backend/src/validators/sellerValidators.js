const { z } = require('zod');

const imageUrlRule = z
  .string()
  .trim()
  .max(500, 'Image URL is too long.')
  .refine(
    (value) => /^(https?:\/\/|\/)[^\s]+$/i.test(value),
    'Image URLs must start with https://, http:// or /.'
  );

const specificationsRule = z.record(
  z.string().trim().min(1).max(60),
  z.string().trim().max(500)
).default({});

const variantsRule = z.array(z.object({
  sku: z.string().trim().min(1).max(80),
  attributes: z.record(
    z.string().trim().min(1).max(40),
    z.string().trim().min(1).max(100)
  ).refine((attributes) => Object.keys(attributes).length > 0, 'Add at least one variant option.'),
  price: z.union([
    z.coerce.number().positive().max(10_000_000).refine(
      (value) => /^\d+(\.\d{1,2})?$/.test(String(value)),
      'Variant prices can have at most two decimal places.'
    ),
    z.null()
  ]).optional(),
  stock: z.coerce.number().int().min(0).max(100_000)
})).max(100).optional();

const productFields = {
  name: z.string().trim().min(3, 'Product name must be at least 3 characters.').max(180),
  categoryId: z.coerce.number().int().positive('Choose a category.'),
  description: z
    .string()
    .trim()
    .min(20, 'Describe the product in at least 20 characters.')
    .max(5000, 'Description is too long.'),
  specifications: specificationsRule,
  variants: variantsRule,
  price: z.coerce
    .number()
    .positive('Price must be greater than zero.')
    .max(10_000_000, 'Price is too high.')
    .refine(
      (value) => /^\d+(\.\d{1,2})?$/.test(String(value)),
      'Price can have at most two decimal places.'
    ),
  compareAtPrice: z
    .union([z.coerce.number().positive().max(10_000_000), z.null()])
    .optional(),
  stock: z.coerce.number().int('Stock must be a whole number.').min(0, 'Stock cannot be negative.').max(100_000),
  condition: z.enum(['new', 'used', 'refurbished']).default('new'),
  location: z.string().trim().max(120).optional(),
  imageUrls: z.array(imageUrlRule)
    .min(1, 'Add at least one product image.')
    .max(5, 'Use up to 5 images.')
    .refine((urls) => new Set(urls).size === urls.length, 'Product images must be unique.')
};

const productWithVariantsSchema = (schema) => schema.superRefine((data, ctx) => {
  if (!data.variants) return;
  const skus = new Set();
  data.variants.forEach((variant, index) => {
    const sku = variant.sku.toLowerCase();
    if (skus.has(sku)) {
      ctx.addIssue({ code: 'custom', path: ['variants', index, 'sku'], message: 'Variant SKUs must be unique.' });
    }
    skus.add(sku);
  });
});

const createProductSchema = productWithVariantsSchema(z
  .object(productFields)
  .refine(
    (data) => data.compareAtPrice == null || data.compareAtPrice > data.price,
    { message: 'Compare-at price must be higher than the selling price.', path: ['compareAtPrice'] }
  ));

const updateProductSchema = productWithVariantsSchema(z
  .object({
    name: productFields.name.optional(),
    categoryId: productFields.categoryId.optional(),
    description: productFields.description.optional(),
    specifications: specificationsRule.optional(),
    variants: variantsRule,
    price: productFields.price.optional(),
    compareAtPrice: productFields.compareAtPrice,
    stock: productFields.stock.optional(),
    condition: productFields.condition.optional(),
    location: productFields.location
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: 'Provide at least one field to update.' }
  ));

const stockSchema = z.object({
  stock: z.coerce.number().int('Stock must be a whole number.').min(0).max(100_000)
});

const addImageSchema = z.object({
  url: imageUrlRule,
  altText: z.string().trim().max(200).optional(),
  isPrimary: z.boolean().optional()
});

const imageIdParamsSchema = z.object({
  productId: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive()
});

const productIdParamsSchema = z.object({
  productId: z.coerce.number().int().positive()
});

const shipmentParamsSchema = z.object({
  shipmentId: z.coerce.number().int().positive()
});

const pickupLocationParamsSchema = z.object({
  pickupLocationId: z.coerce.number().int().positive()
});

const pickupLocationFields = {
  label: z.string().trim().min(2, 'Enter a pickup location label.').max(80),
  county: z.string().trim().min(2, 'Choose a county.').max(80),
  town: z.string().trim().min(2, 'Enter a town or area.').max(80),
  addressLine: z.string().trim().min(5, 'Enter the pickup street address.').max(500),
  contactName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).refine(
    (value) => !value || /^\+?[0-9 ()-]{7,20}$/.test(value),
    'Enter a valid contact phone number.'
  ).optional(),
  instructions: z.string().trim().max(500).optional(),
  isDefault: z.boolean().optional()
};

const createPickupLocationSchema = z.object(pickupLocationFields);
const updatePickupLocationSchema = z.object(pickupLocationFields).partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  { message: 'Provide at least one field to update.' }
);

const shipmentUpdateSchema = z
  .object({
    status: z.enum(['dispatched', 'in_transit', 'delivered', 'failed']),
    carrier: z.string().trim().max(80).optional(),
    trackingNumber: z.string().trim().max(120).optional(),
    trackingUrl: z.string().trim().url().max(500).refine(
      (value) => {
        try {
          return new URL(value).protocol === 'https:';
        } catch {
          return false;
        }
      },
      'Tracking links must use HTTPS.'
    ).optional(),
    pickupLocationId: z.coerce.number().int().positive().nullable().optional()
  })
  .superRefine((data, ctx) => {
    if (data.status === 'dispatched' && !data.carrier && !data.trackingNumber) {
      ctx.addIssue({
        code: 'custom',
        path: ['trackingNumber'],
        message: 'Add a courier or tracking number when dispatching an order.'
      });
    }
  });

const sellerOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10)
});

const sellerProductsQuerySchema = z.object({
  status: z.enum(['all', 'approved', 'pending', 'rejected', 'archived']).default('all'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(20)
});

const shopImageRule = z
  .string()
  .trim()
  .max(500, 'Image URL is too long.')
  .refine(
    (value) => value === '' || /^(https?:\/\/|\/)[^\s]+$/i.test(value),
    'Image URLs must start with https://, http:// or /.'
  );

const updateShopSchema = z
  .object({
    description: z.string().trim().max(1000, 'Description is too long.').optional(),
    logoUrl: shopImageRule.optional(),
    bannerUrl: shopImageRule.optional(),
    county: z.string().trim().max(80).optional(),
    town: z.string().trim().max(80).optional(),
    phone: z
      .string()
      .trim()
      .max(30, 'Phone number is too long.')
      .refine(
        (value) => value === '' || /^\+?[0-9 ()-]{7,20}$/.test(value),
        'Enter a valid phone number.'
      )
      .optional(),
    deliveryFee: z.coerce
      .number()
      .min(0, 'Delivery fee cannot be negative.')
      .max(100_000, 'Delivery fee is too high.')
      .refine(
        (value) => /^\d+(\.\d{1,2})?$/.test(String(value)),
        'Delivery fee can have at most two decimal places.'
      )
      .optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update.'
  });

module.exports = {
  createProductSchema,
  updateProductSchema,
  stockSchema,
  addImageSchema,
  imageIdParamsSchema,
  productIdParamsSchema,
  shipmentParamsSchema,
  pickupLocationParamsSchema,
  createPickupLocationSchema,
  updatePickupLocationSchema,
  shipmentUpdateSchema,
  sellerOrdersQuerySchema,
  sellerProductsQuerySchema,
  updateShopSchema,
  specificationsRule,
  variantsRule
};
