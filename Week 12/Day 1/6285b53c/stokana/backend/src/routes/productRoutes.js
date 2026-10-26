const express = require('express');
const catalogueController = require('../controllers/catalogueController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const {
  productsQuerySchema,
  slugParamsSchema,
  productReviewsQuerySchema
} = require('../validators/catalogueValidators');

const router = express.Router();

router.get('/', validate(productsQuerySchema, 'query'), asyncHandler(catalogueController.listProducts));
router.get(
  '/:slug/reviews',
  validate(slugParamsSchema, 'params'),
  validate(productReviewsQuerySchema, 'query'),
  asyncHandler(catalogueController.listProductReviews)
);
router.get('/:slug', validate(slugParamsSchema, 'params'), asyncHandler(catalogueController.getProduct));

module.exports = router;
