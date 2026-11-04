const crypto = require('crypto');
const db = require('../config/db');
const env = require('../config/env');
const userService = require('./userService');
const delivery = require('./verificationDelivery');
const { ApiError, badRequest, notFound } = require('../utils/errors');

class VerificationDeliveryError extends ApiError {
  constructor(channel, cause) {
    super(503, 'We could not send your verification code. Please try again later.', {
      code: 'VERIFICATION_DELIVERY_FAILED'
    });
    this.name = 'VerificationDeliveryError';
    this.channel = channel;
    this.cause = cause;
  }
}

function hashCode(code) {
  return crypto.createHmac('sha256', env.sessionSecret).update(code).digest('hex');
}

function createCode() {
  return String(crypto.randomInt(100000, 1_000_000));
}

function formatPhone(phone) {
  const compact = phone.replace(/[ ()-]/g, '');
  if (/^0\d{9}$/.test(compact)) return `+254${compact.slice(1)}`;
  if (/^254\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
}

async function send(user, channel) {
  if (channel === 'phone' && !user.phone) {
    throw badRequest('Add a phone number to your profile before verifying it.');
  }
  const recent = await db.query(
    `SELECT COUNT(*)::int AS count,
            COALESCE(BOOL_OR(created_at > now() - interval '1 minute'), FALSE) AS "tooSoon"
     FROM user_verifications
     WHERE user_id = $1 AND channel = $2 AND used_at IS NULL
       AND created_at > now() - interval '1 hour'`,
    [user.id, channel]
  );
  if (recent.rows[0].tooSoon || recent.rows[0].count >= 5) {
    throw badRequest('Please wait before requesting another verification code.');
  }
  const code = createCode();
  await db.query(
    `UPDATE user_verifications SET used_at = now()
     WHERE user_id = $1 AND channel = $2 AND used_at IS NULL`,
    [user.id, channel]
  );
  await db.query(
    `INSERT INTO user_verifications (user_id, channel, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + interval '10 minutes')`,
    [user.id, channel, hashCode(code)]
  );
  try {
    if (channel === 'email') {
      await delivery.sendEmail(
        user.email,
        'Your Stokana verification code',
        `Your Stokana verification code is ${code}. It expires in 10 minutes.`
      );
    } else {
      await delivery.sendSms(
        formatPhone(user.phone),
        `Your Stokana verification code is ${code}. It expires in 10 minutes.`
      );
    }
  } catch (error) {
    await db.query(
      `UPDATE user_verifications SET used_at = now()
       WHERE user_id = $1 AND channel = $2 AND token_hash = $3 AND used_at IS NULL`,
      [user.id, channel, hashCode(code)]
    );
    console.error('[verification] Delivery failed', { channel, error });
    throw new VerificationDeliveryError(channel, error);
  }
  return !env.isProduction ? { devCode: code } : {};
}

async function verify(userId, channel, code) {
  const user = await userService.findById(userId);
  if (!user) throw notFound('Account not found.');
  const verification = await db.withTransaction(async (client) => {
    const updated = await client.query(
      `UPDATE user_verifications SET used_at = now()
       WHERE id = (
         SELECT id FROM user_verifications
         WHERE user_id = $1 AND channel = $2 AND token_hash = $3
           AND used_at IS NULL AND expires_at > now() AND attempts < 5
         ORDER BY created_at DESC LIMIT 1
       )
       AND used_at IS NULL
       RETURNING id`,
      [userId, channel, hashCode(code)]
    );
    if (updated.rowCount) {
      const column = channel === 'email' ? 'email_verified' : 'phone_verified';
      await client.query(`UPDATE users SET ${column} = TRUE WHERE id = $1`, [userId]);
    }
    return updated.rowCount;
  });
  if (!verification) {
    await db.query(
      `UPDATE user_verifications SET attempts = attempts + 1
       WHERE user_id = $1 AND channel = $2 AND used_at IS NULL AND expires_at > now()`,
      [userId, channel]
    );
    throw badRequest('That verification code is invalid or expired.');
  }
  return userService.findById(userId);
}

module.exports = { send, verify, VerificationDeliveryError };
