const express = require('express');
const cartController = require('../controllers/cartController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireBuyer } = require('../middleware/auth');
const { addCartItemSchema, updateCartItemSchema, cartItemParamsSchema } = require('../validators/cartValidators');

const router = express.Router();

router.use(requireBuyer);

router.get('/', asyncHandler(cartController.getCart));
router.get('/suggestions', asyncHandler(cartController.getCartSuggestions));
router.post('/items', validate(addCartItemSchema), asyncHandler(cartController.addItem));
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
