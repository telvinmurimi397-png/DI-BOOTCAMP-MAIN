const db = require('../config/db');
const { notFound } = require('../utils/errors');

const ACTIVE_STATUSES = ['pending_payment', 'paid', 'processing', 'shipped'];

async function getBuyerOrders(buyerId, page = 1, limit = 10, status = 'all') {
  const offset = (page - 1) * limit;
  const params = [buyerId];
  let filter = '';

  if (status === 'active') {
    params.push(ACTIVE_STATUSES);
    filter = `AND o.status = ANY($${params.length}::text[])`;
  } else if (status === 'awaiting_payment') {
    filter = "AND o.status = 'pending_payment'";
  } else if (status === 'delivered') {
    filter = "AND o.status = 'delivered'";
  } else if (status === 'cancelled') {
    filter = "AND o.status = 'cancelled'";
  }

  const countParams = [...params];
  const limitPosition = params.push(limit);
  const offsetPosition = params.push(offset);

  const [countResult, listResult] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total FROM orders o WHERE o.buyer_id = $1 ${filter}`, countParams),
    db.query(
      `SELECT
         o.id,
         o.order_number AS "orderNumber",
         o.status,
         o.payment_status AS "paymentStatus",
         o.total,
         o.created_at AS "createdAt",
         o.paid_at AS "paidAt",
         COALESCE(SUM(oi.quantity), 0)::int AS "unitCount",
         COUNT(DISTINCT oi.id)::int AS "itemCount",
         COALESCE((
           SELECT oi2.product_image_url FROM order_items oi2
           WHERE oi2.order_id = o.id ORDER BY oi2.id ASC LIMIT 1
         ), '/assets/placeholder.svg') AS "previewImage",
         COALESCE((
           SELECT json_agg(s.status) FROM shipments s WHERE s.order_id = o.id
         ), '[]'::json) AS "shipmentStatuses",
         (
           SELECT json_build_object(
             'provider', p.provider,
             'providerRef', p.provider_ref,
             'verifiedAt', p.verified_at
           )
           FROM payments p
           WHERE p.order_id = o.id AND p.status = 'success'
           ORDER BY p.id DESC LIMIT 1
         ) AS payment
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.buyer_id = $1 ${filter}
       GROUP BY o.id
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
      params
    )
  ]);

  const total = countResult.rows[0].total;
  return {
    orders: listResult.rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function getBuyerOrder(buyerId, orderNumber) {
  const orderResult = await db.query(
    `SELECT o.id, o.order_number AS "orderNumber", o.status, o.payment_status AS "paymentStatus",
            o.subtotal, o.shipping_fee AS "shippingFee", o.total,
            o.shipping_name AS "shippingName", o.shipping_phone AS "shippingPhone",
            o.shipping_email AS "shippingEmail", o.shipping_county AS "shippingCounty",
            o.shipping_town AS "shippingTown", o.shipping_address AS "shippingAddress",
            o.notes, o.paid_at AS "paidAt", o.cancelled_at AS "cancelledAt",
            o.created_at AS "createdAt", o.updated_at AS "updatedAt"
     FROM orders o
     WHERE o.buyer_id = $1 AND o.order_number = $2`,
    [buyerId, orderNumber]
  );
  const order = orderResult.rows[0];
  if (!order) throw notFound('Order not found.');

  const [itemsResult, paymentsResult] = await Promise.all([
    db.query(
      `SELECT oi.id, oi.product_id AS "productId", oi.product_name AS "productName",
              oi.product_image_url AS "imageUrl", oi.unit_price AS "unitPrice",
              oi.quantity, oi.line_total AS "lineTotal", oi.seller_id AS "sellerId",
              sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
              rv.id AS "reviewId", rv.rating AS "reviewRating",
              s.id AS "shipmentId", s.status AS "shipmentStatus", s.carrier,
              s.tracking_number AS "trackingNumber", s.updated_at AS "shipmentUpdatedAt"
       FROM order_items oi
       LEFT JOIN seller_profiles sp ON sp.user_id = oi.seller_id
       LEFT JOIN reviews rv ON rv.order_item_id = oi.id
       LEFT JOIN shipments s ON s.order_id = oi.order_id AND s.seller_id = oi.seller_id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [order.id]
    ),
    db.query(
      `SELECT provider, provider_ref AS "providerRef", amount, status,
              failure_reason AS "failureReason", verified_at AS "verifiedAt",
              created_at AS "createdAt"
       FROM payments WHERE order_id = $1 ORDER BY id DESC`,
      [order.id]
    )
  ]);

  const items = itemsResult.rows.map((item) => ({
    ...item,
    canReview: order.status === 'delivered' && !item.reviewId
  }));

  return {
    order: {
      ...order,
      currency: 'KES',
      items,
      payments: paymentsResult.rows,
      canCancel: order.status === 'pending_payment',
      canRetryPayment: order.status === 'pending_payment' && order.paymentStatus !== 'paid'
    }
  };
}

async function getBuyerStats(buyerId) {
  const [ordersResult, cartResult, unreadResult] = await Promise.all([
    db.query(
      `SELECT
         COUNT(*)::int AS "ordersCount",
         COUNT(*) FILTER (WHERE status = ANY($2::text[]))::int AS "activeOrders",
         COUNT(*) FILTER (WHERE status = 'delivered')::int AS "deliveredOrders",
         COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND status <> 'cancelled'), 0) AS "totalSpent"
       FROM orders WHERE buyer_id = $1`,
      [buyerId, ACTIVE_STATUSES]
    ),
    db.query(
      `SELECT COALESCE(SUM(ci.quantity), 0)::int AS "cartItems"
       FROM carts c JOIN cart_items ci ON ci.cart_id = c.id
       WHERE c.buyer_id = $1`,
      [buyerId]
    ),
    db.query(
      `SELECT COUNT(*)::int AS "unreadMessages"
       FROM messages m
       JOIN conversations conv ON conv.id = m.conversation_id
       WHERE conv.buyer_id = $1 AND m.sender_id <> $1 AND m.read_at IS NULL`,
      [buyerId]
    )
  ]);

  return {
    ...ordersResult.rows[0],
    ...cartResult.rows[0],
    ...unreadResult.rows[0]
  };
}

module.exports = { getBuyerOrders, getBuyerOrder, getBuyerStats, ACTIVE_STATUSES };
