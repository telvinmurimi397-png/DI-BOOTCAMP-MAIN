const db = require('../config/db');
const catalogueService = require('./catalogueService');
const { notFound } = require('../utils/errors');

async function getWishlistIds(buyerId) {
  const { rows } = await db.query(
    `SELECT w.product_id AS "productId"
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     JOIN categories c ON c.id = p.category_id AND c.is_active = TRUE
     JOIN users u ON u.id = p.seller_id AND u.is_active = TRUE
     JOIN seller_profiles sp ON sp.user_id = u.id AND sp.status = 'approved'
     WHERE w.buyer_id = $1 AND p.status = 'approved'
     ORDER BY w.created_at DESC, w.product_id DESC`,
    [buyerId]
  );
  return rows.map((row) => row.productId);
}

async function getWishlist(buyerId) {
  const { rows } = await db.query(
    `SELECT p.slug
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     JOIN categories c ON c.id = p.category_id AND c.is_active = TRUE
     JOIN users u ON u.id = p.seller_id AND u.is_active = TRUE
     JOIN seller_profiles sp ON sp.user_id = u.id AND sp.status = 'approved'
     WHERE w.buyer_id = $1 AND p.status = 'approved'
     ORDER BY w.created_at DESC, w.product_id DESC`,
    [buyerId]
  );
  return catalogueService.getProductsBySlugs(rows.map((row) => row.slug));
}

async function addItem(buyerId, productId) {
  const result = await db.query(
    `INSERT INTO wishlists (buyer_id, product_id)
     SELECT $1, p.id
     FROM products p
     JOIN categories c ON c.id = p.category_id AND c.is_active = TRUE
     JOIN users u ON u.id = p.seller_id AND u.is_active = TRUE
     JOIN seller_profiles sp ON sp.user_id = u.id AND sp.status = 'approved'
     WHERE p.id = $2 AND p.status = 'approved'
     ON CONFLICT (buyer_id, product_id) DO NOTHING
     RETURNING product_id AS "productId"`,
    [buyerId, productId]
  );
  if (!result.rowCount) {
    const exists = await db.query(
      `SELECT 1 FROM wishlists WHERE buyer_id = $1 AND product_id = $2`,
      [buyerId, productId]
    );
    if (!exists.rowCount) throw notFound('That product is no longer available.');
  }
}

async function removeItem(buyerId, productId) {
  const result = await db.query(
    'DELETE FROM wishlists WHERE buyer_id = $1 AND product_id = $2 RETURNING product_id',
    [buyerId, productId]
  );
  if (!result.rowCount) throw notFound('Saved product not found.');
}

module.exports = { getWishlistIds, getWishlist, addItem, removeItem };
