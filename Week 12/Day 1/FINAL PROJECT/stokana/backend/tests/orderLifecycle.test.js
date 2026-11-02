const test = require('node:test');
const assert = require('node:assert/strict');
const {
  orderAdjustmentRequestSchema,
  orderRequestParamsSchema,
  orderRequestsQuerySchema,
  reviewOrderRequestSchema
} = require('../src/validators/orderValidators');
const {
  paymentReconciliationQuerySchema
} = require('../src/validators/adminValidators');
const {
  cartItemParamsSchema,
  savedItemParamsSchema
} = require('../src/validators/cartValidators');

test('cancellation and return requests validate their distinct payloads', () => {
  assert.equal(orderAdjustmentRequestSchema.safeParse({
    requestType: 'cancellation',
    reason: 'I placed this order by mistake.'
  }).success, true);
  assert.equal(orderAdjustmentRequestSchema.safeParse({
    requestType: 'return_refund',
    orderItemId: 12,
    quantity: 2,
    reason: 'The delivered item arrived damaged.'
  }).success, true);
  assert.equal(orderAdjustmentRequestSchema.safeParse({
    requestType: 'return_refund',
    quantity: 1,
    reason: 'The item is not what I ordered.'
  }).success, false);
});

test('refund processing requires an external payment reference', () => {
  assert.equal(reviewOrderRequestSchema.safeParse({ action: 'approve' }).success, true);
  assert.equal(reviewOrderRequestSchema.safeParse({ action: 'refund' }).success, false);
  assert.equal(reviewOrderRequestSchema.safeParse({
    action: 'refund',
    refundReference: 'MPESA-REF-123'
  }).success, true);
  assert.equal(reviewOrderRequestSchema.safeParse({
    action: 'refund',
    refundReference: 'MPESA-REF-123',
    refundAmount: '125.50'
  }).success, true);
  assert.equal(reviewOrderRequestSchema.safeParse({
    action: 'refund',
    refundReference: 'MPESA-REF-123',
    refundAmount: '-1'
  }).success, false);
});

test('order request and saved cart identifiers are positive integers', () => {
  assert.equal(orderRequestParamsSchema.safeParse({ requestId: '4' }).success, true);
  assert.equal(orderRequestsQuerySchema.safeParse({ status: 'pending', limit: '50' }).success, true);
  assert.equal(cartItemParamsSchema.safeParse({ itemId: '4' }).success, true);
  assert.equal(savedItemParamsSchema.safeParse({ savedItemId: '-1' }).success, false);
});

test('payment reconciliation supports paged M-Pesa status filters', () => {
  assert.deepEqual(
    paymentReconciliationQuerySchema.parse({ status: 'failed', page: '2', limit: '50' }),
    { status: 'failed', page: 2, limit: 50 }
  );
  assert.equal(paymentReconciliationQuerySchema.safeParse({ status: 'refunded' }).success, false);
  assert.equal(paymentReconciliationQuerySchema.safeParse({ limit: '100' }).success, false);
});
