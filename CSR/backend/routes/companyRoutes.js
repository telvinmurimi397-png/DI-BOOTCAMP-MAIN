const express = require('express');
const { getDashboardSummary } = require('../controllers/companyController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', authenticate, getDashboardSummary);

module.exports = router;
