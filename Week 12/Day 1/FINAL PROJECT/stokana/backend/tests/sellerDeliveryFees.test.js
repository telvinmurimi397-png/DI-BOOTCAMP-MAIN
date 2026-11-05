const assert = require('node:assert/strict');
const test = require('node:test');
const { updateShopSchema } = require('../src/validators/sellerValidators');
const { calculateDeliveryFees } = require('../src/utils/deliveryFees');

test('seller delivery fees are charged once per shop, not once per item', () => {
  const result = calculateDeliveryFees([
    { sellerId: 3, shopName: 'First shop', shopDeliveryFee: '175.50' },
    { sellerId: 3, shopName: 'First shop', shopDeliveryFee: '175.50' },
    { sellerId: 8, shopName: 'Second shop', shopDeliveryFee: '90' }
  ], 20_000, 500_000);

  assert.equal(result.totalCents, 26_550);
  assert.deepEqual(result.deliveryFees.map((fee) => ({
    sellerId: fee.sellerId,
    shopName: fee.shopName,
    shippingFee: Number(fee.shippingFee)
  })), [
    { sellerId: 3, shopName: 'First shop', shippingFee: 175.5 },
    { sellerId: 8, shopName: 'Second shop', shippingFee: 90 }
  ]);
});

test('platform free-delivery threshold waives each shop fee', () => {
  const result = calculateDeliveryFees([
    { sellerId: 3, shopName: 'First shop', shopDeliveryFee: 175 },
    { sellerId: 8, shopName: 'Second shop', shopDeliveryFee: 90 }
  ], 500_000, 500_000);

  assert.equal(result.totalCents, 0);
  assert.deepEqual(result.deliveryFees.map((fee) => Number(fee.shippingFee)), [0, 0]);
});

test('seller shop accepts a zero delivery fee and rejects negative or over-precision fees', () => {
  assert.equal(updateShopSchema.safeParse({ deliveryFee: '0' }).success, true);
  assert.equal(updateShopSchema.safeParse({ deliveryFee: '-1' }).success, false);
  assert.equal(updateShopSchema.safeParse({ deliveryFee: '12.345' }).success, false);
});
