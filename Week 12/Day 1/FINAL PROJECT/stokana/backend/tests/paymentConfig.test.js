const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const configPath = path.join(__dirname, '../src/config/env.js');
const baseEnvironment = {
  ...process.env,
  DATABASE_URL: 'postgres://test:test@localhost/stokana_test',
  SESSION_SECRET: 'test-session-secret-with-sufficient-length'
};

function loadConfig(environment) {
  return spawnSync(process.execPath, ['-e', `process.stdout.write(require(${JSON.stringify(configPath)}).paymentProvider)`], {
    encoding: 'utf8',
    env: { ...baseEnvironment, ...environment }
  });
}

test('M-PESA is the default payment provider', () => {
  const result = loadConfig({ NODE_ENV: 'test', PAYMENT_PROVIDER: '' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'mpesa');
});

test('simulated payments are rejected in production', () => {
  const result = loadConfig({
    NODE_ENV: 'production',
    PAYMENT_PROVIDER: 'simulated',
    TOTP_ENCRYPTION_KEY: 'test-totp-encryption-key-with-sufficient-length',
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '587',
    SMTP_USER: 'test',
    SMTP_PASSWORD: 'test',
    SMTP_FROM: 'test@example.test'
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /only allowed outside production/);
});

test('production can start without optional Africa’s Talking credentials', () => {
  const result = spawnSync(process.execPath, [
    '-e',
    `const env = require(${JSON.stringify(configPath)}); process.stdout.write(String(env.africaTalking.username === '' && env.africaTalking.apiKey === ''))`
  ], {
    encoding: 'utf8',
    env: {
      ...baseEnvironment,
      NODE_ENV: 'production',
      PAYMENT_PROVIDER: 'mpesa',
      TOTP_ENCRYPTION_KEY: 'test-totp-encryption-key-with-sufficient-length',
      SMTP_HOST: 'smtp.example.test',
      SMTP_PORT: '587',
      SMTP_USER: 'test',
      SMTP_PASSWORD: 'test',
      SMTP_FROM: 'test@example.test',
      AFRICASTALKING_USERNAME: '',
      AFRICASTALKING_API_KEY: ''
    }
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'true');
});

test('card is not an accepted payment provider', () => {
  const result = loadConfig({ NODE_ENV: 'test', PAYMENT_PROVIDER: 'card' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PAYMENT_PROVIDER must be/);
});
