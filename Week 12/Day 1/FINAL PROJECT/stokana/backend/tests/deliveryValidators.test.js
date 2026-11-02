const test = require('node:test');
const assert = require('node:assert/strict');
const { shipmentUpdateSchema } = require('../src/validators/sellerValidators');

test('shipment updates accept HTTPS tracking links and optional pickup locations', () => {
  const result = shipmentUpdateSchema.safeParse({
    status: 'dispatched',
    carrier: 'Courier',
    trackingNumber: 'TRK-1234',
    trackingUrl: 'https://courier.example/track/TRK-1234',
    pickupLocationId: '4'
  });

  assert.equal(result.success, true);
  assert.equal(result.data.pickupLocationId, 4);
});

test('shipment updates reject non-HTTPS tracking links', () => {
  const result = shipmentUpdateSchema.safeParse({
    status: 'in_transit',
    trackingUrl: 'http://courier.example/track/TRK-1234'
  });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.message === 'Tracking links must use HTTPS.'));
});

test('dispatching a shipment requires a courier or tracking number', () => {
  const result = shipmentUpdateSchema.safeParse({ status: 'dispatched' });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) =>
    issue.message === 'Add a courier or tracking number when dispatching an order.'
  ));
});
