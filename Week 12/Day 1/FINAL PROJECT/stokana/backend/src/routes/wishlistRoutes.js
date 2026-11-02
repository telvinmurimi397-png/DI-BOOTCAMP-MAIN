const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireBuyer } = require('../middleware/auth');
const {
  wishlistProductSchema,
  wishlistProductParamsSchema
} = require('../validators/wishlistValidators');

const router = express.Router();

router.use(requireBuyer);
router.get('/', asyncHandler(wishlistController.list));
router.get('/ids', asyncHandler(wishlistController.listIds));
router.post('/', validate(wishlistProductSchema), asyncHandler(wishlistController.add));
router.delete(
  '/:productId',
  validate(wishlistProductParamsSchema, 'params'),
  asyncHandler(wishlistController.remove)
);

module.exports = router;
