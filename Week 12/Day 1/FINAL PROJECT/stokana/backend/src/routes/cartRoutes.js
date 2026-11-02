const express = require('express');
const cartController = require('../controllers/cartController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireBuyer } = require('../middleware/auth');
const {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
  savedItemParamsSchema
} = require('../validators/cartValidators');

const router = express.Router();

router.use(requireBuyer);

router.get('/', asyncHandler(cartController.getCart));
router.get('/suggestions', asyncHandler(cartController.getCartSuggestions));
router.post('/items', validate(addCartItemSchema), asyncHandler(cartController.addItem));
router.post(
  '/items/:itemId/save-for-later',
  validate(cartItemParamsSchema, 'params'),
  asyncHandler(cartController.saveForLater)
);
router.post(
  '/saved/:savedItemId/move-to-cart',
  validate(savedItemParamsSchema, 'params'),
  asyncHandler(cartController.moveSavedToCart)
);
router.delete(
  '/saved/:savedItemId',
  validate(savedItemParamsSchema, 'params'),
  asyncHandler(cartController.removeSavedItem)
);
router.patch(
  '/items/:itemId',
  validate(cartItemParamsSchema, 'params'),
  validate(updateCartItemSchema),
  asyncHandler(cartController.updateItem)
);
router.delete(
  '/items/:itemId',
  validate(cartItemParamsSchema, 'params'),
  asyncHandler(cartController.removeItem)
);
router.delete('/', asyncHandler(cartController.clearCart));

module.exports = router;
