const express = require('express');
const { createSupportTicket } = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, createSupportTicket);

module.exports = router;
