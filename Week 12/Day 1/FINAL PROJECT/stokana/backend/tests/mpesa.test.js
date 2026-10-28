const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhone, timestamp } = require('../src/services/mpesaService');

test('normalizes Kenyan M-PESA phone number formats', () => {
  assert.equal(normalizePhone('0712 345 678'), '254712345678');
  assert.equal(normalizePhone('+254 112 345 678'), '254112345678');
  assert.equal(normalizePhone('712345678'), '254712345678');
});

test('rejects phone numbers outside supported Kenyan mobile formats', () => {
  assert.throws(() => normalizePhone('020 123 4567'), /valid Kenyan M-PESA number/);
  assert.throws(() => normalizePhone('123'), /valid Kenyan M-PESA number/);
});

test('creates the Daraja timestamp in East Africa Time', () => {
  assert.equal(timestamp(new Date('2026-01-02T03:04:05.000Z')), '20260102060405');
});
