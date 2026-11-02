const express = require('express');
const adminController = require('../controllers/adminController');
const promotionController = require('../controllers/promotionController');
const marketingController = require('../controllers/marketingController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const messageController = require('../controllers/messageController');
const {
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
  updateFeaturedSchema,
  categorySchema,
  updateCategorySchema,
  adminOrdersQuerySchema,
  reportsQuerySchema,
  commissionsQuerySchema,
  paymentReconciliationQuerySchema,
  payoutSchema,
  updateSettingsSchema,
  updateOrderStatusSchema
} = require('../validators/adminValidators');
const {
  orderRequestParamsSchema,
  orderRequestsQuerySchema,
  reviewOrderRequestSchema
} = require('../validators/orderValidators');
const {
  messageReportsQuerySchema,
  messageReportParamsSchema,
  reviewMessageReportSchema
} = require('../validators/messageValidators');

const router = express.Router();
const {
  createPromotionSchema,
  promotionParamsSchema,
  promotionActiveSchema
} = require('../validators/promotionValidators');
const {
  createCampaignSchema,
  campaignParamsSchema
} = require('../validators/marketingValidators');

router.use(requireAdmin);

router.get('/overview', asyncHandler(adminController.overview));
router.get('/users', validate(adminUsersQuerySchema, 'query'), asyncHandler(adminController.users));
router.patch(
  '/users/:userId/status',
  validate(userIdParamsSchema, 'params'),
  validate(updateUserStatusSchema),
  asyncHandler(adminController.setUserStatus)
);

router.get('/sellers', validate(adminSellersQuerySchema, 'query'), asyncHandler(adminController.sellers));
router.patch(
  '/sellers/:sellerId/review',
  validate(sellerIdParamsSchema, 'params'),
  validate(reviewSellerSchema),
  asyncHandler(adminController.reviewSeller)
);
router.patch(
  '/sellers/:sellerId/featured',
  validate(sellerIdParamsSchema, 'params'),
  validate(updateFeaturedSchema),
  asyncHandler(adminController.setSellerFeatured)
);

router.get('/products', validate(adminProductsQuerySchema, 'query'), asyncHandler(adminController.products));
router.patch(
  '/products/:productId/featured',
  validate(adminProductIdParamsSchema, 'params'),
  validate(updateFeaturedSchema),
  asyncHandler(adminController.setProductFeatured)
);
router.get('/promotions', asyncHandler(promotionController.listAdmin));
router.post('/promotions', validate(createPromotionSchema), asyncHandler(promotionController.createAdmin));
router.patch(
  '/promotions/:promotionId',
  validate(promotionParamsSchema, 'params'),
  validate(promotionActiveSchema),
  asyncHandler(promotionController.setAdminActive)
);
router.get('/campaigns', asyncHandler(marketingController.listCampaigns));
router.post('/campaigns', validate(createCampaignSchema), asyncHandler(marketingController.createCampaign));
router.post(
  '/campaigns/:campaignId/send',
  validate(campaignParamsSchema, 'params'),
  asyncHandler(marketingController.sendCampaign)
);
router.patch(
  '/products/:productId/review',
  validate(adminProductIdParamsSchema, 'params'),
  validate(reviewProductSchema),
  asyncHandler(adminController.reviewProduct)
);

router.get('/categories', asyncHandler(adminController.categories));
router.post('/categories', validate(categorySchema), asyncHandler(adminController.createCategory));
router.patch(
  '/categories/:categoryId',
  validate(categoryIdParamsSchema, 'params'),
  validate(updateCategorySchema),
  asyncHandler(adminController.updateCategory)
);
router.delete(
  '/categories/:categoryId',
  validate(categoryIdParamsSchema, 'params'),
  asyncHandler(adminController.deleteCategory)
);

router.get('/orders', validate(adminOrdersQuerySchema, 'query'), asyncHandler(adminController.orders));
router.patch(
  '/orders/:orderId/status',
  validate(orderIdParamsSchema, 'params'),
  validate(updateOrderStatusSchema),
  asyncHandler(adminController.updateOrderStatus)
);
router.get(
  '/order-requests',
  validate(orderRequestsQuerySchema, 'query'),
  asyncHandler(adminController.orderRequests)
);
router.patch(
  '/order-requests/:requestId',
  validate(orderRequestParamsSchema, 'params'),
  validate(reviewOrderRequestSchema),
  asyncHandler(adminController.reviewOrderRequest)
);

router.get('/reports', validate(reportsQuerySchema, 'query'), asyncHandler(adminController.reports));
router.get(
  '/message-reports',
  validate(messageReportsQuerySchema, 'query'),
  asyncHandler(messageController.messageReports)
);
router.patch(
  '/message-reports/:reportId',
  validate(messageReportParamsSchema, 'params'),
  validate(reviewMessageReportSchema),
  asyncHandler(messageController.reviewMessageReport)
);
router.get(
  '/commissions',
  validate(commissionsQuerySchema, 'query'),
  asyncHandler(adminController.commissions)
);
router.get(
  '/payments',
  validate(paymentReconciliationQuerySchema, 'query'),
  asyncHandler(adminController.paymentReconciliation)
);
router.post('/payouts', validate(payoutSchema), asyncHandler(adminController.paySeller));

router.get('/settings', asyncHandler(adminController.settings));
router.patch(
  '/settings',
  validate(updateSettingsSchema),
  asyncHandler(adminController.updateSettings)
);

module.exports = router;
