const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost/stokana_test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.RESEND_FROM = 'STOKANA <no-reply@example.test>';

const { sendEmail } = require(path.resolve(__dirname, '../src/services/verificationDelivery.js'));

test('sends email through Resend over HTTPS', async (t) => {
  let request;
  t.mock.method(global, 'fetch', async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ id: 'email-id' }), { status: 200 });
  });

  await sendEmail('buyer@example.test', 'Reset your password', 'Open your reset link.');

  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer test-resend-api-key');
  assert.deepEqual(JSON.parse(request.options.body), {
    from: 'STOKANA <no-reply@example.test>',
    to: 'buyer@example.test',
    subject: 'Reset your password',
    text: 'Open your reset link.'
  });
});

test('reports Resend HTTP failures without exposing the API key', async (t) => {
  t.mock.method(global, 'fetch', async () => new Response('', { status: 422 }));

  await assert.rejects(
    sendEmail('buyer@example.test', 'Reset your password', 'Open your reset link.'),
    (error) => {
      assert.match(error.message, /Resend email delivery failed \(HTTP 422\)/);
      assert.doesNotMatch(error.message, /test-resend-api-key/);
      return true;
    }
  );
});
