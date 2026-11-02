const test = require('node:test');
const assert = require('node:assert/strict');
const {
  startConversationSchema,
  sendMessageSchema,
  reportConversationSchema,
  messageReportsQuerySchema,
  reviewMessageReportSchema
} = require('../src/validators/messageValidators');

test('conversation requests accept product and order context independently', () => {
  assert.equal(
    startConversationSchema.parse({ sellerId: '4', productId: '21' }).productId,
    21
  );
  assert.equal(
    startConversationSchema.parse({ sellerId: 4, orderNumber: 'STK-102' }).orderNumber,
    'STK-102'
  );
  assert.equal(
    startConversationSchema.safeParse({ sellerId: 4, productId: 21, orderNumber: 'STK-102' }).success,
    false
  );
});

test('message body may be empty for an image-only attachment', () => {
  assert.equal(sendMessageSchema.parse({}).body, '');
  assert.equal(sendMessageSchema.safeParse({ body: 'x'.repeat(4001) }).success, false);
});

test('reports require a meaningful reason and admin status is constrained', () => {
  assert.equal(reportConversationSchema.safeParse({ reason: 'Too short' }).success, false);
  assert.equal(reportConversationSchema.safeParse({ reason: 'This message is abusive.' }).success, true);
  assert.equal(messageReportsQuerySchema.safeParse({ status: 'pending', page: '1' }).success, true);
  assert.equal(reviewMessageReportSchema.safeParse({ status: 'dismissed' }).success, true);
  assert.equal(reviewMessageReportSchema.safeParse({ status: 'pending' }).success, false);
});
