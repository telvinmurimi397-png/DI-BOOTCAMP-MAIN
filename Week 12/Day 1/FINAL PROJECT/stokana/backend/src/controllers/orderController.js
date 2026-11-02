const checkoutService = require('../services/checkoutService');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const orderAdjustmentService = require('../services/orderAdjustmentService');
const env = require('../config/env');
const mpesaService = require('../services/mpesaService');
const { ApiError } = require('../utils/errors');

async function checkout(req, res) {
  if (env.paymentProvider === 'mpesa') {
    try {
      mpesaService.assertConfigured();
    } catch (error) {
      throw new ApiError(503, error.message);
    }
  }
  const result = await checkoutService.placeOrder(req.user, req.body);
  res.status(201).json(result);
}

async function listOrders(req, res) {
  const result = await orderService.getBuyerOrders(
    req.user.id,
    req.query.page,
    req.query.limit,
    req.query.status
  );
  res.json(result);
}

async function getOrder(req, res) {
  const result = await orderService.getBuyerOrder(req.user.id, req.params.orderNumber);
  res.json(result);
}

async function confirmDelivery(req, res) {
  const result = await orderService.confirmDelivery(
    req.user.id,
    req.params.orderNumber,
    req.params.shipmentId
  );
  res.json(result);
}

async function stats(req, res) {
  const data = await orderService.getBuyerStats(req.user.id);
  res.json(data);
}

async function cancelOrder(req, res) {
  const result = await checkoutService.cancelOrder(req.user.id, req.params.orderNumber);
  res.json(result);
}

async function requestAdjustment(req, res) {
  const request = await orderAdjustmentService.createRequest(
    req.user.id,
    req.params.orderNumber,
    req.body
  );
  res.status(201).json({ message: 'Your order request was submitted.', request });
}

async function retryPayment(req, res) {
  const result = await checkoutService.retryPayment(req.user.id, req.params.orderNumber);
  res.json(result);
}

async function simulatePayment(req, res) {
  if (env.paymentProvider !== 'simulated') {
    throw new ApiError(404, 'Simulated payments are disabled.');
  }
  const result = await paymentService.simulatePayment(
    req.user.id,
    req.params.orderNumber,
    req.body.outcome
  );
  res.json(result);
}

async function startMpesaPayment(req, res) {
  if (env.paymentProvider !== 'mpesa') {
    throw new ApiError(404, 'M-PESA payments are not enabled.');
  }
  const result = await paymentService.startMpesaPayment(
    req.user.id,
    req.params.orderNumber,
    req.body.phone
  );
  res.json(result);
}

module.exports = {
  checkout,
  listOrders,
  getOrder,
  confirmDelivery,
  stats,
  cancelOrder,
  requestAdjustment,
  retryPayment,
  simulatePayment,
  startMpesaPayment
};
