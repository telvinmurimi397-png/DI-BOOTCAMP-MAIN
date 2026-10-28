const express = require('express');
const env = require('../config/env');
const paymentService = require('../services/paymentService');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/method', (req, res) => {
  res.json({ provider: env.paymentProvider });
});

router.post(
  '/mpesa/callback',
  asyncHandler(async (req, res) => {
    await paymentService.handleMpesaCallback(req.query.token, req.body);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  })
);

module.exports = router;
