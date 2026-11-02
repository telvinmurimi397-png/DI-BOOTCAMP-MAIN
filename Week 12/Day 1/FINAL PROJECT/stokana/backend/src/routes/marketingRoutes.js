const express = require('express');
const marketingController = require('../controllers/marketingController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.get('/unsubscribe', asyncHandler(marketingController.unsubscribePage));
router.post('/unsubscribe', asyncHandler(marketingController.unsubscribe));

module.exports = router;
