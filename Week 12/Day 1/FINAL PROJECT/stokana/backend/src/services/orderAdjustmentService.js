const db = require('../config/db');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { notifyOrder } = require('./orderNotificationService');
const rewardService = require('./rewardService');

const REQUEST_SELECT = `
  SELECT r.id, r.order_id AS "orderId", r.buyer_id AS "buyerId",
         r.order_item_id AS "orderItemId", r.request_type AS "requestType",
         r.reason, r.quantity, r.status, r.created_at AS "createdAt",
         o.order_number AS "orderNumber", o.total AS "orderTotal",
         o.shipping_fee AS "shippingFee",
         oi.product_name AS "productName", oi.unit_price AS "unitPrice",
         oi.seller_id AS "sellerId", buyer.full_name AS "buyerName",
         buyer.email AS "buyerEmail", sp.shop_name AS "shopName"
  FROM order_adjustment_requests r
  JOIN orders o ON o.id = r.order_id
  LEFT JOIN order_items oi ON oi.id = r.order_item_id
  JOIN users buyer ON buyer.id = r.buyer_id
  LEFT JOIN seller_profiles sp ON sp.user_id = oi.seller_id
`;

async function createRequest(buyerId, orderNumber, input) {
  const request = await db.withTransaction(async (client) => {
    const orderResult = await client.query(
      `SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus"
       FROM orders WHERE order_number = $1 AND buyer_id = $2 FOR UPDATE`,
      [orderNumber, buyerId]
    );
    const order = orderResult.rows[0];
    if (!order) throw notFound('Order not found.');
    if (order.paymentStatus !== 'paid') {
      throw conflict('Cancellation and return requests are available after payment is confirmed.');
    }

    if (input.requestType === 'cancellation') {
      if (!['paid', 'processing'].includes(order.status)) {
        throw conflict('A cancellation can only be requested before any seller dispatches the order.');
      }
      const shipments = await client.query(
        'SELECT id, status FROM shipments WHERE order_id = $1 FOR UPDATE',
        [order.id]
      );
      if (shipments.rows.some((shipment) => shipment.status !== 'pending')) {
        throw conflict('A cancellation request is no longer available after dispatch.');
      }
      const existing = await client.query(
        `SELECT 1 FROM order_adjustment_requests
         WHERE order_id = $1 AND request_type = 'cancellation' AND status IN ('pending', 'approved')`,
        [order.id]
      );
      if (existing.rowCount) throw conflict('A cancellation request is already being reviewed.');
      const result = await client.query(
        `INSERT INTO order_adjustment_requests
           (order_id, buyer_id, request_type, reason)
         VALUES ($1, $2, 'cancellation', $3)
         RETURNING id, request_type AS "requestType", reason, status, created_at AS "createdAt"`,
        [order.id, buyerId, input.reason]
      );
      return { ...result.rows[0], orderNumber: order.orderNumber };
    }

    const itemResult = await client.query(
      `SELECT oi.id, oi.quantity, oi.seller_id AS "sellerId",
              s.status AS "shipmentStatus", s.delivered_at AS "deliveredAt"
       FROM order_items oi
       JOIN shipments s ON s.order_id = oi.order_id AND s.seller_id = oi.seller_id
       WHERE oi.id = $1 AND oi.order_id = $2
       FOR UPDATE OF oi, s`,
      [input.orderItemId, order.id]
    );
    const item = itemResult.rows[0];
    if (!item) throw notFound('Order item not found.');
    if (item.shipmentStatus !== 'delivered' || !item.deliveredAt) {
      throw conflict('A return can be requested after the seller marks this item delivered.');
    }
    const deliveryAge = Date.now() - new Date(item.deliveredAt).getTime();
    if (deliveryAge > 7 * 24 * 60 * 60 * 1000) {
      throw conflict('The 7-day return window for this delivery has ended.');
    }
    if (input.quantity > item.quantity) {
      throw badRequest(`You can request a return for at most ${item.quantity} unit(s).`);
    }
    const activeQuantity = await client.query(
      `SELECT COALESCE(SUM(quantity), 0)::int AS quantity
       FROM order_adjustment_requests
       WHERE order_item_id = $1 AND status IN ('pending', 'approved', 'refunded')`,
      [input.orderItemId]
    );
    if (activeQuantity.rows[0].quantity + input.quantity > item.quantity) {
      throw conflict('A return request already covers some or all of these units.');
    }
    const result = await client.query(
      `INSERT INTO order_adjustment_requests
         (order_id, buyer_id, order_item_id, request_type, reason, quantity)
       VALUES ($1, $2, $3, 'return_refund', $4, $5)
       RETURNING id, order_item_id AS "orderItemId", request_type AS "requestType",
                 reason, quantity, status, created_at AS "createdAt"`,
      [order.id, buyerId, input.orderItemId, input.reason, input.quantity]
    );
    return { ...result.rows[0], orderNumber: order.orderNumber, sellerId: item.sellerId };
  });

  await notifyOrder(request.orderNumber, {
    subject: request.requestType === 'cancellation' ? 'Cancellation request received' : 'Return request received',
    message: `A buyer submitted a ${request.requestType === 'cancellation' ? 'cancellation' : 'return and refund'} request. Reason: ${request.reason}`,
    audience: 'all'
  });
  return request;
}

