const { createHmac, timingSafeEqual } = require('crypto');
const db = require('../config/db');
const env = require('../config/env');

function createToken(userId) {
  const subject = String(userId);
  const signature = createHmac('sha256', env.sessionSecret).update(subject).digest('hex');
  return `${subject}.${signature}`;
}

function userIdFromToken(token) {
  const [subject, signature, extra] = String(token || '').split('.');
  if (extra || !/^[1-9]\d*$/.test(subject || '') || !/^[a-f\d]{64}$/i.test(signature || '')) {
    return null;
  }
  const expected = createHmac('sha256', env.sessionSecret).update(subject).digest('hex');
  if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) return null;
  const userId = Number(subject);
  return Number.isSafeInteger(userId) ? userId : null;
}

async function unsubscribe(token) {
  const userId = userIdFromToken(token);
  if (!userId) return false;
  const result = await db.query(
    'UPDATE users SET marketing_email_consent = FALSE WHERE id = $1 RETURNING id',
    [userId]
  );
  return result.rowCount > 0;
}

module.exports = { createToken, userIdFromToken, unsubscribe };
