const db = require('../config/db');

function referralCodeFor(userId) {
  return `STK${Number(userId).toString(36).toUpperCase()}`;
}

async function ensureReferralCode(userId) {
  await db.query(
    `UPDATE users SET referral_code = $2
     WHERE id = $1 AND referral_code IS NULL`,
    [userId, referralCodeFor(userId)]
  );
}

async function getSummary(userId) {
  await ensureReferralCode(userId);
  const [userResult, balanceResult, recentResult, referralsResult] = await Promise.all([
    db.query('SELECT referral_code AS "referralCode" FROM users WHERE id = $1', [userId]),
    db.query(
      `SELECT COALESCE(SUM(points_delta), 0)::int AS points,
              COALESCE(SUM(credit_delta), 0) AS credit
       FROM customer_reward_ledger WHERE user_id = $1`,
      [userId]
    ),
    db.query(
      `SELECT entry_type AS "entryType", points_delta AS "pointsDelta",
              credit_delta AS "creditDelta", note, created_at AS "createdAt"
       FROM customer_reward_ledger WHERE user_id = $1
       ORDER BY created_at DESC, id DESC LIMIT 10`,
      [userId]
    ),
    db.query('SELECT COUNT(*)::int AS count FROM referral_rewards WHERE referrer_id = $1 AND reversed_at IS NULL', [userId])
  ]);
  return {
    referralCode: userResult.rows[0]?.referralCode,
    points: balanceResult.rows[0].points,
    referralCredit: balanceResult.rows[0].credit,
    successfulReferrals: referralsResult.rows[0].count,
    recentActivity: recentResult.rows
  };
}

async function recordPaidOrderRewards(client, orderId) {
  const { rows } = await client.query(
    `SELECT o.id, o.buyer_id AS "buyerId", o.total, u.referred_by AS "referrerId"
     FROM orders o JOIN users u ON u.id = o.buyer_id
     WHERE o.id = $1 AND o.payment_status = 'paid'
     FOR UPDATE OF o, u`,
    [orderId]
  );
  const order = rows[0];
  if (!order) return;

  const points = Math.floor(Number(order.total) / 100);
  if (points > 0) {
    await client.query(
      `INSERT INTO customer_reward_ledger
         (user_id, entry_type, points_delta, order_id, note)
       VALUES ($1, 'loyalty_earned', $2, $3, 'Earned on a paid order')
       ON CONFLICT DO NOTHING`,
      [order.buyerId, points, orderId]
    );
  }

  if (order.referrerId && Number(order.referrerId) !== Number(order.buyerId)) {
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [order.referrerId]);
    const priorOrder = await client.query(
      `SELECT 1 FROM orders
       WHERE buyer_id = $1 AND id <> $2 AND payment_status = 'paid'
       LIMIT 1`,
      [order.buyerId, orderId]
    );
    if (!priorOrder.rowCount) {
      const awarded = await client.query(
        `INSERT INTO referral_rewards (referrer_id, referred_user_id, first_order_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (referred_user_id) DO UPDATE
           SET first_order_id = EXCLUDED.first_order_id,
               reversed_at = NULL,
               awarded_at = now()
           WHERE referral_rewards.reversed_at IS NOT NULL
         RETURNING id`,
        [order.referrerId, order.buyerId, orderId]
      );
      if (awarded.rowCount) {
        await client.query(
          `INSERT INTO customer_reward_ledger
             (user_id, entry_type, credit_delta, order_id, related_user_id, note)
           VALUES
             ($1, 'referral_credit', 200, $3, $2, 'Referral first-order reward'),
             ($2, 'referral_credit', 200, $3, $1, 'New-buyer referral reward')
           ON CONFLICT DO NOTHING`,
          [order.referrerId, order.buyerId, orderId]
        );
      }
    }
  }

  await client.query(
    `UPDATE promotion_redemptions SET status = 'applied'
     WHERE order_id = $1 AND status = 'reserved'`,
    [orderId]
  );
}

async function releaseUnpaidOrderRewards(client, orderId) {
  const { rows } = await client.query(
    `SELECT user_id AS "userId", entry_type AS "entryType",
            points_delta AS "pointsDelta", credit_delta AS "creditDelta"
     FROM customer_reward_ledger
     WHERE order_id = $1 AND entry_type IN ('loyalty_redeemed', 'credit_redeemed')`,
    [orderId]
  );
  for (const entry of rows) {
    if (entry.entryType === 'loyalty_redeemed') {
      await client.query(
        `INSERT INTO customer_reward_ledger (user_id, entry_type, points_delta, order_id, note)
         VALUES ($1, 'loyalty_reversal', $2, $3, 'Restored after unpaid order cancellation')
         ON CONFLICT DO NOTHING`,
        [entry.userId, -entry.pointsDelta, orderId]
      );
    } else {
      await client.query(
        `INSERT INTO customer_reward_ledger (user_id, entry_type, credit_delta, order_id, note)
         VALUES ($1, 'credit_reversal', $2, $3, 'Restored after unpaid order cancellation')
         ON CONFLICT DO NOTHING`,
        [entry.userId, -Number(entry.creditDelta), orderId]
      );
    }
  }
  await client.query(
    `UPDATE promotion_redemptions SET status = 'released'
     WHERE order_id = $1 AND status = 'reserved'`,
    [orderId]
  );
}

async function reverseRefundedOrderRewards(client, orderId) {
  const { rows } = await client.query(
    `SELECT user_id AS "userId",
            -COALESCE(SUM(points_delta) FILTER (
              WHERE entry_type IN ('loyalty_earned', 'loyalty_redeemed')
            ), 0)::int AS "pointsDelta",
            -COALESCE(SUM(credit_delta) FILTER (
              WHERE entry_type IN ('referral_credit', 'credit_redeemed')
            ), 0) AS "creditDelta"
     FROM customer_reward_ledger
     WHERE order_id = $1
     GROUP BY user_id`,
    [orderId]
  );
  for (const entry of rows) {
    if (entry.pointsDelta) {
      await client.query(
        `INSERT INTO customer_reward_ledger
           (user_id, entry_type, points_delta, order_id, note)
         VALUES ($1, 'loyalty_reversal', $2, $3, 'Reversed after full order refund')
         ON CONFLICT DO NOTHING`,
        [entry.userId, entry.pointsDelta, orderId]
      );
    }
    if (Number(entry.creditDelta)) {
      await client.query(
        `INSERT INTO customer_reward_ledger
           (user_id, entry_type, credit_delta, order_id, note)
         VALUES ($1, 'credit_reversal', $2, $3, 'Reversed after full order refund')
         ON CONFLICT DO NOTHING`,
        [entry.userId, entry.creditDelta, orderId]
      );
    }
  }
  await client.query(
    `UPDATE referral_rewards SET reversed_at = now()
     WHERE first_order_id = $1 AND reversed_at IS NULL`,
    [orderId]
  );
  await client.query(
    `UPDATE promotion_redemptions SET status = 'released'
     WHERE order_id = $1 AND status <> 'released'`,
    [orderId]
  );
}

module.exports = {
  ensureReferralCode,
  getSummary,
  recordPaidOrderRewards,
  releaseUnpaidOrderRewards,
  reverseRefundedOrderRewards
};
