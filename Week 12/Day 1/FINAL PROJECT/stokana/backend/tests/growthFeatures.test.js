const test = require('node:test');
const assert = require('node:assert/strict');
const { createCampaignSchema } = require('../src/validators/marketingValidators');
const { createPromotionSchema } = require('../src/validators/promotionValidators');
const { createToken, userIdFromToken } = require('../src/services/marketingUnsubscribeService');
const { activePriceExpression } = require('../src/services/promotionService');

test('campaign input rejects header newlines and enforces bounded text fields', () => {
  assert.equal(createCampaignSchema.safeParse({
    title: 'Weekend sale',
    subject: 'Offers this weekend',
    body: 'Browse selected products at a discount.'
  }).success, true);
  assert.equal(createCampaignSchema.safeParse({
    title: 'Weekend sale',
    subject: 'Offers\r\nBcc: attacker@example.com',
    body: 'Browse selected products at a discount.'
  }).success, false);
});

test('unsubscribe tokens only validate for their original user and signature', () => {
  const token = createToken(42);
  assert.equal(userIdFromToken(token), 42);
  const tampered = `${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`;
  assert.equal(userIdFromToken(tampered), null);
  assert.equal(userIdFromToken('42.invalid'), null);
});

test('flash-sale pricing expression chooses the lowest effective active price', () => {
  const expression = activePriceExpression('p', 'p.price');
  assert.match(expression, /promo\.starts_at <= now\(\)/);
  assert.match(expression, /ORDER BY CASE promo\.discount_type/);
  assert.match(expression, /END ASC/);
});

test('promotion payloads keep coupon and flash-sale fields mutually exclusive', () => {
  const common = { discountType: 'percent', discountValue: 15 };
  assert.equal(createPromotionSchema.safeParse({
    ...common,
    kind: 'flash_sale',
    productId: 12
  }).success, true);
  assert.equal(createPromotionSchema.safeParse({
    ...common,
    kind: 'flash_sale',
    productId: 12,
    code: 'SALE15'
  }).success, false);
  assert.equal(createPromotionSchema.safeParse({
    ...common,
    kind: 'coupon',
    code: 'SALE15',
    productId: 12
  }).success, false);
});
