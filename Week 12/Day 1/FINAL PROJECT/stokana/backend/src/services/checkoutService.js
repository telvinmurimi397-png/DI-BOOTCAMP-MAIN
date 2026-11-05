const crypto = require('crypto');
const db = require('../config/db');
const env = require('../config/env');
const mpesaService = require('./mpesaService');
const settingsService = require('../services/settingsService');
const { generateOrderNumber } = require('../utils/slug');
const { toCents, fromCents } = require('../utils/money');
const { calculateDeliveryFees } = require('../utils/deliveryFees');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { notifyOrder } = require('./orderNotificationService');
const promotionService = require('./promotionService');
const rewardService = require('./rewardService');

const ACTIVE_PRICE = promotionService.activePriceExpression('p', 'COALESCE(pv.price, p.price)');

function paymentReference(orderNumber, provider = 'mpesa') {
  const suffix = crypto.randomBytes(12).toString('hex').toUpperCase();
  return provider === 'mpesa'
    ? `MPESA-${orderNumber}-${suffix}`
    : `SIM-${orderNumber}-${suffix.slice(0, 6)}`;
}

async function placeOrder(buyer, shipping) {
  if (env.paymentProvider === 'mpesa') {
    try {
      mpesaService.normalizePhone(shipping.shippingPhone);
    } catch (error) {
      throw badRequest(error.message);
    }
  }

  const result = await db.withTransaction(async (client) => {
    const itemsResult = await client.query(
      `SELECT
         ci.id AS "cartItemId",
         ci.cart_id AS "cartId",
         ci.quantity,
         p.id AS "productId",
         p.name,
         ${ACTIVE_PRICE} AS price,
         COALESCE(pv.stock, p.stock) AS stock,
         pv.id AS "variantId",
         pv.sku AS "variantSku",
         pv.attributes AS "variantAttributes",
         EXISTS (SELECT 1 FROM product_variants options WHERE options.product_id = p.id) AS "hasVariants",
         p.status AS "productStatus",
         p.seller_id AS "sellerId",
         u.is_active AS "sellerActive",
         sp.status AS "sellerStatus",
         sp.shop_name AS "shopName",
         sp.delivery_fee AS "shopDeliveryFee",
         c.is_active AS "categoryActive",
         COALESCE((
           SELECT url FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
           LIMIT 1
         ), '/assets/placeholder.svg') AS "imageUrl"
       FROM cart_items ci
       JOIN carts cart ON cart.id = ci.cart_id
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_variants pv ON pv.product_id = ci.product_id AND pv.id = ci.variant_id
       JOIN categories c ON c.id = p.category_id
       JOIN users u ON u.id = p.seller_id
       LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE cart.buyer_id = $1
       ORDER BY p.seller_id ASC, p.id ASC
       FOR UPDATE OF cart, p, ci`,
      [buyer.id]
    );

    const items = itemsResult.rows;
    if (!items.length) throw badRequest('Your cart is empty.');

    for (const item of items) {
      if (item.productStatus !== 'approved' || !item.categoryActive) {
        throw conflict(`${item.name} is no longer available. Remove it from your cart to continue.`);
      }
      if (!item.sellerActive || item.sellerStatus !== 'approved') {
        throw conflict(`${item.name} is sold by a shop that is not currently available.`);
      }
      if (item.hasVariants && item.variantId == null) {
        throw conflict(`${item.name} requires a product option. Remove it and choose an option.`);
      }
      if (item.stock <= 0) {
        throw conflict(`${item.name} is sold out. Remove it from your cart to continue.`);
      }
      if (item.quantity > item.stock) {
        throw conflict(`Only ${item.stock} of ${item.name} remain in stock. Update your quantity.`);
      }
    }

    const settings = await settingsService.getSettings(client);
    const commissionRate = settings.commissionRate;

    let subtotalCents = 0;
    const lines = items.map((item) => {
      const unitCents = toCents(item.price);
      const lineCents = unitCents * item.quantity;
      subtotalCents += lineCents;
      return { ...item, unitCents, lineCents, commissionCents: 0, earningsCents: 0 };
    });
    const { deliveryFees, totalCents: shippingCents } = calculateDeliveryFees(
      lines,
      subtotalCents,
      toCents(settings.freeShippingThreshold)
    );

    const promotion = shipping.promotionCode
      ? await promotionService.findCoupon(client, buyer.id, shipping.promotionCode, lines, subtotalCents, { lock: true })
      : null;
    const couponDiscountCents = promotion?.discountCents || 0;
    if (promotion?.ownerId != null) {
      let discountLeft = couponDiscountCents;
      const eligible = lines.filter((line) => Number(line.sellerId) === Number(promotion.ownerId));
      for (let index = 0; index < eligible.length; index += 1) {
        const line = eligible[index];
        const share = index === eligible.length - 1
          ? discountLeft
          : Math.floor(couponDiscountCents * line.lineCents / promotion.eligibleCents);
        line.lineCents -= share;
        discountLeft -= share;
      }
    }

    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [buyer.id]);
    const rewardResult = await client.query(
      `SELECT COALESCE(SUM(points_delta), 0)::int AS points,
              COALESCE(SUM(credit_delta), 0) AS credit
       FROM customer_reward_ledger WHERE user_id = $1`,
      [buyer.id]
    );
    const requestedPoints = Number(shipping.loyaltyPoints || 0);
    const availablePoints = rewardResult.rows[0].points;
    const pointsCap = Math.floor(subtotalCents / 2);
    const pointsDiscountCents = Math.min(requestedPoints * 10, pointsCap);
    if (!Number.isInteger(requestedPoints) || requestedPoints < 0 || requestedPoints > availablePoints) {
      throw badRequest('You do not have enough loyalty points for that redemption.');
    }
    if (requestedPoints * 10 > pointsCap) {
      throw badRequest('Loyalty points can cover up to 50% of the merchandise subtotal.');
    }
    const beforeCreditCents = subtotalCents + shippingCents -
      couponDiscountCents - pointsDiscountCents;
    const availableCreditCents = toCents(rewardResult.rows[0].credit);
    const creditDiscountCents = shipping.useReferralCredit
      ? Math.min(availableCreditCents, Math.max(0, beforeCreditCents))
      : 0;

    let commissionCentsTotal = 0;
    for (const line of lines) {
      line.commissionCents = Math.round(line.lineCents * commissionRate);
      line.earningsCents = line.lineCents - line.commissionCents;
      commissionCentsTotal += line.commissionCents;
    }

    const totalCents = subtotalCents + shippingCents -
      couponDiscountCents - pointsDiscountCents - creditDiscountCents;
    if (totalCents <= 0) throw badRequest('The order total must be greater than zero after discounts.');
    if (env.paymentProvider === 'mpesa' && totalCents % 100 !== 0) {
      throw badRequest('M-PESA checkout totals must be whole Kenyan shillings. Adjust the cart and try again.');
    }
    const earningsCentsTotal = lines.reduce((sum, line) => sum + line.earningsCents, 0);
    const discountTotalCents = couponDiscountCents + pointsDiscountCents + creditDiscountCents;

    const orderNumber = generateOrderNumber();
    const orderResult = await client.query(
      `INSERT INTO orders
         (order_number, buyer_id, status, payment_status, subtotal, shipping_fee, total,
          commission_total, seller_earnings_total, discount_total, promotion_code,
          loyalty_points_redeemed, referral_credit_used, shipping_name, shipping_phone, shipping_email,
          shipping_county, shipping_town, shipping_address, notes)
       VALUES ($1, $2, 'pending_payment', 'unpaid', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id, order_number AS "orderNumber", status, payment_status AS "paymentStatus",
                 subtotal, shipping_fee AS "shippingFee", total,
                 discount_total AS "discountTotal", promotion_code AS "promotionCode",
                 commission_total AS "commissionTotal",
                 seller_earnings_total AS "sellerEarningsTotal",
                 created_at AS "createdAt"`,
      [
        orderNumber,
        buyer.id,
        fromCents(subtotalCents),
        fromCents(shippingCents),
        fromCents(totalCents),
        fromCents(commissionCentsTotal),
        fromCents(earningsCentsTotal + shippingCents),
        fromCents(discountTotalCents),
        promotion?.code || null,
        requestedPoints,
        fromCents(creditDiscountCents),
        shipping.shippingName,
        shipping.shippingPhone,
        buyer.email,
        shipping.shippingCounty,
        shipping.shippingTown,
        shipping.shippingAddress,
        shipping.notes || null
      ]
    );
    const order = orderResult.rows[0];

    for (const deliveryFee of deliveryFees) {
      await client.query(
        `INSERT INTO order_seller_delivery_fees (order_id, seller_id, delivery_fee)
         VALUES ($1, $2, $3)`,
        [order.id, deliveryFee.sellerId, deliveryFee.shippingFee]
      );
    }

    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items
           (order_id, seller_id, product_id, variant_id, product_name, product_image_url, unit_price,
            quantity, line_total, commission_rate, commission_amount, seller_earnings,
            variant_sku, variant_attributes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          order.id,
          line.sellerId,
          line.productId,
          line.variantId,
          line.name,
          line.imageUrl,
          fromCents(line.unitCents),
          line.quantity,
          fromCents(line.lineCents),
          commissionRate.toFixed(4),
          fromCents(line.commissionCents),
          fromCents(line.earningsCents),
          line.variantSku || null,
          line.variantAttributes || null
        ]
      );

      const stockResult = line.variantId == null
        ? await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
          [line.quantity, line.productId]
        )
        : await client.query(
          `UPDATE product_variants SET stock = stock - $1
           WHERE id = $2 AND product_id = $3 AND stock >= $1`,
          [line.quantity, line.variantId, line.productId]
        );
      if (!stockResult.rowCount) {
        throw conflict(`${line.name} just sold out while you were checking out.`);
      }

      if (line.variantId != null) {
        await client.query(
          `UPDATE products
           SET stock = (SELECT COALESCE(SUM(stock), 0)::int FROM product_variants WHERE product_id = $1)
           WHERE id = $1`,
          [line.productId]
        );
      }
    }

    if (promotion) {
      await client.query(
        `INSERT INTO promotion_redemptions
           (promotion_id, buyer_id, order_id, discount_amount, status)
         VALUES ($1, $2, $3, $4, 'reserved')`,
        [promotion.id, buyer.id, order.id, fromCents(couponDiscountCents)]
      );
    }
    if (requestedPoints > 0) {
      await client.query(
        `INSERT INTO customer_reward_ledger
           (user_id, entry_type, points_delta, order_id, note)
         VALUES ($1, 'loyalty_redeemed', $2, $3, 'Points reserved for checkout')`,
        [buyer.id, -requestedPoints, order.id]
      );
    }
    if (creditDiscountCents > 0) {
      await client.query(
        `INSERT INTO customer_reward_ledger
           (user_id, entry_type, credit_delta, order_id, note)
         VALUES ($1, 'credit_redeemed', $2, $3, 'Referral credit reserved for checkout')`,
        [buyer.id, fromCents(-creditDiscountCents), order.id]
      );
    }

    const provider = env.paymentProvider;
    const paymentRef = paymentReference(order.orderNumber, provider);
    const callbackToken = provider === 'mpesa' ? crypto.randomBytes(32).toString('hex') : null;
    const paymentResult = await client.query(
      `INSERT INTO payments (order_id, provider, provider_ref, amount, phone, status, raw_payload)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING id, provider, provider_ref AS "providerRef", amount, status, created_at AS "createdAt"`,
      [
        order.id,
        provider,
        paymentRef,
        fromCents(totalCents),
        shipping.shippingPhone,
        callbackToken ? { callbackToken, initiationStatus: 'not_started' } : null
      ]
    );

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [items[0].cartId]);
    await client.query(
      'UPDATE carts SET updated_at = now(), reminder_sent_at = NULL, reminder_claimed_at = NULL WHERE id = $1',
      [items[0].cartId]
    );

    return {
      message: 'Order created. Complete payment to start fulfilment.',
      order: {
        ...order,
        itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
        discountTotal: fromCents(discountTotalCents),
        currency: 'KES'
      },
      payment: {
        ...paymentResult.rows[0],
        ...(provider === 'simulated' ? { simulated: true } : {})
      }
    };
  });
  await notifyOrder(result.order.orderNumber, {
    subject: 'Your STOKANA order was received',
    message: 'Your order has been reserved. Complete payment to begin seller fulfilment.',
    audience: 'buyer'
  });
  return result;
}

