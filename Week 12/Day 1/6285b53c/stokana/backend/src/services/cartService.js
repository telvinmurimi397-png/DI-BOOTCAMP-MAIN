const db = require('../config/db');
const settingsService = require('./settingsService');
const { toCents, fromCents } = require('../utils/money');
const { conflict, notFound, badRequest } = require('../utils/errors');

const CART_ITEMS_SQL = `
  SELECT
    ci.id AS "itemId",
    ci.quantity,
    p.id AS "productId",
    p.name,
    p.slug,
    p.price,
    p.compare_at_price AS "compareAtPrice",
    p.stock,
    p.status AS "productStatus",
    u.is_active AS "sellerActive",
    sp.status AS "sellerStatus",
    sp.shop_name AS "shopName",
    sp.shop_slug AS "shopSlug",
    c.is_active AS "categoryActive",
    c.name AS "categoryName",
    COALESCE((
      SELECT url FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
      LIMIT 1
    ), '/assets/placeholder.svg') AS "imageUrl"
  FROM carts cart
  JOIN cart_items ci ON ci.cart_id = cart.id
  JOIN products p ON p.id = ci.product_id
  JOIN categories c ON c.id = p.category_id
  JOIN users u ON u.id = p.seller_id
  LEFT JOIN seller_profiles sp ON sp.user_id = u.id
  WHERE cart.buyer_id = $1
  ORDER BY ci.created_at ASC, ci.id ASC
`;

function itemIssue(item) {
  if (item.productStatus !== 'approved' || item.categoryActive === false) return 'No longer available';
  if (!item.sellerActive || item.sellerStatus !== 'approved') return 'Seller is unavailable';
  if (item.stock <= 0) return 'Sold out';
  if (item.quantity > item.stock) return `Only ${item.stock} left in stock`;
  return null;
}

async function getCart(buyerId) {
  const [itemsResult, settings] = await Promise.all([
    db.query(CART_ITEMS_SQL, [buyerId]),
    settingsService.getSettings()
  ]);

  const items = itemsResult.rows.map((item) => {
    const issue = itemIssue(item);
    return {
      ...item,
      price: fromCents(toCents(item.price)),
      lineTotal: fromCents(toCents(item.price) * item.quantity),
      isAvailable: !issue,
      issue
    };
  });

  const available = items.filter((item) => item.isAvailable);
  const subtotalCents = available.reduce(
    (sum, item) => sum + toCents(item.price) * item.quantity,
    0
  );
  const freeShipping = subtotalCents >= toCents(settings.freeShippingThreshold);
  const shippingCents = available.length === 0 || freeShipping ? 0 : toCents(settings.shippingFee);

  return {
    items,
    summary: {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      availableItemCount: available.length,
      unavailableItemCount: items.length - available.length,
      subtotal: fromCents(subtotalCents),
      shippingFee: fromCents(shippingCents),
      total: fromCents(subtotalCents + shippingCents),
      freeShippingThreshold: settings.freeShippingThreshold,
      shippingFeeStandard: settings.shippingFee,
      currency: 'KES',
      canCheckout: items.length > 0 && items.every((item) => item.isAvailable)
    }
  };
}

async function getCartCount(buyerId) {
  const { rows } = await db.query(
    `SELECT COALESCE(SUM(ci.quantity), 0)::int AS count
     FROM carts c JOIN cart_items ci ON ci.cart_id = c.id
     WHERE c.buyer_id = $1`,
    [buyerId]
  );
  return rows[0].count;
}

async function addItem(buyerId, productId, quantity) {
  return db.withTransaction(async (client) => {
    const productResult = await client.query(
      `SELECT p.id, p.name, p.stock, p.status, u.is_active AS "sellerActive",
              sp.status AS "sellerStatus", c.is_active AS "categoryActive"
       FROM products p
       JOIN users u ON u.id = p.seller_id
       LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [productId]
    );
    const product = productResult.rows[0];
    if (!product || product.status !== 'approved' || !product.categoryActive) {
      throw notFound('That product is no longer available.');
    }
    if (!product.sellerActive || product.sellerStatus !== 'approved') {
      throw conflict('This seller is not currently accepting orders.');
    }
    if (product.stock <= 0) throw conflict('This product is sold out.');

    const cartResult = await client.query(
      `INSERT INTO carts (buyer_id) VALUES ($1)
       ON CONFLICT (buyer_id) DO UPDATE SET updated_at = now()
       RETURNING id`,
      [buyerId]
    );
    const cartId = cartResult.rows[0].id;

    const existing = await client.query(
      'SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );
    const existingQuantity = existing.rows[0]?.quantity || 0;
    if (existingQuantity + quantity > product.stock) {
      throw conflict(
        existingQuantity > 0
          ? `You already have ${existingQuantity} in your cart. Only ${product.stock} are available.`
          : `Only ${product.stock} left in stock.`
      );
    }

    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = now()`,
      [cartId, productId, quantity]
    );
  });
}

async function updateItem(buyerId, itemId, quantity) {
  const { rows } = await db.query(
    `SELECT ci.id, ci.product_id AS "productId", p.stock, p.name
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN products p ON p.id = ci.product_id
     WHERE ci.id = $1 AND c.buyer_id = $2`,
    [itemId, buyerId]
  );
  const item = rows[0];
  if (!item) throw notFound('Cart item not found.');
  if (quantity > item.stock) {
    throw conflict(item.stock === 0 ? 'This product is sold out.' : `Only ${item.stock} left in stock.`);
  }

  await db.query(
    'UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2',
    [quantity, itemId]
  );
}

async function removeItem(buyerId, itemId) {
  const result = await db.query(
    `DELETE FROM cart_items ci
     USING carts c
     WHERE ci.cart_id = c.id AND ci.id = $1 AND c.buyer_id = $2
     RETURNING ci.id`,
    [itemId, buyerId]
  );
  if (!result.rowCount) throw notFound('Cart item not found.');
}

async function clearCart(buyerId) {
  const result = await db.query(
    `DELETE FROM cart_items ci
     USING carts c
     WHERE ci.cart_id = c.id AND c.buyer_id = $1
     RETURNING ci.id`,
    [buyerId]
  );
  if (!result.rowCount) throw badRequest('Your cart is already empty.');
}

module.exports = { getCart, getCartCount, addItem, updateItem, removeItem, clearCart };
