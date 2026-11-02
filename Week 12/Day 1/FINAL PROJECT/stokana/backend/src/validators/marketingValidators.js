const { z } = require('zod');

const createCampaignSchema = z.object({
  title: z.string().trim().min(3).max(120).refine((value) => !/[\r\n]/.test(value)),
  subject: z.string().trim().min(3).max(180).refine((value) => !/[\r\n]/.test(value)),
  body: z.string().trim().min(10).max(10000)
});

const notificationParamsSchema = z.object({
  notificationId: z.coerce.number().int().positive()
});

const campaignParamsSchema = z.object({
  campaignId: z.coerce.number().int().positive()
});

module.exports = { createCampaignSchema, notificationParamsSchema, campaignParamsSchema };
