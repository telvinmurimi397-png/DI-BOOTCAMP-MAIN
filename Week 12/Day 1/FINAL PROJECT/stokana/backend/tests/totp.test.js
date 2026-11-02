const test = require('node:test');
const assert = require('node:assert/strict');
const {
  generateSecret,
  currentCode,
  verifyCode,
  encryptSecret,
  decryptSecret,
  provisioningUri
} = require('../src/utils/totp');

test('authenticator codes verify only within their short time window', () => {
  const secret = generateSecret();
  const now = 1_800_000_000_000;
  const code = currentCode(secret, now);

  assert.match(code, /^\d{6}$/);
  assert.equal(verifyCode(secret, code, now), true);
  const incorrect = String((Number(code) + 1) % 1_000_000).padStart(6, '0');
  assert.equal(verifyCode(secret, incorrect, now), false);
  assert.equal(verifyCode(secret, code, now + 120_000), false);
});

test('authenticator secrets are encrypted at rest and decrypt for verification', () => {
  const secret = generateSecret();
  const encrypted = encryptSecret(secret);

  assert.notEqual(encrypted, secret);
  assert.equal(decryptSecret(encrypted), secret);
  assert.match(provisioningUri(secret, 'buyer@example.test'), /^otpauth:\/\/totp\//);
});