async function listRequests({ status = 'pending', page = 1, limit = 20 } = {}) {
  const params = [];
  const where = [];
  if (status !== 'all') {
    params.push(status);
    where.push(`r.status = $${params.length}`);
  }
  const offset = (page - 1) * limit;
  const count = await db.query(
    `SELECT COUNT(*)::int AS total FROM order_adjustment_requests r
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
    params
  );
  const list = await db.query(
    `${REQUEST_SELECT}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const total = count.rows[0].total;
  return {
    requests: list.rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function restoreOrderStock(client, orderId) {
  await client.query(
    `SELECT p.id FROM products p
     JOIN order_items oi ON oi.product_id = p.id
     WHERE oi.order_id = $1 ORDER BY p.id FOR UPDATE OF p`,
    [orderId]
  );
  await client.query(
    `UPDATE products p SET stock = p.stock + oi.quantity
     FROM order_items oi
     WHERE oi.order_id = $1 AND oi.product_id = p.id
       AND oi.variant_id IS NULL AND oi.variant_sku IS NULL`,
    [orderId]
  );
  await client.query(
    `UPDATE product_variants pv SET stock = pv.stock + oi.quantity
     FROM order_items oi
    WHERE oi.order_id = $1 AND (
      oi.variant_id = pv.id OR
      (oi.variant_id IS NULL AND oi.product_id = pv.product_id AND oi.variant_sku = pv.sku)
    )`,
    [orderId]
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
    [orderId]
  );
}

async function restoreReturnedItemStock(client, item, quantity) {
  if (!item.productId) return;
  const product = await client.query(
    'SELECT id FROM products WHERE id = $1 FOR UPDATE',
    [item.productId]
  );
  if (!product.rowCount) return;

  if (item.variantId || item.variantSku) {
    const variant = await client.query(
      `UPDATE product_variants pv
       SET stock = pv.stock + $1
       WHERE pv.product_id = $2
         AND (pv.id = $3 OR ($3::bigint IS NULL AND pv.sku = $4))
       RETURNING pv.id`,
      [quantity, item.productId, item.variantId, item.variantSku]
    );
    if (!variant.rowCount) return;
    await client.query(
      `UPDATE products p
       SET stock = (SELECT COALESCE(SUM(pv.stock), 0)::int
                    FROM product_variants pv WHERE pv.product_id = p.id)
       WHERE p.id = $1`,
      [item.productId]
    );
    return;
  }

  await client.query(
    'UPDATE products SET stock = stock + $1 WHERE id = $2',
    [quantity, item.productId]
  );
}

async function reviewRequest(adminId, requestId, { action, refundReference, refundAmount }) {
  const result = await db.withTransaction(async (client) => {
    const requestResult = await client.query(
      `${REQUEST_SELECT}
       WHERE r.id = $1
       FOR UPDATE OF r`,
      [requestId]
    );
    const request = requestResult.rows[0];
    if (!request) throw notFound('Order request not found.');
    if (action === 'approve' || action === 'reject') {
      if (request.status !== 'pending') throw conflict('Only pending requests can be reviewed.');
      const status = action === 'approve' ? 'approved' : 'rejected';
      const updated = await client.query(
        `UPDATE order_adjustment_requests
         SET status = $1, reviewed_by = $2, reviewed_at = now()
         WHERE id = $3
         RETURNING id, status`,
        [status, adminId, requestId]
      );
      return { ...request, ...updated.rows[0], refundAmount: null };
    }
    if (request.status !== 'approved') {
      throw conflict('Approve this request before recording its refund.');
    }

    const orderResult = await client.query(
      `SELECT id, total, shipping_fee AS "shippingFee",
              payment_status AS "paymentStatus", status
       FROM orders WHERE id = $1 FOR UPDATE`,
      [request.orderId]
    );
    const order = orderResult.rows[0];
    const expectedAmount = Number((request.requestType === 'cancellation'
      ? Number(order.total)
      : Number(request.unitPrice) * request.quantity).toFixed(2));
    const amount = Number((refundAmount === undefined ? expectedAmount : refundAmount).toFixed(2));
    if (!Number.isFinite(amount) || amount <= 0) throw conflict('The refund amount could not be calculated.');
    if (request.requestType === 'cancellation' && amount !== Number(order.total)) {
      throw badRequest('Order cancellation refunds must return the full amount paid.');
    }
    if (request.requestType === 'return_refund' &&
        (amount < expectedAmount || amount > Number((expectedAmount + Number(order.shippingFee)).toFixed(2)))) {
      throw badRequest('The refund must cover the returned items and cannot exceed the item value plus delivery fee.');
    }

    const commissionResult = await client.query(
      `SELECT id, status FROM commissions
       WHERE order_id = $1
         AND ($2::bigint IS NULL OR order_item_id = $2)
       FOR UPDATE`,
      [order.id, request.orderItemId || null]
    );
    if (commissionResult.rows.some((commission) => commission.status === 'paid')) {
      throw conflict('A seller payout has already been recorded for this order item. Reconcile the payout before refunding.');
    }
    const refundedResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) AS refunded FROM refunds WHERE order_id = $1',
      [order.id]
    );
    if (Number(refundedResult.rows[0].refunded) + amount > Number(order.total)) {
      throw conflict('The refund would exceed the amount paid for this order.');
    }
    const duplicateReference = await client.query(
      'SELECT 1 FROM refunds WHERE provider_reference = $1',
      [refundReference]
    );
    if (duplicateReference.rowCount) throw conflict('That refund reference has already been recorded.');
    await client.query(
      `INSERT INTO refunds (request_id, order_id, amount, provider_reference, processed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [request.id, order.id, amount, refundReference, adminId]
    );

    if (request.requestType === 'cancellation') {
      const shipments = await client.query(
        'SELECT id, status FROM shipments WHERE order_id = $1 FOR UPDATE',
        [order.id]
      );
      if (shipments.rows.some((shipment) => shipment.status !== 'pending')) {
        throw conflict('The order was dispatched while the cancellation request was reviewed.');
      }
      await restoreOrderStock(client, order.id);
      await client.query(
        `UPDATE commissions SET status = 'refunded'
         WHERE order_id = $1 AND status = 'earned'`,
        [order.id]
      );
      await client.query(
        `UPDATE orders SET status = 'cancelled', payment_status = 'refunded', cancelled_at = now()
         WHERE id = $1`,
        [order.id]
      );
      await rewardService.reverseRefundedOrderRewards(client, order.id);
    } else {
      const itemResult = await client.query(
        `SELECT oi.quantity, oi.product_id AS "productId",
                oi.variant_id AS "variantId", oi.variant_sku AS "variantSku",
                oi.line_total AS "lineTotal",
                oi.commission_amount AS "commissionAmount",
                oi.seller_earnings AS "sellerEarnings", c.id AS "commissionId"
         FROM order_items oi
         LEFT JOIN commissions c ON c.order_item_id = oi.id
         WHERE oi.id = $1 FOR UPDATE OF oi`,
        [request.orderItemId]
      );
      const item = itemResult.rows[0];
      if (!item) throw notFound('The returned order item no longer exists.');
      await restoreReturnedItemStock(client, item, request.quantity);
      if (item.commissionId) {
        const refundedQuantity = await client.query(
          `SELECT COALESCE(SUM(r.quantity), 0)::int AS quantity
           FROM order_adjustment_requests r
           JOIN refunds f ON f.request_id = r.id
           WHERE r.order_item_id = $1`,
          [request.orderItemId]
        );
        const remainingRatio = (item.quantity - refundedQuantity.rows[0].quantity) / item.quantity;
        await client.query(
          `UPDATE commissions c
           SET gross_amount = CASE WHEN $1 = 0 THEN c.gross_amount ELSE ROUND(oi.line_total * $1, 2) END,
               commission_amount = ROUND(oi.commission_amount * $1, 2),
               seller_earnings = ROUND(oi.seller_earnings * $1, 2),
               status = CASE WHEN $1 = 0 THEN 'refunded' ELSE c.status END
           FROM order_items oi
           WHERE c.order_item_id = oi.id AND oi.id = $2`,
          [remainingRatio, request.orderItemId]
        );
      }
      if (Number(refundedResult.rows[0].refunded) + amount >= Number(order.total)) {
        await client.query("UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [order.id]);
        await rewardService.reverseRefundedOrderRewards(client, order.id);
      }
    }

    const updated = await client.query(
      `UPDATE order_adjustment_requests
       SET status = 'refunded', reviewed_by = $1, reviewed_at = now()
       WHERE id = $2
       RETURNING id, status`,
      [adminId, requestId]
    );
    return { ...request, ...updated.rows[0], refundAmount: amount };
  });

  await notifyOrder(result.orderNumber, {
    subject: result.status === 'refunded' ? 'Order refund processed' : 'Order request reviewed',
    message: result.status === 'refunded'
      ? `A refund of ${result.refundAmount} KES was recorded for your order.`
      : `Your ${result.requestType === 'cancellation' ? 'cancellation' : 'return'} request was ${result.status}.`,
    audience: 'all'
  });
  return result;
}

module.exports = { createRequest, listRequests, reviewRequest };
