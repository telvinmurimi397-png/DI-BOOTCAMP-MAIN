const { z } = require('zod');

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be 72 characters or fewer.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[0-9]/, 'Password must include a number.');

const phoneRule = z
  .string()
  .trim()
  .max(30, 'Phone number is too long.')
  .refine((value) => value === '' || /^\+?[0-9 ()-]{7,20}$/.test(value), 'Enter a valid phone number.')
  .optional()
  .transform((value) => value || null);

const emailRule = z
  .string()
  .trim()
  .toLowerCase()
  .max(255, 'Email is too long.')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.');

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name.').max(120, 'Name is too long.'),
    email: emailRule,
    phone: phoneRule,
    password: passwordRule,
    referralCode: z.string().trim().toUpperCase().regex(/^STK[A-Z0-9]{2,13}$/).optional(),
    marketingEmailConsent: z.boolean().default(false),
    role: z.enum(['buyer', 'seller'], { message: 'Choose buyer or seller.' }).default('buyer'),
    shopName: z.string().trim().min(3, 'Shop name must be at least 3 characters.').max(120).optional(),
    shopDescription: z.string().trim().max(1000).optional(),
    shopCounty: z.string().trim().max(80).optional(),
    shopTown: z.string().trim().max(80).optional()
  })
  .superRefine((data, ctx) => {
    if (data.role === 'seller' && !data.shopName) {
      ctx.addIssue({
        code: 'custom',
        path: ['shopName'],
        message: 'Shop name is required for seller accounts.'
      });
    }
  });

const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, 'Enter your password.').max(72),
  role: z.enum(['buyer', 'seller', 'admin']).optional()
});

const forgotPasswordSchema = z.object({ email: emailRule });

const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'This reset link is invalid.'),
  password: passwordRule
});

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120).optional(),
  phone: phoneRule,
  marketingEmailConsent: z.boolean().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.').max(72),
  newPassword: passwordRule
});

const verificationSendSchema = z.object({ channel: z.enum(['email', 'phone']) });
const verificationCodeSchema = z.object({
  channel: z.enum(['email', 'phone']),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit verification code.')
});
const twoFactorCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit authenticator code.')
});
const twoFactorLoginSchema = twoFactorCodeSchema.extend({
  challengeToken: z.string().regex(/^[a-f0-9]{64}$/, 'This sign-in challenge is invalid.')
});
const twoFactorDisableSchema = twoFactorCodeSchema.extend({
  password: z.string().min(1).max(72)
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  verificationSendSchema,
  verificationCodeSchema,
  twoFactorCodeSchema,
  twoFactorLoginSchema,
  twoFactorDisableSchema
};
