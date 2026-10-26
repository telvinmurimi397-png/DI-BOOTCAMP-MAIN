const express = require('express');
const reviewController = require('../controllers/reviewController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireBuyer } = require('../middleware/auth');
const { reviewSchema, buyerOrdersQuerySchema } = require('../validators/orderValidators');

const router = express.Router();

router.get(
  '/mine',
  requireBuyer,
  validate(buyerOrdersQuerySchema, 'query'),
  asyncHandler(reviewController.listMine)
);
router.post('/', requireBuyer, validate(reviewSchema), asyncHandler(reviewController.createReview));

module.exports = router;
