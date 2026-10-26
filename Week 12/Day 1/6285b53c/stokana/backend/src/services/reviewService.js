const db = require('../config/db');
const { conflict, notFound } = require('../utils/errors');

async function createReview(buyerId, input) {
  return db.withTransaction(async (client) => {
    const itemResult = await client.query(
      `SELECT oi.id, oi.product_id AS "productId", oi.seller_id AS "sellerId",
              o.status AS "orderStatus", o.payment_status AS "paymentStatus"
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.id = $1 AND o.buyer_id = $2`,
      [input.orderItemId, buyerId]
    );
    const item = itemResult.rows[0];
    if (!item) throw notFound('That order item could not be found.');
    if (item.paymentStatus !== 'paid' || item.orderStatus !== 'delivered') {
      throw conflict('You can review a product once its order has been delivered.');
    }

    const already = await client.query('SELECT 1 FROM reviews WHERE order_item_id = $1', [item.id]);
    if (already.rowCount) throw conflict('You have already reviewed this item.');

    const { rows } = await client.query(
      `INSERT INTO reviews (order_item_id, product_id, buyer_id, seller_id, rating, title, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, rating, title, comment, created_at AS "createdAt"`,
      [
        item.id,
        item.productId,
        buyerId,
        item.sellerId,
        input.rating,
        input.title || null,
        input.comment || null
      ]
    );
    return rows[0];
  });
}

async function getSellerReviews(sellerId, limit = 5) {
  const { rows } = await db.query(
    `SELECT r.id, r.rating, r.title, r.comment, r.created_at AS "createdAt",
            p.name AS "productName", p.slug AS "productSlug",
            split_part(u.full_name, ' ', 1) AS "buyerName"
     FROM reviews r
     JOIN products p ON p.id = r.product_id
     JOIN users u ON u.id = r.buyer_id
     WHERE r.seller_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2`,
    [sellerId, limit]
  );
  return rows;
}

async function getBuyerReviews(buyerId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const [countResult, listResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total, COALESCE(AVG(rating)::float, 0) AS "averageRating"
       FROM reviews WHERE buyer_id = $1`,
      [buyerId]
    ),
    db.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at AS "createdAt",
              r.product_id AS "productId", p.name AS "productName", p.slug AS "productSlug",
              p.status AS "productStatus",
              sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
              COALESCE((
                SELECT pi.url FROM product_images pi
                WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1
              ), '/assets/placeholder.svg') AS "imageUrl"
       FROM reviews r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN seller_profiles sp ON sp.user_id = r.seller_id
       WHERE r.buyer_id = $1
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT $2 OFFSET $3`,
      [buyerId, limit, offset]
    )
  ]);

  const total = countResult.rows[0].total;
  return {
    reviews: listResult.rows,
    summary: {
      total,
      averageRating: Math.round(countResult.rows[0].averageRating * 10) / 10
    },
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

module.exports = { createReview, getSellerReviews, getBuyerReviews };
