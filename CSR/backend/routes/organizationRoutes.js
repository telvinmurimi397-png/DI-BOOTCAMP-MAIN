const express = require('express');
const { getDashboardSummary } = require('../controllers/organizationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', authenticate, getDashboardSummary);

module.exports = router;
