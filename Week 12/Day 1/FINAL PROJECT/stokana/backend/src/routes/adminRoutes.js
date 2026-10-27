const express = require('express');
const adminController = require('../controllers/adminController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
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
  categorySchema,
  updateCategorySchema,
  adminOrdersQuerySchema,
  reportsQuerySchema,
  commissionsQuerySchema,
  payoutSchema,
  updateSettingsSchema,
  updateOrderStatusSchema
} = require('../validators/adminValidators');

const router = express.Router();

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

router.get('/products', validate(adminProductsQuerySchema, 'query'), asyncHandler(adminController.products));
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

router.get('/reports', validate(reportsQuerySchema, 'query'), asyncHandler(adminController.reports));
router.get(
  '/commissions',
  validate(commissionsQuerySchema, 'query'),
  asyncHandler(adminController.commissions)
);
router.post('/payouts', validate(payoutSchema), asyncHandler(adminController.paySeller));

router.get('/settings', asyncHandler(adminController.settings));
router.patch(
  '/settings',
  validate(updateSettingsSchema),
  asyncHandler(adminController.updateSettings)
);

module.exports = router;