async function cancelOrder(buyerId, orderNumber) {
  const result = await db.withTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus"
       FROM orders WHERE order_number = $1 AND buyer_id = $2
       FOR UPDATE`,
      [orderNumber, buyerId]
    );
    const order = result.rows[0];
    if (!order) throw notFound('Order not found.');

    if (order.status === 'cancelled') {
      return { message: 'This order is already cancelled.', order };
    }
    if (order.status !== 'pending_payment') {
      throw conflict('Only unpaid orders can be cancelled. Contact the seller or support instead.');
    }

    const activeMpesaPayment = await client.query(
      `SELECT raw_payload->>'initiationStatus' AS "initiationStatus"
       FROM payments
       WHERE order_id = $1 AND provider = 'mpesa' AND status = 'pending'
       ORDER BY created_at DESC, id DESC
       LIMIT 1 FOR UPDATE`,
      [order.id]
    );
    if (['requesting', 'initiated'].includes(activeMpesaPayment.rows[0]?.initiationStatus)) {
      throw conflict('An M-PESA request is still in progress. Wait for its result before cancelling.');
    }

    await client.query(
      `SELECT p.id
       FROM products p
       JOIN order_items oi ON oi.product_id = p.id
       WHERE oi.order_id = $1
       ORDER BY p.seller_id, p.id
       FOR UPDATE OF p`,
      [order.id]
    );
    await client.query(
      `UPDATE products p
       SET stock = p.stock + oi.quantity
       FROM order_items oi
       WHERE oi.order_id = $1 AND p.id = oi.product_id
         AND oi.variant_id IS NULL AND oi.variant_sku IS NULL`,
      [order.id]
    );
    await client.query(
      `UPDATE product_variants pv
       SET stock = pv.stock + oi.quantity
       FROM order_items oi
       WHERE oi.order_id = $1 AND (
         oi.variant_id = pv.id OR
         (oi.variant_id IS NULL AND oi.product_id = pv.product_id AND oi.variant_sku = pv.sku)
       )`,
      [order.id]
    );
    await client.query(
      `UPDATE products p
       SET stock = (SELECT COALESCE(SUM(pv.stock), 0)::int
                    FROM product_variants pv WHERE pv.product_id = p.id)
       WHERE EXISTS (
         SELECT 1 FROM order_items oi
         WHERE oi.order_id = $1 AND oi.product_id = p.id
           AND (oi.variant_id IS NOT NULL OR oi.variant_sku IS NOT NULL)
       )`,
      [order.id]
    );
    await client.query(
      `UPDATE payments SET status = 'failed', failure_reason = 'Order cancelled by buyer'
       WHERE order_id = $1 AND status = 'pending'`,
      [order.id]
    );
    await client.query(
      `UPDATE orders
       SET status = 'cancelled', cancelled_at = now(),
           payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE payment_status END
       WHERE id = $1`,
      [order.id]
    );
    await rewardService.releaseUnpaidOrderRewards(client, order.id);

    return {
      message: 'Order cancelled and reserved stock released.',
      order: { ...order, status: 'cancelled' }
    };
  });
  if (result.order.status === 'cancelled' && result.message !== 'This order is already cancelled.') {
    await notifyOrder(orderNumber, {
      subject: 'Your STOKANA order was cancelled',
      message: 'Your unpaid order was cancelled and its reserved stock was released.',
      audience: 'buyer'
    });
  }
  return result;
}

async function retryPayment(buyerId, orderNumber) {
  return db.withTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus", total, shipping_phone
       FROM orders WHERE order_number = $1 AND buyer_id = $2
       FOR UPDATE`,
      [orderNumber, buyerId]
    );
    const order = result.rows[0];
    if (!order) throw notFound('Order not found.');
    if (order.status === 'cancelled') throw conflict('This order was cancelled.');
    if (order.paymentStatus === 'paid') throw conflict('This order has already been paid.');
    if (env.paymentProvider === 'mpesa' && !Number.isSafeInteger(Number(order.total))) {
      throw badRequest('M-PESA checkout totals must be whole Kenyan shillings. Cancel this order and place a new one.');
    }

    await client.query(
      `UPDATE payments
       SET status = 'failed', failure_reason = 'Payment provider changed; start a new payment attempt.'
       WHERE order_id = $1 AND status = 'pending' AND provider <> $2`,
      [order.id, env.paymentProvider]
    );
    const existing = await client.query(
      `SELECT id, provider, provider_ref AS "providerRef", amount, status, created_at AS "createdAt"
       FROM payments WHERE order_id = $1 AND provider = $2 AND status = 'pending'
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [order.id, env.paymentProvider]
    );
    if (existing.rows[0]) {
      return {
        payment: {
          ...existing.rows[0],
          ...(existing.rows[0].provider === 'simulated' ? { simulated: true } : {})
        },
        orderNumber: order.orderNumber
      };
    }

    const provider = env.paymentProvider;
    const paymentRef = paymentReference(order.orderNumber, provider);
    const callbackToken = provider === 'mpesa' ? crypto.randomBytes(32).toString('hex') : null;
    const paymentResult = await client.query(
      `INSERT INTO payments (order_id, provider, provider_ref, amount, phone, status, raw_payload)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING id, provider, provider_ref AS "providerRef", amount, status, created_at AS "createdAt"`,
      [
        order.id,
        provider,
        paymentRef,
        order.total,
        order.shipping_phone,
        callbackToken ? { callbackToken, initiationStatus: 'not_started' } : null
      ]
    );
    await client.query("UPDATE orders SET payment_status = 'unpaid' WHERE id = $1", [order.id]);

    return {
      payment: {
        ...paymentResult.rows[0],
        ...(provider === 'simulated' ? { simulated: true } : {})
      },
      orderNumber: order.orderNumber
    };
  });
}

module.exports = { placeOrder, cancelOrder, retryPayment, paymentReference };
