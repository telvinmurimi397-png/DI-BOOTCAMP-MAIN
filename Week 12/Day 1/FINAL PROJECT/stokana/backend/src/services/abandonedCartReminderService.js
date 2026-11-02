const db = require('../config/db');
const { sendEmail } = require('./verificationDelivery');
const unsubscribeService = require('./marketingUnsubscribeService');
const env = require('../config/env');

const REMINDER_DELAY_HOURS = 24;
const BATCH_SIZE = 25;

async function claimAbandonedCarts() {
  return db.withTransaction(async (client) => {
    const result = await client.query(
      `SELECT c.id, c.buyer_id AS "buyerId", u.email, c.reminder_claimed_at AS "claimedAt",
              (SELECT COUNT(*)::int FROM cart_items ci WHERE ci.cart_id = c.id) AS "itemCount"
       FROM carts c
       JOIN users u ON u.id = c.buyer_id
       WHERE c.updated_at < now() - ($1 * interval '1 hour')
         AND c.reminder_sent_at IS NULL
         AND (c.reminder_claimed_at IS NULL
           OR c.reminder_claimed_at < now() - interval '1 hour')
         AND u.is_active = TRUE
         AND u.email_verified = TRUE
         AND u.marketing_email_consent = TRUE
         AND EXISTS (SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id)
       ORDER BY c.updated_at
       LIMIT $2
       FOR UPDATE OF c SKIP LOCKED`,
      [REMINDER_DELAY_HOURS, BATCH_SIZE]
    );
    for (const cart of result.rows) {
      const updated = await client.query(
        `UPDATE carts SET reminder_claimed_at = now()
         WHERE id = $1 AND reminder_sent_at IS NULL
           AND (reminder_claimed_at IS NULL OR reminder_claimed_at < now() - interval '1 hour')
         RETURNING reminder_claimed_at AS "claimedAt"`,
        [cart.id]
      );
      cart.claimedAt = updated.rows[0]?.claimedAt;
    }
    return result.rows.filter((cart) => cart.claimedAt);
  });
}

async function sendAbandonedCartReminders() {
  const carts = await claimAbandonedCarts();
  for (const cart of carts) {
    const eligibility = await db.query(
      `SELECT u.email FROM carts c
       JOIN users u ON u.id = c.buyer_id
       WHERE c.id = $1 AND c.reminder_claimed_at = $2 AND c.reminder_sent_at IS NULL
         AND c.updated_at < now() - ($3 * interval '1 hour')
         AND u.is_active = TRUE AND u.email_verified = TRUE
         AND u.marketing_email_consent = TRUE
         AND EXISTS (SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id)`,
      [cart.id, cart.claimedAt, REMINDER_DELAY_HOURS]
    );
    if (!eligibility.rowCount) {
      await db.query(
        'UPDATE carts SET reminder_claimed_at = NULL WHERE id = $1 AND reminder_claimed_at = $2',
        [cart.id, cart.claimedAt]
      );
      continue;
    }
    const unsubscribeUrl = `${env.appUrl}/api/marketing/unsubscribe?token=${encodeURIComponent(
      unsubscribeService.createToken(cart.buyerId)
    )}`;
    try {
      await sendEmail(
        eligibility.rows[0].email,
        'Your STOKANA cart is waiting',
        `You have ${cart.itemCount} item(s) waiting in your cart. Continue shopping: ${env.appUrl}/cart\n\nYou received this reminder because you opted in to STOKANA marketing emails.\nUnsubscribe: ${unsubscribeUrl}`,
        {
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        }
      );
      await db.query(
        `UPDATE carts SET reminder_sent_at = now(), reminder_claimed_at = NULL
         WHERE id = $1 AND reminder_claimed_at = $2`,
        [cart.id, cart.claimedAt]
      );
    } catch (error) {
      console.error(`[marketing] cart reminder failed for buyer ${cart.buyerId}:`, error.message);
      await db.query(
        `UPDATE carts SET reminder_claimed_at = NULL
         WHERE id = $1 AND reminder_claimed_at = $2`,
        [cart.id, cart.claimedAt]
      );
    }
  }
}

function startAbandonedCartReminderWorker() {
  const run = () => sendAbandonedCartReminders().catch((error) => {
    console.error('[marketing] abandoned-cart reminder worker failed:', error);
  });
  const timer = setInterval(run, 15 * 60 * 1000);
  timer.unref();
  run();
  return timer;
}

module.exports = { sendAbandonedCartReminders, startAbandonedCartReminderWorker };
