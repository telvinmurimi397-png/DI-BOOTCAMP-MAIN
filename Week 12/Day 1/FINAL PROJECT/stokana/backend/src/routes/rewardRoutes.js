const express = require('express');
const rewardController = require('../controllers/rewardController');
const asyncHandler = require('../utils/asyncHandler');
const { requireBuyer } = require('../middleware/auth');

const router = express.Router();
router.use(requireBuyer);
router.get('/', asyncHandler(rewardController.summary));

module.exports = router;
