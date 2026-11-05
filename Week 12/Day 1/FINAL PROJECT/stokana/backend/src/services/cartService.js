const db = require('../config/db');
const settingsService = require('./settingsService');
const { toCents, fromCents } = require('../utils/money');
const { calculateDeliveryFees } = require('../utils/deliveryFees');
const { conflict, notFound, badRequest } = require('../utils/errors');
const promotionService = require('./promotionService');

const ACTIVE_PRICE = promotionService.activePriceExpression('p', 'COALESCE(pv.price, p.price)');

const CART_ITEMS_SQL = `
  SELECT
    ci.id AS "itemId",
    ci.quantity,
    p.id AS "productId",
    p.name,
    p.slug,
    ${ACTIVE_PRICE} AS "price",
    p.compare_at_price AS "compareAtPrice",
    p.stock,
    ${ACTIVE_PRICE} AS "unitPrice",
    COALESCE(pv.stock, p.stock) AS "availableStock",
    pv.id AS "variantId",
    pv.sku AS "variantSku",
    pv.attributes AS "variantAttributes",
    p.status AS "productStatus",
    u.is_active AS "sellerActive",
    sp.status AS "sellerStatus",
    sp.shop_name AS "shopName",
    sp.shop_slug AS "shopSlug",
    sp.delivery_fee AS "shopDeliveryFee",
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
  LEFT JOIN product_variants pv ON pv.product_id = ci.product_id AND pv.id = ci.variant_id
  JOIN categories c ON c.id = p.category_id
  JOIN users u ON u.id = p.seller_id
  LEFT JOIN seller_profiles sp ON sp.user_id = u.id
  WHERE cart.buyer_id = $1
  ORDER BY ci.created_at ASC, ci.id ASC
`;

const SAVED_ITEMS_SQL = `
  SELECT
    si.id AS "savedItemId",
    si.quantity,
    p.id AS "productId",
    p.name,
    p.slug,
    ${ACTIVE_PRICE} AS "unitPrice",
    COALESCE(pv.stock, p.stock) AS "availableStock",
    pv.id AS "variantId",
    pv.sku AS "variantSku",
    pv.attributes AS "variantAttributes",
    p.status AS "productStatus",
    u.is_active AS "sellerActive",
    sp.status AS "sellerStatus",
    sp.shop_name AS "shopName",
    sp.shop_slug AS "shopSlug",
    c.is_active AS "categoryActive",
    COALESCE((
      SELECT url FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
      LIMIT 1
    ), '/assets/placeholder.svg') AS "imageUrl"
  FROM saved_cart_items si
  JOIN products p ON p.id = si.product_id
  LEFT JOIN product_variants pv ON pv.product_id = si.product_id AND pv.id = si.variant_id
  JOIN categories c ON c.id = p.category_id
  JOIN users u ON u.id = p.seller_id
  LEFT JOIN seller_profiles sp ON sp.user_id = u.id
  WHERE si.buyer_id = $1
  ORDER BY si.created_at ASC, si.id ASC
`;

function itemIssue(item) {
  if (item.productStatus !== 'approved' || item.categoryActive === false) return 'No longer available';
  if (!item.sellerActive || item.sellerStatus !== 'approved') return 'Seller is unavailable';
  if (item.availableStock <= 0) return 'Sold out';
  if (item.quantity > item.availableStock) return `Only ${item.availableStock} left in stock`;
  return null;
}

