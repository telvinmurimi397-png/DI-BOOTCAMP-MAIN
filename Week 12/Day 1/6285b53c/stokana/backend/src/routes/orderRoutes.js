const express = require('express');
const orderController = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireBuyer } = require('../middleware/auth');
const {
  checkoutSchema,
  orderNumberParamsSchema,
  buyerOrdersQuerySchema,
  simulatePaymentSchema
} = require('../validators/orderValidators');

const router = express.Router();

router.use(requireBuyer);

router.get('/stats', asyncHandler(orderController.stats));
router.get('/', validate(buyerOrdersQuerySchema, 'query'), asyncHandler(orderController.listOrders));
router.post('/checkout', validate(checkoutSchema), asyncHandler(orderController.checkout));
router.get(
  '/:orderNumber',
  validate(orderNumberParamsSchema, 'params'),
  asyncHandler(orderController.getOrder)
);
router.post(
  '/:orderNumber/cancel',
  validate(orderNumberParamsSchema, 'params'),
  asyncHandler(orderController.cancelOrder)
);
router.post(
  '/:orderNumber/payment/retry',
  validate(orderNumberParamsSchema, 'params'),
  asyncHandler(orderController.retryPayment)
);
router.post(
  '/:orderNumber/payment/simulate',
  validate(orderNumberParamsSchema, 'params'),
  validate(simulatePaymentSchema),
  asyncHandler(orderController.simulatePayment)
);

module.exports = router;
