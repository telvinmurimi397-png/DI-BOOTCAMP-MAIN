const db = require('../config/db');
const { uniqueSlug } = require('../utils/slug');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { notifyOrder } = require('./orderNotificationService');

const MONTHLY_SALES_SQL = `
  WITH months AS (
    SELECT date_trunc('month', now()) - (n || ' months')::interval AS month
    FROM generate_series(5, 0, -1) AS n
  )
  SELECT
    to_char(months.month, 'YYYY-MM') AS month,
    to_char(months.month, 'Mon') AS label,
    COALESCE(SUM(c.gross_amount), 0) AS gross,
    COALESCE(SUM(c.commission_amount), 0) AS commission,
    COALESCE(SUM(c.seller_earnings), 0) AS earnings
  FROM months
  LEFT JOIN commissions c
    ON c.seller_id = $1
    AND c.status <> 'refunded'
    AND date_trunc('month', c.created_at) = months.month
  GROUP BY months.month
  ORDER BY months.month ASC
`;

async function getOverview(sellerId) {
  const [
    productCounts,
    earnings,
    units,
    lowStock,
    unread,
    monthly,
    recentOrders
  ] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'approved')::int AS active,
              COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
              COUNT(*) FILTER (WHERE status = 'approved' AND stock <= 5)::int AS "lowStockCount"
       FROM products WHERE seller_id = $1`,
      [sellerId]
    ),
    db.query(
      `SELECT
         COALESCE(SUM(seller_earnings) FILTER (WHERE status <> 'refunded'), 0) AS "lifetimeEarnings",
         COALESCE(SUM(seller_earnings) FILTER (WHERE status = 'earned'), 0) AS "availableBalance",
         COALESCE(SUM(seller_earnings) FILTER (WHERE status = 'paid'), 0) AS "paidOut",
         COALESCE(SUM(commission_amount) FILTER (WHERE status <> 'refunded'), 0) AS "commissionTotal",
         COALESCE(SUM(gross_amount) FILTER (WHERE status <> 'refunded'), 0) AS "grossSales"
       FROM commissions WHERE seller_id = $1`,
      [sellerId]
    ),
    db.query(
      `SELECT COALESCE(SUM(GREATEST(oi.quantity - COALESCE(refunded.quantity, 0), 0)), 0)::int AS "unitsSold",
              COUNT(DISTINCT o.id)::int AS "paidOrders"
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN LATERAL (
         SELECT SUM(r.quantity)::int AS quantity
         FROM order_adjustment_requests r
         JOIN refunds f ON f.request_id = r.id
         WHERE r.order_item_id = oi.id
       ) refunded ON TRUE
       WHERE oi.seller_id = $1 AND o.payment_status = 'paid' AND o.status <> 'cancelled'`,
      [sellerId]
    ),
    db.query(
      `SELECT id, name, slug, stock, price FROM products
       WHERE seller_id = $1 AND status = 'approved' AND stock <= 5
       ORDER BY stock ASC, name ASC LIMIT 5`,
      [sellerId]
    ),
    db.query(
      `SELECT COUNT(*)::int AS count FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE c.seller_id = $1 AND m.sender_id <> $1 AND m.read_at IS NULL`,
      [sellerId]
    ),
    db.query(MONTHLY_SALES_SQL, [sellerId]),
    getOrders(sellerId, 1, 5)
  ]);

  return {
    products: productCounts.rows[0],
    earnings: earnings.rows[0],
    sales: units.rows[0],
    lowStockProducts: lowStock.rows,
    unreadMessages: unread.rows[0].count,
    monthlySales: monthly.rows,
    recentOrders: recentOrders.orders,
    recentReviews: await getRecentReviews(sellerId)
  };
}

async function getRecentReviews(sellerId) {
  const { rows } = await db.query(
    `SELECT r.id, r.rating, r.title, r.comment, r.created_at AS "createdAt",
            split_part(u.full_name, ' ', 1) AS "buyerName"
     FROM reviews r JOIN users u ON u.id = r.buyer_id
     WHERE r.seller_id = $1 ORDER BY r.created_at DESC LIMIT 3`,
    [sellerId]
  );
  return rows;
}

async function listProducts(sellerId, { status = 'all', q, page = 1, limit = 20 }) {
  const params = [sellerId];
  const where = ['p.seller_id = $1'];
  if (status !== 'all') {
    params.push(status);
    where.push(`p.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`(p.name ILIKE $${params.length} ESCAPE '\\')`);
  }
  const offset = (page - 1) * limit;

  const [countResult, countsResult, listResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total FROM products p WHERE ${where.join(' AND ')}`,
      params
    ),
    db.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
              COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
              COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
       FROM products WHERE seller_id = $1`,
      [sellerId]
    ),
    db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_at_price AS "compareAtPrice",
              p.stock, p.status, p.condition, p.is_featured AS "isFeatured",
              p.rejection_reason AS "rejectionReason", p.created_at AS "createdAt",
              p.updated_at AS "updatedAt",
              c.id AS "categoryId", c.name AS "categoryName", c.slug AS "categorySlug",
              (SELECT COUNT(*)::int FROM product_variants pv WHERE pv.product_id = p.id) AS "variantCount",
              COALESCE((
                SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1
              ), '/assets/placeholder.svg') AS "imageUrl",
              COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM reviews r
                        WHERE r.product_id = p.id), 0)::float AS "ratingAverage",
              (SELECT COUNT(*)::int FROM reviews r WHERE r.product_id = p.id) AS "reviewCount",
              COALESCE(sold.units, 0)::int AS "unitsSold",
              COALESCE(sold.gross, 0) AS "grossSales"
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN LATERAL (
         SELECT SUM(GREATEST(oi.quantity - COALESCE(refunded.quantity, 0), 0)) AS units,
                SUM(oi.unit_price * GREATEST(oi.quantity - COALESCE(refunded.quantity, 0), 0)) AS gross
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         LEFT JOIN LATERAL (
           SELECT SUM(r.quantity)::int AS quantity
           FROM order_adjustment_requests r
           JOIN refunds f ON f.request_id = r.id
           WHERE r.order_item_id = oi.id
         ) refunded ON TRUE
         WHERE oi.product_id = p.id AND oi.seller_id = $1
           AND o.payment_status = 'paid' AND o.status <> 'cancelled'
       ) sold ON TRUE
       WHERE ${where.join(' AND ')}
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )
  ]);

  const total = countResult.rows[0].total;
  return {
    products: listResult.rows,
    counts: countsResult.rows[0],
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function getProduct(sellerId, productId) {
  const { rows } = await db.query(
    `SELECT p.id, p.name, p.slug, p.description, p.specifications, p.price, p.compare_at_price AS "compareAtPrice",
            p.stock, p.status, p.condition, p.location, p.rejection_reason AS "rejectionReason",
            p.created_at AS "createdAt", p.updated_at AS "updatedAt",
            c.id AS "categoryId", c.name AS "categoryName",
            COALESCE((
              SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'altText', pi.alt_text,
                                                'isPrimary', pi.is_primary)
                              ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC)
              FROM product_images pi WHERE pi.product_id = p.id
            ), '[]'::json) AS images,
            COALESCE((
              SELECT json_agg(json_build_object(
                'id', pv.id, 'sku', pv.sku, 'attributes', pv.attributes,
                'price', pv.price, 'stock', pv.stock
              ) ORDER BY pv.id)
              FROM product_variants pv WHERE pv.product_id = p.id
            ), '[]'::json) AS variants
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1 AND p.seller_id = $2`,
    [productId, sellerId]
  );
  if (!rows[0]) throw notFound('Product not found.');
  return rows[0];
}

async function createProduct(seller, input) {
  const productId = await db.withTransaction(async (client) => {
    const category = await client.query(
      `SELECT c.id FROM categories c
       WHERE c.id = $1 AND c.is_active = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM categories child
           WHERE child.parent_category_id = c.id AND child.is_active = TRUE
         )`,
      [input.categoryId]
    );
    if (!category.rowCount) throw badRequest('Choose an active category.');

    const slug = uniqueSlug(input.name);
    const result = await client.query(
      `INSERT INTO products
         (seller_id, category_id, name, slug, description, specifications, price,
          compare_at_price, stock, condition, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
       RETURNING id`,
      [
        seller.id,
        input.categoryId,
        input.name,
        slug,
        input.description,
        JSON.stringify(input.specifications || {}),
        input.price.toFixed(2),
        input.compareAtPrice != null ? Number(input.compareAtPrice).toFixed(2) : null,
        input.variants?.length
          ? input.variants.reduce((total, variant) => total + variant.stock, 0)
          : input.stock,
        input.condition,
        input.location || null
      ]
    );
    const newId = result.rows[0].id;

    for (const variant of input.variants || []) {
      await client.query(
        `INSERT INTO product_variants (product_id, sku, attributes, price, stock)
         VALUES ($1, $2, $3, $4, $5)`,
        [newId, variant.sku, JSON.stringify(variant.attributes),
          variant.price == null ? null : Number(variant.price).toFixed(2), variant.stock]
      );
    }

    let imageIndex = 0;
    for (const url of input.imageUrls) {
      await client.query(
        `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
         VALUES ($1, $2, $3, $4, $5)`,
        [newId, url, `${input.name} image ${imageIndex + 1}`, imageIndex, imageIndex === 0]
      );
      imageIndex += 1;
    }

    return newId;
  });

  return getProduct(seller.id, productId);
}

async function updateProduct(sellerId, productId, input) {
  await db.withTransaction(async (client) => {
    const currentResult = await client.query(
      `SELECT id, price, compare_at_price AS "compareAtPrice", status, name, stock
       FROM products WHERE id = $1 AND seller_id = $2 FOR UPDATE`,
      [productId, sellerId]
    );
    const current = currentResult.rows[0];
    if (!current) throw notFound('Product not found.');
    if (current.status === 'archived') throw conflict('Archived products cannot be edited.');

    if (input.categoryId !== undefined) {
      const category = await client.query(
        `SELECT c.id FROM categories c
         WHERE c.id = $1 AND c.is_active = TRUE
           AND NOT EXISTS (
             SELECT 1 FROM categories child
             WHERE child.parent_category_id = c.id AND child.is_active = TRUE
           )`,
        [input.categoryId]
      );
      if (!category.rowCount) throw badRequest('Choose an active category.');
    }

    const finalPrice = input.price !== undefined ? Number(input.price) : Number(current.price);
    const finalCompare = input.compareAtPrice !== undefined
      ? (input.compareAtPrice == null ? null : Number(input.compareAtPrice))
      : (current.compareAtPrice == null ? null : Number(current.compareAtPrice));
    if (finalCompare != null && finalCompare <= finalPrice) {
      throw badRequest('Compare-at price must be higher than the selling price.');
    }

    const updates = [];
    const params = [];
    const set = (column, value) => {
      params.push(value);
      updates.push(`${column} = $${params.length}`);
    };
    if (input.name !== undefined) set('name', input.name);
    if (input.categoryId !== undefined) set('category_id', input.categoryId);
    if (input.description !== undefined) set('description', input.description);
    if (input.specifications !== undefined) set('specifications', JSON.stringify(input.specifications));
    if (input.price !== undefined) set('price', finalPrice.toFixed(2));
    if (input.compareAtPrice !== undefined) {
      set('compare_at_price', finalCompare == null ? null : finalCompare.toFixed(2));
    }
    if (input.variants !== undefined) {
      const currentVariants = await client.query(
        'SELECT id, sku FROM product_variants WHERE product_id = $1 FOR UPDATE',
        [productId]
      );
      if (!currentVariants.rowCount && input.variants.length) {
        const reservedProduct = await client.query(
          `SELECT 1 FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE oi.product_id = $1 AND o.status = 'pending_payment'
           LIMIT 1`,
          [productId]
        );
        if (reservedProduct.rowCount) {
          throw conflict('Complete or cancel pending orders before adding product options.');
        }
        await client.query(
          'DELETE FROM cart_items WHERE product_id = $1 AND variant_id IS NULL',
          [productId]
        );
      }
      const incomingSkus = new Set(input.variants.map((variant) => variant.sku.toLowerCase()));
      const removedVariants = currentVariants.rows.filter(
        (variant) => !incomingSkus.has(variant.sku.toLowerCase())
      );
      if (removedVariants.length) {
        const reservedVariant = await client.query(
          `SELECT 1
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE oi.product_id = $1 AND oi.variant_sku = ANY($2::varchar[])
             AND o.status = 'pending_payment'
           LIMIT 1`,
          [productId, removedVariants.map((variant) => variant.sku)]
        );
        if (reservedVariant.rowCount) {
          throw conflict('Cancel or complete pending orders before removing their product options.');
        }
      }

      for (const variant of removedVariants) {
        await client.query('DELETE FROM product_variants WHERE id = $1', [variant.id]);
      }
      for (const variant of input.variants) {
        const existing = currentVariants.rows.find(
          (currentVariant) => currentVariant.sku.toLowerCase() === variant.sku.toLowerCase()
        );
        const values = [
          variant.sku,
          JSON.stringify(variant.attributes),
          variant.price == null ? null : Number(variant.price).toFixed(2),
          variant.stock
        ];
        if (existing) {
          await client.query(
            `UPDATE product_variants
             SET sku = $1, attributes = $2, price = $3, stock = $4
             WHERE id = $5`,
            [...values, existing.id]
          );
        } else {
          await client.query(
            `INSERT INTO product_variants (product_id, sku, attributes, price, stock)
             VALUES ($1, $2, $3, $4, $5)`,
            [productId, ...values]
          );
        }
      }
      set(
        'stock',
        input.variants.length
          ? input.variants.reduce((total, variant) => total + variant.stock, 0)
          : (input.stock !== undefined ? input.stock : current.stock)
      );
    } else if (input.stock !== undefined) {
      const hasVariants = await client.query(
        'SELECT 1 FROM product_variants WHERE product_id = $1 LIMIT 1',
        [productId]
      );
      if (hasVariants.rowCount) throw badRequest('Edit this product to update variant stock.');
      set('stock', input.stock);
    }
    if (input.condition !== undefined) set('condition', input.condition);
    if (input.location !== undefined) set('location', input.location || null);
    if (current.status === 'rejected') {
      updates.push("status = 'pending'", 'rejection_reason = NULL', 'approved_at = NULL', 'approved_by = NULL');
    }
    if (!updates.length) throw badRequest('Nothing to update.');

    params.push(productId, sellerId);
    await client.query(
      `UPDATE products SET ${updates.join(', ')}
       WHERE id = $${params.length - 1} AND seller_id = $${params.length}`,
      params
    );
  });

  return getProduct(sellerId, productId);
}

async function updateStock(sellerId, productId, stock) {
  const variants = await db.query(
    'SELECT 1 FROM product_variants WHERE product_id = $1 LIMIT 1',
    [productId]
  );
  if (variants.rowCount) throw badRequest('Edit this product to update variant stock.');
  const { rows } = await db.query(
    `UPDATE products SET stock = $1
     WHERE id = $2 AND seller_id = $3 AND status <> 'archived'
     RETURNING id, name, stock, status`,
    [stock, productId, sellerId]
  );
  if (!rows[0]) throw notFound('Product not found or archived.');
  return rows[0];
}

async function archiveProduct(sellerId, productId) {
  const { rows } = await db.query(
    `UPDATE products SET status = 'archived'
     WHERE id = $1 AND seller_id = $2 AND status <> 'archived'
     RETURNING id, name, status`,
    [productId, sellerId]
  );
  if (!rows[0]) throw notFound('Product not found or already archived.');
  return rows[0];
}

async function addImage(sellerId, productId, { url, altText, isPrimary = false }) {
  return db.withTransaction(async (client) => {
    const product = await client.query(
      `SELECT id, name, status FROM products WHERE id = $1 AND seller_id = $2 FOR UPDATE`,
      [productId, sellerId]
    );
    if (!product.rows[0]) throw notFound('Product not found.');
    if (product.rows[0].status === 'archived') throw conflict('Archived products cannot be edited.');

    const images = await client.query(
      'SELECT id, url, is_primary AS "isPrimary" FROM product_images WHERE product_id = $1',
      [productId]
    );
    if (images.rowCount >= 5) throw conflict('A product can have at most 5 images.');
    if (images.rows.some((image) => image.url === url)) {
      throw conflict('That image is already attached to this product.');
    }

    const shouldBePrimary = isPrimary || images.rowCount === 0;
    if (shouldBePrimary) {
      await client.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = $1', [productId]);
    }

    const inserted = await client.query(
      `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, url, alt_text AS "altText", is_primary AS "isPrimary"`,
      [productId, url, altText || product.rows[0].name, images.rowCount, shouldBePrimary]
    );
    return inserted.rows[0];
  });
}

async function setPrimaryImage(sellerId, productId, imageId) {
  await db.withTransaction(async (client) => {
    const owner = await client.query(
      'SELECT id FROM products WHERE id = $1 AND seller_id = $2',
      [productId, sellerId]
    );
    if (!owner.rowCount) throw notFound('Product not found.');
    const image = await client.query(
      'SELECT id FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );
    if (!image.rowCount) throw notFound('Image not found.');

    await client.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = $1', [productId]);
    await client.query('UPDATE product_images SET is_primary = TRUE WHERE id = $1', [imageId]);
  });
  return getProduct(sellerId, productId);
}

async function deleteImage(sellerId, productId, imageId) {
  await db.withTransaction(async (client) => {
    const owner = await client.query(
      'SELECT id FROM products WHERE id = $1 AND seller_id = $2',
      [productId, sellerId]
    );
    if (!owner.rowCount) throw notFound('Product not found.');

    const images = await client.query(
      'SELECT id, is_primary AS "isPrimary" FROM product_images WHERE product_id = $1 ORDER BY sort_order, id',
      [productId]
    );
    if (images.rowCount <= 1) throw conflict('A product must keep at least one image.');
    const target = images.rows.find((image) => Number(image.id) === Number(imageId));
    if (!target) throw notFound('Image not found.');

    await client.query('DELETE FROM product_images WHERE id = $1', [imageId]);
    if (target.isPrimary) {
      const next = images.rows.find((image) => Number(image.id) !== Number(imageId));
      await client.query('UPDATE product_images SET is_primary = TRUE WHERE id = $1', [next.id]);
    }
  });
  return getProduct(sellerId, productId);
}

async function getOrders(sellerId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const [countResult, listResult] = await Promise.all([
    db.query(
      `SELECT COUNT(DISTINCT o.id)::int AS total
       FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE oi.seller_id = $1 AND o.payment_status = 'paid'`,
      [sellerId]
    ),
    db.query(
      `SELECT
         o.id, o.order_number AS "orderNumber", o.status, o.payment_status AS "paymentStatus",
         o.shipping_name AS "shippingName", o.shipping_phone AS "shippingPhone",
         o.shipping_county AS "shippingCounty", o.shipping_town AS "shippingTown",
         o.shipping_address AS "shippingAddress", o.notes,
         o.created_at AS "createdAt", o.paid_at AS "paidAt",
         COALESCE(SUM(oi.line_total), 0) AS "sellerSubtotal",
         COALESCE(SUM(oi.seller_earnings), 0) + COALESCE(MAX(odf.delivery_fee), 0) AS "sellerEarnings",
         COALESCE(MAX(odf.delivery_fee), 0) AS "deliveryFee",
         s.id AS "shipmentId", s.status AS "shipmentStatus", s.carrier,
         s.tracking_number AS "trackingNumber", s.tracking_url AS "trackingUrl",
         s.pickup_location_id AS "pickupLocationId",
         pl.label AS "pickupLocationLabel", pl.town AS "pickupLocationTown",
         s.updated_at AS "shipmentUpdatedAt",
         json_agg(json_build_object(
           'id', oi.id,
           'productName', oi.product_name,
           'imageUrl', oi.product_image_url,
           'variantSku', oi.variant_sku,
           'variantAttributes', oi.variant_attributes,
           'quantity', oi.quantity,
           'unitPrice', oi.unit_price,
           'lineTotal', oi.line_total
         ) ORDER BY oi.id) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN order_seller_delivery_fees odf ON odf.order_id = o.id AND odf.seller_id = $1
       LEFT JOIN shipments s ON s.order_id = o.id AND s.seller_id = $1
       LEFT JOIN seller_pickup_locations pl ON pl.id = s.pickup_location_id
       WHERE oi.seller_id = $1 AND o.payment_status = 'paid'
       GROUP BY o.id, s.id, pl.id
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT $2 OFFSET $3`,
      [sellerId, limit, offset]
    )
  ]);

  const total = countResult.rows[0].total;
  const pickupLocations = await listPickupLocations(sellerId);
  return {
    orders: listResult.rows,
    pickupLocations,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function updateShipment(sellerId, shipmentId, input) {
  const result = await db.withTransaction(async (client) => {
    const shipmentOwner = await client.query(
      `SELECT order_id AS "orderId", pickup_location_id AS "pickupLocationId",
              carrier, tracking_number AS "trackingNumber", tracking_url AS "trackingUrl"
       FROM shipments WHERE id = $1 AND seller_id = $2`,
      [shipmentId, sellerId]
    );
    if (!shipmentOwner.rows[0]) throw notFound('Shipment not found.');

    const order = await client.query(
      `SELECT id, order_number AS "orderNumber", status
       FROM orders WHERE id = $1 AND payment_status = 'paid' FOR UPDATE`,
      [shipmentOwner.rows[0].orderId]
    );
    if (!order.rows[0]) throw conflict('This order has not been paid yet.');
    if (order.rows[0].status === 'cancelled') throw conflict('This order was cancelled.');

    const cancellation = await client.query(
      `SELECT 1 FROM order_adjustment_requests
       WHERE order_id = $1 AND request_type = 'cancellation'
         AND status IN ('pending', 'approved') LIMIT 1`,
      [order.rows[0].id]
    );
    if (cancellation.rowCount) {
      throw conflict('Fulfilment is paused while a cancellation request is being reviewed.');
    }

    const shipmentResult = await client.query(
      `SELECT s.id, s.order_id AS "orderId", s.status, s.carrier,
              s.tracking_number AS "trackingNumber", s.tracking_url AS "trackingUrl",
              s.pickup_location_id AS "pickupLocationId"
       FROM shipments s
       WHERE s.id = $1 AND s.seller_id = $2
       FOR UPDATE`,
      [shipmentId, sellerId]
    );
    const shipment = shipmentResult.rows[0];
    if (!shipment) throw notFound('Shipment not found.');

    const allowedTransitions = {
      pending: ['dispatched', 'failed'],
      dispatched: ['dispatched', 'in_transit', 'failed'],
      in_transit: ['in_transit', 'delivered', 'failed'],
      failed: ['failed', 'dispatched'],
      delivered: ['delivered']
    };
    if (!allowedTransitions[shipment.status]?.includes(input.status)) {
      throw conflict(`A ${shipment.status.replace('_', ' ')} shipment cannot move to ${input.status.replace('_', ' ')}.`);
    }

    const carrier = input.carrier || shipment.carrier;
    const trackingNumber = input.trackingNumber || shipment.trackingNumber;
    const trackingUrl = input.trackingUrl || shipment.trackingUrl;
    let pickupLocationId = input.pickupLocationId === undefined
      ? shipment.pickupLocationId
      : input.pickupLocationId;
    if (pickupLocationId !== null && pickupLocationId !== undefined) {
      if (Number(pickupLocationId) !== Number(shipment.pickupLocationId)) {
        const location = await client.query(
          `SELECT id FROM seller_pickup_locations
           WHERE id = $1 AND seller_id = $2 AND is_active = TRUE`,
          [pickupLocationId, sellerId]
        );
        if (!location.rowCount) throw badRequest('Choose one of your active pickup locations.');
      }
    } else {
      pickupLocationId = null;
    }
    if (input.status === 'dispatched' && !carrier && !trackingNumber) {
      throw badRequest('Add a courier or tracking number when dispatching an order.');
    }
    const updatedShipment = await client.query(
      `UPDATE shipments
       SET status = $1, carrier = $2, tracking_number = $3,
           tracking_url = $4, pickup_location_id = $5,
           shipped_at = CASE WHEN $1::varchar IN ('dispatched', 'in_transit') AND shipped_at IS NULL
                            THEN now() ELSE shipped_at END,
           delivered_at = CASE WHEN $1::varchar = 'delivered' THEN COALESCE(delivered_at, now())
                              ELSE delivered_at END
       WHERE id = $6
       RETURNING id, status, carrier, tracking_number AS "trackingNumber",
                 tracking_url AS "trackingUrl", pickup_location_id AS "pickupLocationId",
                 shipped_at AS "shippedAt", delivered_at AS "deliveredAt"`,
      [input.status, carrier, trackingNumber, trackingUrl, pickupLocationId, shipmentId]
    );

    const statusesResult = await client.query(
      'SELECT status FROM shipments WHERE order_id = $1',
      [shipment.orderId]
    );
    const statuses = statusesResult.rows.map((row) => row.status);
    let newOrderStatus = null;
    if (statuses.every((status) => status === 'delivered')) {
      newOrderStatus = 'delivered';
    } else if (statuses.every((status) => ['dispatched', 'in_transit', 'delivered'].includes(status))) {
      newOrderStatus = 'shipped';
    }

    if (newOrderStatus && order.rows[0].status !== newOrderStatus) {
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', [newOrderStatus, shipment.orderId]);
    }

    return {
      shipment: updatedShipment.rows[0],
      orderStatus: newOrderStatus || order.rows[0].status,
      orderNumber: order.rows[0].orderNumber,
      changed: shipment.status !== input.status ||
        carrier !== shipment.carrier ||
        trackingNumber !== shipment.trackingNumber ||
        trackingUrl !== shipment.trackingUrl ||
        pickupLocationId !== shipment.pickupLocationId
    };
  });
  if (result.changed) {
    await notifyOrder(result.orderNumber, {
      subject: `Delivery update for order ${result.orderNumber}`,
      message: `A seller updated your shipment to ${result.shipment.status.replace('_', ' ')}.${result.shipment.trackingNumber ? ` Tracking: ${result.shipment.carrier || 'Courier'} ${result.shipment.trackingNumber}.` : ''}`,
      audience: 'buyer'
    });
  }
  return result;
}

async function listPickupLocations(sellerId) {
  const { rows } = await db.query(
    `SELECT id, label, county, town, address_line AS "addressLine",
            contact_name AS "contactName", phone, instructions,
            is_default AS "isDefault", is_active AS "isActive"
     FROM seller_pickup_locations
     WHERE seller_id = $1 AND is_active = TRUE
     ORDER BY is_default DESC, label, id`,
    [sellerId]
  );
  return rows;
}

async function savePickupLocation(sellerId, input, pickupLocationId = null) {
  return db.withTransaction(async (client) => {
    let isDefault = Boolean(input.isDefault);
    let currentLocation = null;
    if (pickupLocationId) {
      const existing = await client.query(
        `SELECT * FROM seller_pickup_locations
         WHERE id = $1 AND seller_id = $2 AND is_active = TRUE
         FOR UPDATE`,
        [pickupLocationId, sellerId]
      );
      if (!existing.rowCount) throw notFound('Pickup location not found.');
      currentLocation = existing.rows[0];
      if (input.isDefault === undefined) isDefault = currentLocation.is_default;
    } else {
      const active = await client.query(
        'SELECT 1 FROM seller_pickup_locations WHERE seller_id = $1 AND is_active LIMIT 1',
        [sellerId]
      );
      if (!active.rowCount) isDefault = true;
    }

    if (isDefault) {
      await client.query(
        'UPDATE seller_pickup_locations SET is_default = FALSE WHERE seller_id = $1',
        [sellerId]
      );
    }

    const values = [
      sellerId,
      input.label ?? currentLocation?.label,
      input.county ?? currentLocation?.county,
      input.town ?? currentLocation?.town,
      input.addressLine ?? currentLocation?.address_line,
      input.contactName === undefined ? currentLocation?.contact_name || null : input.contactName || null,
      input.phone === undefined ? currentLocation?.phone || null : input.phone || null,
      input.instructions === undefined ? currentLocation?.instructions || null : input.instructions || null,
      isDefault
    ];
    const result = pickupLocationId
      ? await client.query(
          `UPDATE seller_pickup_locations
           SET label = $3, county = $4, town = $5, address_line = $6,
               contact_name = $7, phone = $8, instructions = $9, is_default = $10
           WHERE id = $2 AND seller_id = $1
           RETURNING id`,
          [sellerId, pickupLocationId, ...values.slice(1)]
        )
      : await client.query(
          `INSERT INTO seller_pickup_locations
             (seller_id, label, county, town, address_line, contact_name, phone, instructions, is_default)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           RETURNING id`,
          values
        );
    return result.rows[0].id;
  });
}

async function removePickupLocation(sellerId, pickupLocationId) {
  return db.withTransaction(async (client) => {
    const current = await client.query(
      `SELECT is_default AS "wasDefault" FROM seller_pickup_locations
       WHERE id = $1 AND seller_id = $2 AND is_active = TRUE FOR UPDATE`,
      [pickupLocationId, sellerId]
    );
    if (!current.rowCount) throw notFound('Pickup location not found.');
    const removed = await client.query(
      `UPDATE seller_pickup_locations
       SET is_active = FALSE, is_default = FALSE
       WHERE id = $1 AND seller_id = $2 AND is_active = TRUE
       RETURNING id`,
      [pickupLocationId, sellerId]
    );
    if (!removed.rowCount) throw notFound('Pickup location not found.');
    if (current.rows[0].wasDefault) {
      await client.query(
        `UPDATE seller_pickup_locations
         SET is_default = TRUE
         WHERE id = (
           SELECT id FROM seller_pickup_locations
           WHERE seller_id = $1 AND is_active = TRUE
           ORDER BY id LIMIT 1
         )`,
        [sellerId]
      );
    }
  });
}

async function getShopProfile(sellerId) {
  const { rows } = await db.query(
    `SELECT sp.id, sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
          sp.description, sp.logo_url AS "logoUrl", sp.banner_url AS "bannerUrl",
          sp.county, sp.town, sp.phone, sp.status,
          sp.delivery_fee AS "deliveryFee",
            sp.rejection_reason AS "rejectionReason",
            sp.created_at AS "createdAt", sp.approved_at AS "approvedAt",
            (SELECT COUNT(*)::int FROM products p WHERE p.seller_id = sp.user_id) AS "productCount",
            (SELECT COUNT(*)::int FROM products p
             WHERE p.seller_id = sp.user_id AND p.status = 'approved') AS "liveProductCount",
            (SELECT COUNT(DISTINCT o.id)::int FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             WHERE oi.seller_id = sp.user_id AND o.payment_status = 'paid') AS "orderCount",
            COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM reviews r
                      WHERE r.seller_id = sp.user_id), 0)::float AS "ratingAverage",
            (SELECT COUNT(*)::int FROM reviews r WHERE r.seller_id = sp.user_id) AS "reviewCount"
     FROM seller_profiles sp
     WHERE sp.user_id = $1`,
    [sellerId]
  );
  if (!rows[0]) throw notFound('Shop profile not found.');
  return rows[0];
}

async function updateShopProfile(sellerId, input) {
  const updates = [];
  const params = [];
  const set = (column, value) => {
    params.push(value);
    updates.push(`${column} = $${params.length}`);
  };
  if (input.description !== undefined) set('description', input.description || null);
  if (input.logoUrl !== undefined) set('logo_url', input.logoUrl || null);
  if (input.bannerUrl !== undefined) set('banner_url', input.bannerUrl || null);
  if (input.county !== undefined) set('county', input.county || null);
  if (input.town !== undefined) set('town', input.town || null);
  if (input.phone !== undefined) set('phone', input.phone || null);
  if (input.deliveryFee !== undefined) set('delivery_fee', input.deliveryFee);

  params.push(sellerId);
  const { rows } = await db.query(
    `UPDATE seller_profiles SET ${updates.join(', ')}
     WHERE user_id = $${params.length}
     RETURNING id`,
    params
  );
  if (!rows[0]) throw notFound('Shop profile not found.');
  return getShopProfile(sellerId);
}

async function getSales(sellerId) {
  const [summary, monthly, commissions] = await Promise.all([
    db.query(
      `SELECT
         COALESCE(SUM(gross_amount) FILTER (WHERE status <> 'refunded'), 0) AS "grossSales",
         COALESCE(SUM(commission_amount) FILTER (WHERE status <> 'refunded'), 0) AS "commissionTotal",
         COALESCE(SUM(seller_earnings) FILTER (WHERE status <> 'refunded'), 0) AS "lifetimeEarnings",
         COALESCE(SUM(seller_earnings) FILTER (WHERE status = 'earned'), 0) AS "availableBalance",
         COALESCE(SUM(seller_earnings) FILTER (WHERE status = 'paid'), 0) AS "paidOut",
         COUNT(*) FILTER (WHERE status <> 'refunded')::int AS "saleLines"
       FROM commissions WHERE seller_id = $1`,
      [sellerId]
    ),
    db.query(MONTHLY_SALES_SQL, [sellerId]),
    db.query(
      `SELECT c.id, c.created_at AS "createdAt", c.status, c.gross_amount AS "grossAmount",
              c.commission_amount AS "commissionAmount", c.seller_earnings AS "sellerEarnings",
              c.payout_reference AS "payoutReference", c.paid_at AS "paidAt",
              o.order_number AS "orderNumber", COALESCE(oi.product_name, 'Delivery fee') AS "productName",
              oi.quantity
       FROM commissions c
       JOIN orders o ON o.id = c.order_id
       LEFT JOIN order_items oi ON oi.id = c.order_item_id
       WHERE c.seller_id = $1
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT 100`,
      [sellerId]
    )
  ]);

  return {
    summary: summary.rows[0],
    monthlySales: monthly.rows,
    commissions: commissions.rows
  };
}

module.exports = {
  getOverview,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateStock,
  archiveProduct,
  addImage,
  setPrimaryImage,
  deleteImage,
  getOrders,
  updateShipment,
  listPickupLocations,
  savePickupLocation,
  removePickupLocation,
  getShopProfile,
  updateShopProfile,
  getSales
};
