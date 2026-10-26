const reviewService = require('../services/reviewService');

async function createReview(req, res) {
  const review = await reviewService.createReview(req.user.id, req.body);
  res.status(201).json({ message: 'Thank you for your review.', review });
}

async function listMine(req, res) {
  const result = await reviewService.getBuyerReviews(req.user.id, req.query.page, req.query.limit);
  res.json(result);
}

module.exports = { createReview, listMine };
