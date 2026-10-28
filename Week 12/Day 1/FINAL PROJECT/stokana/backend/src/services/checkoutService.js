const crypto = require('crypto');
const db = require('../config/db');
const env = require('../config/env');
const mpesaService = require('./mpesaService');
const settingsService = require('../services/settingsService');
const { generateOrderNumber } = require('../utils/slug');
const { toCents, fromCents } = require('../utils/money');
const { badRequest, conflict, notFound } = require('../utils/errors');

function paymentReference(orderNumber, provider = 'simulated') {
  const suffix = crypto.randomBytes(12).toString('hex').toUpperCase();
  return provider === 'mpesa'
    ? `MPESA-${orderNumber}-${suffix}`
    : `SIM-${orderNumber}-${suffix.slice(0, 6)}`;
}

async function placeOrder(buyer, shipping) {
  return db.withTransaction(async (client) => {
    const itemsResult = await client.query(
      `SELECT
         ci.id AS "cartItemId",
         ci.cart_id AS "cartId",
         ci.quantity,
         p.id AS "productId",
         p.name,
         p.price,
         p.stock,
         p.status AS "productStatus",
         p.seller_id AS "sellerId",
         u.is_active AS "sellerActive",
         sp.status AS "sellerStatus",
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
       JOIN categories c ON c.id = p.category_id
       JOIN users u ON u.id = p.seller_id
       LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE cart.buyer_id = $1
       ORDER BY p.seller_id ASC, p.id ASC
       FOR UPDATE OF p, ci`,
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
    let commissionCentsTotal = 0;
    const lines = items.map((item) => {
      const unitCents = toCents(item.price);
      const lineCents = unitCents * item.quantity;
      const commissionCents = Math.round(lineCents * commissionRate);
      subtotalCents += lineCents;
      commissionCentsTotal += commissionCents;
      return { ...item, unitCents, lineCents, commissionCents, earningsCents: lineCents - commissionCents };
    });

    const thresholdCents = toCents(settings.freeShippingThreshold);
    const shippingCents = subtotalCents >= thresholdCents ? 0 : toCents(settings.shippingFee);
    const totalCents = subtotalCents + shippingCents;
    if (env.paymentProvider === 'mpesa' && totalCents % 100 !== 0) {
      throw badRequest('M-PESA checkout totals must be whole Kenyan shillings. Adjust the cart and try again.');
    }
    const earningsCentsTotal = subtotalCents - commissionCentsTotal;

    const orderNumber = generateOrderNumber();
    const orderResult = await client.query(
      `INSERT INTO orders
         (order_number, buyer_id, status, payment_status, subtotal, shipping_fee, total,
          commission_total, seller_earnings_total, shipping_name, shipping_phone, shipping_email,
          shipping_county, shipping_town, shipping_address, notes)
       VALUES ($1, $2, 'pending_payment', 'unpaid', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, order_number AS "orderNumber", status, payment_status AS "paymentStatus",
                 subtotal, shipping_fee AS "shippingFee", total,
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
        fromCents(earningsCentsTotal),
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

    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items
           (order_id, seller_id, product_id, product_name, product_image_url, unit_price,
            quantity, line_total, commission_rate, commission_amount, seller_earnings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          order.id,
          line.sellerId,
          line.productId,
          line.name,
          line.imageUrl,
          fromCents(line.unitCents),
          line.quantity,
          fromCents(line.lineCents),
          commissionRate.toFixed(4),
          fromCents(line.commissionCents),
          fromCents(line.earningsCents)
        ]
      );

      const stockResult = await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
        [line.quantity, line.productId]
      );
      if (!stockResult.rowCount) {
        throw conflict(`${line.name} just sold out while you were checking out.`);
      }
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

    return {
      message: 'Order created. Complete payment to start fulfilment.',
      order: {
        ...order,
        itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
        currency: 'KES'
      },
      payment: {
        ...paymentResult.rows[0],
        ...(provider === 'simulated' ? { simulated: true } : {})
      }
    };
  });
}

async function cancelOrder(buyerId, orderNumber) {
  return db.withTransaction(async (client) => {
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
      `UPDATE products p
       SET stock = p.stock + oi.quantity
       FROM order_items oi
       WHERE oi.order_id = $1 AND p.id = oi.product_id`,
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

    return {
      message: 'Order cancelled and reserved stock released.',
      order: { ...order, status: 'cancelled' }
    };
  });
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

    const existing = await client.query(
      `SELECT id, provider, provider_ref AS "providerRef", amount, status, created_at AS "createdAt"
       FROM payments WHERE order_id = $1 AND status = 'pending'
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [order.id]
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
