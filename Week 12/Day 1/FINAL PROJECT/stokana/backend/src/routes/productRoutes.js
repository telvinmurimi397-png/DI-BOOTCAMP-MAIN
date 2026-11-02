const express = require('express');
const catalogueController = require('../controllers/catalogueController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const {
  productsQuerySchema,
  slugParamsSchema,
  productReviewsQuerySchema,
  recentlyViewedQuerySchema
} = require('../validators/catalogueValidators');

const router = express.Router();

router.get('/', validate(productsQuerySchema, 'query'), asyncHandler(catalogueController.listProducts));
router.get('/recommendations', asyncHandler(catalogueController.recommendations));
router.get(
  '/recently-viewed',
  validate(recentlyViewedQuerySchema, 'query'),
  asyncHandler(catalogueController.recentlyViewed)
);
router.get(
  '/:slug/reviews',
  validate(slugParamsSchema, 'params'),
  validate(productReviewsQuerySchema, 'query'),
  asyncHandler(catalogueController.listProductReviews)
);
router.get('/:slug', validate(slugParamsSchema, 'params'), asyncHandler(catalogueController.getProduct));

module.exports = router;