async function getCart(buyerId) {
  const [itemsResult, savedResult, settings] = await Promise.all([
    db.query(CART_ITEMS_SQL, [buyerId]),
    db.query(SAVED_ITEMS_SQL, [buyerId]),
    settingsService.getSettings()
  ]);

  const items = itemsResult.rows.map((item) => {
    const issue = itemIssue(item);
    return {
      ...item,
      price: fromCents(toCents(item.unitPrice)),
      stock: item.availableStock,
      lineTotal: fromCents(toCents(item.unitPrice) * item.quantity),
      isAvailable: !issue,
      issue
    };
  });

  const available = items.filter((item) => item.isAvailable);
  const savedItems = savedResult.rows.map((item) => {
    const issue = itemIssue(item);
    return {
      ...item,
      price: fromCents(toCents(item.unitPrice)),
      stock: item.availableStock,
      lineTotal: fromCents(toCents(item.unitPrice) * item.quantity),
      isAvailable: !issue,
      issue
    };
  });
  const subtotalCents = available.reduce(
    (sum, item) => sum + toCents(item.price) * item.quantity,
    0
  );
  const { deliveryFees, totalCents: shippingCents } = calculateDeliveryFees(
    available,
    subtotalCents,
    toCents(settings.freeShippingThreshold)
  );

  return {
    items,
    savedItems,
    summary: {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      availableItemCount: available.length,
      unavailableItemCount: items.length - available.length,
      subtotal: fromCents(subtotalCents),
      shippingFee: fromCents(shippingCents),
      shippingBreakdown: deliveryFees,
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

async function addItemWithClient(client, buyerId, productId, quantity, variantId = null) {
    const productResult = await client.query(
      `SELECT p.id, p.name, p.stock, p.status, u.is_active AS "sellerActive",
              sp.status AS "sellerStatus", c.is_active AS "categoryActive"
       FROM products p
       JOIN users u ON u.id = p.seller_id
       LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1
       FOR UPDATE OF p`,
      [productId]
    );
    const product = productResult.rows[0];
    if (!product || product.status !== 'approved' || !product.categoryActive) {
      throw notFound('That product is no longer available.');
    }
    if (!product.sellerActive || product.sellerStatus !== 'approved') {
      throw conflict('This seller is not currently accepting orders.');
    }
    const variantsResult = await client.query(
      'SELECT id FROM product_variants WHERE product_id = $1 LIMIT 1',
      [productId]
    );
    if (variantsResult.rowCount && variantId == null) {
      throw badRequest('Choose a product option before adding it to your cart.');
    }
    if (!variantsResult.rowCount && variantId != null) {
      throw badRequest('This product does not have selectable options.');
    }
    let stock = product.stock;
    if (variantId != null) {
      const variantResult = await client.query(
        `SELECT id, stock FROM product_variants
         WHERE product_id = $1 AND id = $2 FOR UPDATE`,
        [productId, variantId]
      );
      if (!variantResult.rows[0]) throw badRequest('Choose a valid product option.');
      stock = variantResult.rows[0].stock;
    }
    if (stock <= 0) throw conflict('This product option is sold out.');

    const cartResult = await client.query(
      `INSERT INTO carts (buyer_id) VALUES ($1)
       ON CONFLICT (buyer_id) DO UPDATE
       SET updated_at = now(), reminder_sent_at = NULL, reminder_claimed_at = NULL
       RETURNING id`,
      [buyerId]
    );
    const cartId = cartResult.rows[0].id;

    const existing = await client.query(
      `SELECT quantity FROM cart_items
       WHERE cart_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3
       FOR UPDATE`,
      [cartId, productId, variantId]
    );
    const existingQuantity = existing.rows[0]?.quantity || 0;
    if (existingQuantity + quantity > stock) {
      throw conflict(
        existingQuantity > 0
          ? `You already have ${existingQuantity} in your cart. Only ${stock} are available.`
          : `Only ${stock} left in stock.`
      );
    }

    if (existing.rowCount) {
      await client.query(
        `UPDATE cart_items SET quantity = $1, updated_at = now() WHERE cart_id = $2
         AND product_id = $3 AND variant_id IS NOT DISTINCT FROM $4`,
        [existingQuantity + quantity, cartId, productId, variantId]
      );
    } else {
      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
         VALUES ($1, $2, $3, $4)`,
        [cartId, productId, variantId, quantity]
      );
    }
}

async function addItem(buyerId, productId, quantity, variantId = null) {
  return db.withTransaction((client) => addItemWithClient(client, buyerId, productId, quantity, variantId));
}

async function saveForLater(buyerId, itemId) {
  return db.withTransaction(async (client) => {
    const result = await client.query(
      `SELECT ci.product_id AS "productId", ci.variant_id AS "variantId", ci.quantity
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       WHERE ci.id = $1 AND c.buyer_id = $2
       FOR UPDATE OF c, ci`,
      [itemId, buyerId]
    );
    const item = result.rows[0];
    if (!item) throw notFound('Cart item not found.');

    const insertSql = item.variantId == null
      ? `INSERT INTO saved_cart_items (buyer_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (buyer_id, product_id) WHERE variant_id IS NULL
         DO UPDATE SET quantity = LEAST(saved_cart_items.quantity + EXCLUDED.quantity, 99)`
      : `INSERT INTO saved_cart_items (buyer_id, product_id, variant_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (buyer_id, product_id, variant_id) WHERE variant_id IS NOT NULL
         DO UPDATE SET quantity = LEAST(saved_cart_items.quantity + EXCLUDED.quantity, 99)`;
    const values = item.variantId == null
      ? [buyerId, item.productId, item.quantity]
      : [buyerId, item.productId, item.variantId, item.quantity];
    await client.query(insertSql, values);
    await client.query('DELETE FROM cart_items WHERE id = $1', [itemId]);
    await client.query(
      'UPDATE carts SET updated_at = now(), reminder_sent_at = NULL, reminder_claimed_at = NULL WHERE buyer_id = $1',
      [buyerId]
    );
  });
}

async function moveSavedToCart(buyerId, savedItemId) {
  return db.withTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, product_id AS "productId", variant_id AS "variantId", quantity
       FROM saved_cart_items WHERE id = $1 AND buyer_id = $2 FOR UPDATE`,
      [savedItemId, buyerId]
    );
    const item = result.rows[0];
    if (!item) throw notFound('Saved item not found.');
    await addItemWithClient(client, buyerId, item.productId, item.quantity, item.variantId);
    await client.query('DELETE FROM saved_cart_items WHERE id = $1', [item.id]);
  });
}

async function removeSavedItem(buyerId, savedItemId) {
  const result = await db.query(
    'DELETE FROM saved_cart_items WHERE id = $1 AND buyer_id = $2 RETURNING id',
    [savedItemId, buyerId]
  );
  if (!result.rowCount) throw notFound('Saved item not found.');
}

async function updateItem(buyerId, itemId, quantity) {
  return db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT c.id AS "cartId", ci.id, COALESCE(pv.stock, p.stock) AS stock
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_variants pv ON pv.product_id = ci.product_id AND pv.id = ci.variant_id
       WHERE ci.id = $1 AND c.buyer_id = $2
       FOR UPDATE OF c, ci`,
      [itemId, buyerId]
    );
    const item = rows[0];
    if (!item) throw notFound('Cart item not found.');
    if (quantity > item.stock) {
      throw conflict(item.stock === 0 ? 'This product is sold out.' : `Only ${item.stock} left in stock.`);
    }

    await client.query(
      'UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2',
      [quantity, itemId]
    );
    await client.query(
      'UPDATE carts SET updated_at = now(), reminder_sent_at = NULL, reminder_claimed_at = NULL WHERE id = $1',
      [item.cartId]
    );
  });
}

async function removeItem(buyerId, itemId) {
  return db.withTransaction(async (client) => {
    const cart = await client.query(
      `SELECT c.id FROM carts c
       JOIN cart_items ci ON ci.cart_id = c.id
       WHERE ci.id = $1 AND c.buyer_id = $2
       FOR UPDATE OF c, ci`,
      [itemId, buyerId]
    );
    if (!cart.rowCount) throw notFound('Cart item not found.');
    await client.query('DELETE FROM cart_items WHERE id = $1', [itemId]);
    await client.query(
      'UPDATE carts SET updated_at = now(), reminder_sent_at = NULL, reminder_claimed_at = NULL WHERE id = $1',
      [cart.rows[0].id]
    );
  });
}

async function clearCart(buyerId) {
  return db.withTransaction(async (client) => {
    const cart = await client.query(
      'SELECT id FROM carts WHERE buyer_id = $1 FOR UPDATE',
      [buyerId]
    );
    const cartId = cart.rows[0]?.id;
    if (!cartId) throw badRequest('Your cart is already empty.');
    const result = await client.query(
      'DELETE FROM cart_items WHERE cart_id = $1 RETURNING id',
      [cartId]
    );
    if (!result.rowCount) throw badRequest('Your cart is already empty.');
    await client.query(
      'UPDATE carts SET updated_at = now(), reminder_sent_at = NULL, reminder_claimed_at = NULL WHERE id = $1',
      [cartId]
    );
  });
}

module.exports = {
  getCart,
  getCartCount,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  saveForLater,
  moveSavedToCart,
  removeSavedItem
};
