const express = require('express');
const orderController = require('../controllers/orderController');
const promotionController = require('../controllers/promotionController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireBuyer, requireVerifiedEmail } = require('../middleware/auth');
const {
  checkoutSchema,
  orderNumberParamsSchema,
  orderShipmentParamsSchema,
  buyerOrdersQuerySchema,
  simulatePaymentSchema,
  mpesaPaymentSchema,
  orderAdjustmentRequestSchema
} = require('../validators/orderValidators');
const { promotionQuoteSchema } = require('../validators/promotionValidators');

const router = express.Router();

router.use(requireBuyer);

router.get('/stats', asyncHandler(orderController.stats));
router.get('/', validate(buyerOrdersQuerySchema, 'query'), asyncHandler(orderController.listOrders));
router.post(
  '/checkout/quote',
  validate(promotionQuoteSchema),
  asyncHandler(promotionController.quote)
);
router.post('/checkout', requireVerifiedEmail, validate(checkoutSchema), asyncHandler(orderController.checkout));
router.get(
  '/:orderNumber',
  validate(orderNumberParamsSchema, 'params'),
  asyncHandler(orderController.getOrder)
);
router.post(
  '/:orderNumber/shipments/:shipmentId/confirm-delivery',
  validate(orderShipmentParamsSchema, 'params'),
  asyncHandler(orderController.confirmDelivery)
);
router.post(
  '/:orderNumber/cancel',
  validate(orderNumberParamsSchema, 'params'),
  asyncHandler(orderController.cancelOrder)
);
router.post(
  '/:orderNumber/requests',
  validate(orderNumberParamsSchema, 'params'),
  validate(orderAdjustmentRequestSchema),
  asyncHandler(orderController.requestAdjustment)
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
router.post(
  '/:orderNumber/payment/stk-push',
  validate(orderNumberParamsSchema, 'params'),
  validate(mpesaPaymentSchema),
  asyncHandler(orderController.startMpesaPayment)
);

module.exports = router;
