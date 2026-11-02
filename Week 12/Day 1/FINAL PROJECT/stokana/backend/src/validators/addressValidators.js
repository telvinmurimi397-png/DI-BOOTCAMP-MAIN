const { z } = require('zod');

const addressSchema = z.object({
  label: z.string().trim().min(1).max(60),
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/),
  county: z.string().trim().min(2).max(80),
  town: z.string().trim().min(2).max(80),
  addressLine: z.string().trim().min(8).max(500),
  isDefault: z.boolean().default(false)
});

const addressIdSchema = z.object({ addressId: z.coerce.number().int().positive() });

module.exports = { addressSchema, addressIdSchema };
