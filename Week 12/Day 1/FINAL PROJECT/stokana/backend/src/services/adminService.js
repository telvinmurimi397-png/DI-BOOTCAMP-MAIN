const db = require('../config/db');
const settingsService = require('../services/settingsService');
const catalogueService = require('../services/catalogueService');
const { slugify } = require('../utils/slug');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { notifyOrder } = require('./orderNotificationService');

async function getOverview() {
  const [
    counts,
    revenue,
    recentOrders,
    topSellers,
    monthly
  ] = await Promise.all([
    db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM users WHERE role = 'buyer' AND is_active) AS buyers,
         (SELECT COUNT(*)::int FROM users WHERE role = 'seller' AND is_active) AS sellers,
         (SELECT COUNT(*)::int FROM seller_profiles WHERE status = 'pending') AS "pendingSellers",
         (SELECT COUNT(*)::int FROM products WHERE status = 'approved') AS "liveProducts",
         (SELECT COUNT(*)::int FROM products WHERE status = 'pending') AS "pendingProducts",
         (SELECT COUNT(*)::int FROM orders) AS "totalOrders",
         (SELECT COUNT(*)::int FROM orders WHERE status = 'pending_payment') AS "unpaidOrders",
         (SELECT COUNT(*)::int FROM orders WHERE payment_status = 'paid' AND status <> 'cancelled') AS "paidOrders"`
    ),
    db.query(
      `SELECT
         COALESCE((SELECT SUM(o.total - COALESCE((
                     SELECT SUM(f.amount) FROM refunds f WHERE f.order_id = o.id
                   ), 0))
                   FROM orders o
                   WHERE o.payment_status = 'paid' AND o.status <> 'cancelled'), 0) AS "grossRevenue",
         COALESCE((SELECT SUM(commission_amount) FROM commissions
                   WHERE status <> 'refunded'), 0) AS "commissionEarned",
         COALESCE((SELECT SUM(seller_earnings) FROM commissions WHERE status = 'earned'), 0) AS "pendingPayouts",
         COALESCE((SELECT SUM(seller_earnings) FROM commissions WHERE status = 'paid'), 0) AS "paidOut"`
    ),
    db.query(
      `SELECT o.id, o.order_number AS "orderNumber", o.status, o.payment_status AS "paymentStatus",
              o.total, o.created_at AS "createdAt", u.full_name AS "buyerName",
              (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS "itemCount"
       FROM orders o JOIN users u ON u.id = o.buyer_id
       ORDER BY o.created_at DESC, o.id DESC LIMIT 6`
    ),
    db.query(
      `SELECT u.id AS "sellerId", sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
              COALESCE(SUM(c.gross_amount) FILTER (WHERE c.status <> 'refunded'), 0) AS "grossSales",
              COALESCE(SUM(c.commission_amount) FILTER (WHERE c.status <> 'refunded'), 0) AS "commission",
              COUNT(DISTINCT c.order_id) FILTER (WHERE c.status <> 'refunded')::int AS "orders"
       FROM commissions c
       JOIN users u ON u.id = c.seller_id
       JOIN seller_profiles sp ON sp.user_id = u.id
       GROUP BY u.id, sp.shop_name, sp.shop_slug
       ORDER BY "grossSales" DESC
       LIMIT 5`
    ),
    db.query(
      `WITH months AS (
         SELECT date_trunc('month', now()) - (n || ' months')::interval AS month
         FROM generate_series(5, 0, -1) AS n
       )
       SELECT to_char(months.month, 'YYYY-MM') AS month,
              to_char(months.month, 'Mon') AS label,
              COALESCE(SUM(o.total - COALESCE((
                SELECT SUM(f.amount) FROM refunds f WHERE f.order_id = o.id
              ), 0)), 0) AS revenue,
              COALESCE(SUM((
                SELECT COALESCE(SUM(c.commission_amount), 0) FROM commissions c
                WHERE c.order_id = o.id AND c.status <> 'refunded'
              )), 0) AS commission
       FROM months
       LEFT JOIN orders o ON o.paid_at >= months.month
        AND o.paid_at < months.month + interval '1 month'
        AND o.payment_status = 'paid' AND o.status <> 'cancelled'
       GROUP BY months.month
       ORDER BY months.month`
    )
  ]);

  return {
    counts: counts.rows[0],
    revenue: revenue.rows[0],
    recentOrders: recentOrders.rows,
    topSellers: topSellers.rows,
    monthlyRevenue: monthly.rows
  };
}

async function listUsers({ role = 'all', q, page = 1, limit = 20 }) {
  const params = [];
  const where = ['1 = 1'];
  if (role !== 'all') {
    params.push(role);
    where.push(`u.role = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`(u.full_name ILIKE $${params.length} ESCAPE '\\' OR u.email ILIKE $${params.length} ESCAPE '\\')`);
  }
  const offset = (page - 1) * limit;

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM users u WHERE ${where.join(' AND ')}`,
    params
  );
  const { rows } = await db.query(
    `SELECT u.id, u.full_name AS "fullName", u.email, u.phone, u.role,
            u.is_active AS "isActive", u.email_verified AS "emailVerified",
            u.phone_verified AS "phoneVerified", u.created_at AS "createdAt", u.last_login_at AS "lastLoginAt",
            sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
            sp.status AS "sellerStatus",
            (SELECT COUNT(*)::int FROM orders o WHERE o.buyer_id = u.id) AS "orderCount"
     FROM users u
     LEFT JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE ${where.join(' AND ')}
     ORDER BY u.created_at DESC, u.id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const total = countResult.rows[0].total;
  return {
    users: rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function setUserActive(adminId, userId, isActive) {
  if (Number(adminId) === Number(userId)) {
    throw badRequest('You cannot deactivate your own account.');
  }
  const { rows } = await db.query('SELECT id, full_name AS "fullName", role FROM users WHERE id = $1', [userId]);
  const user = rows[0];
  if (!user) throw notFound('User not found.');
  if (user.role === 'admin') throw conflict('Admin accounts cannot be deactivated from this screen.');

  await db.withTransaction(async (client) => {
    await client.query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, userId]);
    if (!isActive) {
      await client.query(
        `DELETE FROM "session" WHERE (sess->>'userId')::bigint = $1`,
        [userId]
      );
    }
  });
  return { ...user, isActive };
}

async function listSellers({ status = 'all', q, page = 1, limit = 20 }) {
  const params = [];
  const where = ['1 = 1'];
  if (status !== 'all') {
    params.push(status);
    where.push(`sp.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`(sp.shop_name ILIKE $${params.length} ESCAPE '\\' OR u.full_name ILIKE $${params.length} ESCAPE '\\' OR u.email ILIKE $${params.length} ESCAPE '\\')`);
  }
  const offset = (page - 1) * limit;

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM seller_profiles sp
     JOIN users u ON u.id = sp.user_id
     WHERE ${where.join(' AND ')}`,
    params
  );
  const { rows } = await db.query(
    `SELECT sp.id, sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug", sp.description,
            sp.logo_url AS "logoUrl", sp.banner_url AS "bannerUrl", sp.county, sp.town, sp.phone,
            sp.status, sp.rejection_reason AS "rejectionReason", sp.created_at AS "createdAt",
            sp.approved_at AS "approvedAt", sp.is_featured AS "isFeatured",
            u.id AS "userId", u.full_name AS "ownerName", u.email, u.phone AS "ownerPhone",
            (SELECT COUNT(*)::int FROM products p WHERE p.seller_id = u.id) AS "productCount",
            (SELECT COUNT(DISTINCT oi.order_id)::int FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.seller_id = u.id AND o.payment_status = 'paid') AS "orderCount",
            COALESCE((SELECT SUM(c.gross_amount) FROM commissions c
                      WHERE c.seller_id = u.id AND c.status <> 'refunded'), 0) AS "grossSales"
     FROM seller_profiles sp
     JOIN users u ON u.id = sp.user_id
     WHERE ${where.join(' AND ')}
     ORDER BY CASE sp.status WHEN 'pending' THEN 0 ELSE 1 END,
              sp.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const total = countResult.rows[0].total;
  return {
    sellers: rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function reviewSeller(adminId, sellerProfileId, { action, reason }) {
  const { rows } = await db.query(
    `SELECT sp.id, sp.user_id AS "userId", sp.status, sp.shop_name AS "shopName"
     FROM seller_profiles sp WHERE sp.id = $1`,
    [sellerProfileId]
  );
  const seller = rows[0];
  if (!seller) throw notFound('Seller not found.');

  if (action === 'approve') {
    const { rows: updated } = await db.query(
      `UPDATE seller_profiles
       SET status = 'approved', rejection_reason = NULL, approved_at = now(), approved_by = $2
       WHERE id = $1
       RETURNING id, shop_name AS "shopName", status`,
      [sellerProfileId, adminId]
    );
    return updated[0];
  }

  const newStatus = action === 'reject' ? 'rejected' : 'suspended';
  const { rows: updated } = await db.query(
    `UPDATE seller_profiles
     SET status = $1, rejection_reason = $2,
         approved_at = CASE WHEN $1 = 'suspended' THEN approved_at ELSE NULL END
     WHERE id = $3
     RETURNING id, shop_name AS "shopName", status, rejection_reason AS "rejectionReason"`,
    [newStatus, reason, sellerProfileId]
  );
  return updated[0];
}

async function setSellerFeatured(sellerProfileId, isFeatured) {
  const { rows } = await db.query(
    `UPDATE seller_profiles
     SET is_featured = $2
     WHERE id = $1 AND status = 'approved'
     RETURNING id, shop_name AS "shopName", is_featured AS "isFeatured"`,
    [sellerProfileId, isFeatured]
  );
  if (!rows[0]) throw conflict('Only approved shops can be featured.');
  return rows[0];
}

async function setProductFeatured(productId, isFeatured) {
  const { rows } = await db.query(
    `UPDATE products p SET is_featured = $2
     FROM seller_profiles sp
     WHERE p.id = $1 AND sp.user_id = p.seller_id
       AND p.status = 'approved' AND sp.status = 'approved'
     RETURNING p.id, p.name, p.is_featured AS "isFeatured"`,
    [productId, isFeatured]
  );
  if (!rows[0]) throw conflict('Only approved products from approved shops can be featured.');
  return rows[0];
}

async function listProducts({ status = 'pending', q, page = 1, limit = 20 }) {
  const params = [];
  const where = ['1 = 1'];
  if (status !== 'all') {
    params.push(status);
    where.push(`p.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`(p.name ILIKE $${params.length} ESCAPE '\\' OR sp.shop_name ILIKE $${params.length} ESCAPE '\\')`);
  }
  const offset = (page - 1) * limit;

  const [countResult, countsResult, listResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total
       FROM products p
       JOIN users u ON u.id = p.seller_id
       JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE ${where.join(' AND ')}`,
      params
    ),
    db.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
              COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
       FROM products`
    ),
    db.query(
      `SELECT p.id, p.name, p.slug, p.price, p.stock, p.status, p.condition,
              p.is_featured AS "isFeatured",
              p.rejection_reason AS "rejectionReason", p.created_at AS "createdAt",
              p.description,
              c.name AS "categoryName", c.slug AS "categorySlug",
              u.id AS "sellerId", u.full_name AS "sellerName", u.email AS "sellerEmail",
              sp.id AS "sellerProfileId", sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
              sp.status AS "sellerStatus",
              COALESCE((
                SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url))
                FROM product_images pi WHERE pi.product_id = p.id
              ), '[]'::json) AS images
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN users u ON u.id = p.seller_id
       JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE ${where.join(' AND ')}
       ORDER BY CASE p.status WHEN 'pending' THEN 0 ELSE 1 END,
                p.created_at ASC, p.id ASC
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

async function reviewProduct(adminId, productId, { action, reason }) {
  const { rows } = await db.query(
    `SELECT p.id, p.name, p.status, p.seller_id AS "sellerId",
            sp.status AS "sellerStatus", c.is_active AS "categoryActive"
     FROM products p
     JOIN users u ON u.id = p.seller_id
     LEFT JOIN seller_profiles sp ON sp.user_id = p.seller_id
     JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [productId]
  );
  const product = rows[0];
  if (!product) throw notFound('Product not found.');

  if (action === 'approve') {
    if (product.sellerStatus !== 'approved') {
      throw conflict('Approve the seller shop before approving their products.');
    }
    if (!product.categoryActive) {
      throw conflict('Reactivate the product category before approving this product.');
    }
    const { rows: updated } = await db.query(
      `UPDATE products
       SET status = 'approved', rejection_reason = NULL, approved_at = now(), approved_by = $2
       WHERE id = $1
       RETURNING id, name, status, approved_at AS "approvedAt"`,
      [productId, adminId]
    );
    return updated[0];
  }

  const newStatus = action === 'reject' ? 'rejected' : 'archived';
  const { rows: updated } = await db.query(
    `UPDATE products
     SET status = $1, rejection_reason = $2,
         approved_at = CASE WHEN $1 = 'archived' THEN approved_at ELSE NULL END
     WHERE id = $3
     RETURNING id, name, status, rejection_reason AS "rejectionReason"`,
    [newStatus, reason || null, productId]
  );
  return updated[0];
}

async function listCategories() {
  return catalogueService.listCategories({ includeInactive: true });
}

async function createCategory(input) {
  const slug = slugify(input.name);
  if (input.parentCategoryId != null) {
    const parent = await db.query(
      'SELECT id FROM categories WHERE id = $1 AND parent_category_id IS NULL AND is_active = TRUE',
      [input.parentCategoryId]
    );
    if (!parent.rowCount) throw badRequest('Choose a top-level category as the parent.');
  }
  const exists = await db.query(
    'SELECT 1 FROM categories WHERE slug = $1 OR lower(name) = lower($2)',
    [slug, input.name]
  );
  if (exists.rowCount) throw conflict('A category with that name already exists.');

  const { rows } = await db.query(
    `INSERT INTO categories
       (name, slug, description, icon, image_url, parent_category_id, sort_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, name, slug, description, icon, image_url AS "imageUrl",
               parent_category_id AS "parentCategoryId",
               sort_order AS "sortOrder", is_active AS "isActive"`,
    [
      input.name,
      slug,
      input.description || null,
      input.icon || null,
      input.imageUrl || null,
      input.parentCategoryId || null,
      input.sortOrder || 0,
      input.isActive !== false
    ]
  );
  return rows[0];
}

async function updateCategory(categoryId, input) {
  if (input.isActive === true) {
    const categoryParent = await db.query(
      'SELECT parent_category_id AS "parentCategoryId" FROM categories WHERE id = $1',
      [categoryId]
    );
    if (!categoryParent.rowCount) throw notFound('Category not found.');
    if (categoryParent.rows[0].parentCategoryId != null) {
      const activeParent = await db.query(
        'SELECT 1 FROM categories WHERE id = $1 AND is_active = TRUE',
        [categoryParent.rows[0].parentCategoryId]
      );
      if (!activeParent.rowCount) throw badRequest('Reactivate the parent category first.');
    }
  }
  if (input.parentCategoryId !== undefined && input.parentCategoryId != null) {
    if (Number(input.parentCategoryId) === Number(categoryId)) {
      throw badRequest('A category cannot be its own parent.');
    }
    const [parent, children] = await Promise.all([
      db.query(
        'SELECT id FROM categories WHERE id = $1 AND parent_category_id IS NULL AND is_active = TRUE',
        [input.parentCategoryId]
      ),
      db.query('SELECT 1 FROM categories WHERE parent_category_id = $1 LIMIT 1', [categoryId])
    ]);
    if (!parent.rowCount) throw badRequest('Choose a top-level category as the parent.');
    if (children.rowCount) throw badRequest('A category with subcategories cannot become a subcategory.');
  }
  const updates = [];
  const params = [];
  const set = (column, value) => {
    params.push(value);
    updates.push(`${column} = $${params.length}`);
  };
  if (input.name !== undefined) set('name', input.name);
  if (input.description !== undefined) set('description', input.description || null);
  if (input.icon !== undefined) set('icon', input.icon || null);
  if (input.imageUrl !== undefined) set('image_url', input.imageUrl || null);
  if (input.parentCategoryId !== undefined) set('parent_category_id', input.parentCategoryId);
  if (input.sortOrder !== undefined) set('sort_order', input.sortOrder);
  if (input.isActive !== undefined) set('is_active', input.isActive);
  if (!updates.length) throw badRequest('Nothing to update.');

  params.push(categoryId);
  return db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${params.length}
       RETURNING id, name, slug, description, icon, image_url AS "imageUrl",
                 parent_category_id AS "parentCategoryId",
                 sort_order AS "sortOrder", is_active AS "isActive"`,
      params
    );
    if (!rows[0]) throw notFound('Category not found.');
    if (input.isActive === false) {
      await client.query('UPDATE categories SET is_active = FALSE WHERE parent_category_id = $1', [categoryId]);
    }
    return rows[0];
  });
}

async function deactivateCategory(categoryId) {
  const { rows } = await db.query(
    `WITH updated AS (
       UPDATE categories SET is_active = FALSE
       WHERE id = $1 OR parent_category_id = $1
       RETURNING id, name, is_active
     )
     SELECT id, name, is_active AS "isActive" FROM updated WHERE id = $1`,
    [categoryId]
  );
  if (!rows[0]) throw notFound('Category not found.');
  return rows[0];
}

async function listOrders({ status = 'all', q, page = 1, limit = 20 }) {
  const params = [];
  const where = ['1 = 1'];
  if (status !== 'all') {
    params.push(status);
    where.push(`o.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    where.push(`(o.order_number ILIKE $${params.length} ESCAPE '\\' OR u.full_name ILIKE $${params.length} ESCAPE '\\' OR u.email ILIKE $${params.length} ESCAPE '\\')`);
  }
  const offset = (page - 1) * limit;

  const [countResult, summaryResult, listResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total FROM orders o JOIN users u ON u.id = o.buyer_id
       WHERE ${where.join(' AND ')}`,
      params
    ),
    db.query(
      `SELECT
         COUNT(*)::int AS "totalOrders",
         COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
         COUNT(*) FILTER (WHERE status = 'pending_payment')::int AS unpaid,
         COALESCE(SUM(total - COALESCE((
           SELECT SUM(f.amount) FROM refunds f WHERE f.order_id = orders.id
         ), 0)) FILTER (WHERE payment_status IN ('paid', 'refunded') AND status <> 'cancelled'), 0) AS "paidValue"
       FROM orders`
    ),
    db.query(
      `SELECT o.id, o.order_number AS "orderNumber", o.status, o.payment_status AS "paymentStatus",
              o.subtotal, o.shipping_fee AS "shippingFee", o.total,
              o.shipping_name AS "shippingName", o.shipping_phone AS "shippingPhone",
              o.shipping_county AS "shippingCounty", o.shipping_town AS "shippingTown",
              o.created_at AS "createdAt", o.paid_at AS "paidAt",
              u.full_name AS "buyerName", u.email AS "buyerEmail",
              (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS "itemCount",
              (SELECT json_agg(DISTINCT s.status) FROM shipments s WHERE s.order_id = o.id) AS "shipmentStatuses",
              (SELECT STRING_AGG(DISTINCT sp.shop_name, ', ') FROM order_items oi
               JOIN seller_profiles sp ON sp.user_id = oi.seller_id WHERE oi.order_id = o.id) AS sellers
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
       WHERE ${where.join(' AND ')}
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )
  ]);

  const total = countResult.rows[0].total;
  return {
    orders: listResult.rows,
    summary: summaryResult.rows[0],
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function updateOrderStatus(orderId, status) {
  const result = await db.withTransaction(async (client) => {
    const orderResult = await client.query(
      `SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus"
       FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );
    const order = orderResult.rows[0];
    if (!order) throw notFound('Order not found.');
    if (order.status === 'cancelled') throw conflict('Cancelled orders cannot be updated.');

    if (status === 'cancelled') {
      if (order.paymentStatus === 'paid') {
        throw conflict('Paid orders cannot be cancelled here. A refund must be processed first.');
      }
      await client.query(
        `UPDATE products p SET stock = p.stock + oi.quantity
         FROM order_items oi
         WHERE oi.order_id = $1 AND p.id = oi.product_id
           AND oi.variant_id IS NULL AND oi.variant_sku IS NULL`,
        [order.id]
      );
      await client.query(
        `UPDATE product_variants pv SET stock = pv.stock + oi.quantity
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
        `UPDATE payments SET status = 'failed', failure_reason = 'Order cancelled by administrator'
         WHERE order_id = $1 AND status = 'pending'`,
        [order.id]
      );
      await client.query('UPDATE orders SET status = $1, cancelled_at = now() WHERE id = $2', [
        status,
        order.id
      ]);
      return { ...order, status };
    }

    if (order.paymentStatus !== 'paid') {
      throw conflict('Only paid orders can move into fulfilment.');
    }
    if (['shipped', 'delivered'].includes(status)) {
      const cancellation = await client.query(
        `SELECT 1 FROM order_adjustment_requests
         WHERE order_id = $1 AND request_type = 'cancellation'
           AND status IN ('pending', 'approved') LIMIT 1`,
        [order.id]
      );
      if (cancellation.rowCount) {
        throw conflict('Fulfilment is paused while a cancellation request is being reviewed.');
      }
    }

    if (status === 'shipped') {
      await client.query(
        `UPDATE shipments SET status = CASE WHEN status = 'pending' THEN 'dispatched' ELSE status END,
                              shipped_at = CASE WHEN shipped_at IS NULL THEN now() ELSE shipped_at END
         WHERE order_id = $1 AND status IN ('pending', 'dispatched')`,
        [order.id]
      );
    }
    if (status === 'delivered') {
      await client.query(
        `UPDATE shipments SET status = 'delivered',
                              delivered_at = COALESCE(delivered_at, now()),
                              shipped_at = COALESCE(shipped_at, now())
         WHERE order_id = $1`,
        [order.id]
      );
    }

    await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, order.id]);
    return { ...order, status };
  });
  if (status === 'cancelled') {
    await notifyOrder(result.orderNumber, {
      subject: 'Your STOKANA order was cancelled',
      message: 'An administrator cancelled your unpaid order and released its reserved stock.',
      audience: 'buyer'
    });
  }
  return result;
}

function defaultRange(from, to) {
  if (from && to) return { from, to };
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return { from: from || start, to: to || end };
}

async function getReports({ from, to }) {
  const range = defaultRange(from, to);
  const days = Math.round(
    (new Date(`${range.to}T00:00:00Z`) - new Date(`${range.from}T00:00:00Z`)) / 86_400_000
  ) + 1;
  if (days > 366) throw badRequest('Choose a reporting period of 366 days or fewer.');

  const baseWhere = `o.payment_status = 'paid' AND o.status <> 'cancelled'
                     AND o.paid_at >= $1::date AND o.paid_at < ($2::date + interval '1 day')`;

  const [
    summary,
    daily,
    topProducts,
    topSellers,
    topCategories,
    deliveryPerformance,
    deliveryProviders
  ] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS "orders",
              COALESCE(SUM(o.total - COALESCE((
                SELECT SUM(f.amount) FROM refunds f WHERE f.order_id = o.id
              ), 0)), 0) AS "grossSales",
              COALESCE(SUM((
                SELECT COALESCE(SUM(c.commission_amount), 0) FROM commissions c
                WHERE c.order_id = o.id AND c.status <> 'refunded'
              )), 0) AS "commission",
              COALESCE(SUM((
                SELECT COALESCE(SUM(c.seller_earnings), 0) FROM commissions c
                WHERE c.order_id = o.id AND c.status <> 'refunded'
              )), 0) AS "sellerEarnings",
              COALESCE(ROUND(AVG(o.total - COALESCE((
                SELECT SUM(f.amount) FROM refunds f WHERE f.order_id = o.id
              ), 0)), 2), 0) AS "averageOrderValue"
       FROM orders o WHERE ${baseWhere}`,
      [range.from, range.to]
    ),
    db.query(
      `WITH days AS (
         SELECT generate_series($1::date, $2::date, '1 day')::date AS day
       ),
       agg AS (
         SELECT o.paid_at::date AS day, COUNT(*) AS orders,
                SUM(o.total - COALESCE((
                  SELECT SUM(f.amount) FROM refunds f WHERE f.order_id = o.id
                ), 0)) AS gross
         FROM orders o WHERE ${baseWhere} GROUP BY o.paid_at::date
       )
       SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
              COALESCE(agg.orders, 0)::int AS orders,
              COALESCE(agg.gross, 0) AS gross
       FROM days LEFT JOIN agg ON agg.day = days.day
       ORDER BY days.day ASC`,
      [range.from, range.to]
    ),
    db.query(
      `SELECT oi.product_name AS "productName",
              SUM(GREATEST(oi.quantity - COALESCE(refunded.quantity, 0), 0))::int AS units,
              SUM(oi.unit_price * GREATEST(oi.quantity - COALESCE(refunded.quantity, 0), 0)) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       LEFT JOIN LATERAL (
         SELECT SUM(r.quantity)::int AS quantity
         FROM order_adjustment_requests r
         JOIN refunds f ON f.request_id = r.id
         WHERE r.order_item_id = oi.id
       ) refunded ON TRUE
       WHERE ${baseWhere}
       GROUP BY oi.product_name
       ORDER BY revenue DESC LIMIT 5`,
      [range.from, range.to]
    ),
    db.query(
      `SELECT sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
              SUM(oi.unit_price * GREATEST(oi.quantity - COALESCE(refunded.quantity, 0), 0)) AS revenue,
              SUM(COALESCE(cm.commission_amount, 0)) AS commission,
              COUNT(DISTINCT o.id)::int AS orders
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN seller_profiles sp ON sp.user_id = oi.seller_id
       LEFT JOIN commissions cm ON cm.order_item_id = oi.id AND cm.status <> 'refunded'
       LEFT JOIN LATERAL (
         SELECT SUM(r.quantity)::int AS quantity
         FROM order_adjustment_requests r
         JOIN refunds f ON f.request_id = r.id
         WHERE r.order_item_id = oi.id
       ) refunded ON TRUE
       WHERE ${baseWhere}
       GROUP BY sp.shop_name, sp.shop_slug
       ORDER BY revenue DESC LIMIT 5`,
      [range.from, range.to]
    ),
    db.query(
      `SELECT c.name AS "categoryName",
              SUM(GREATEST(oi.quantity - COALESCE(refunded.quantity, 0), 0))::int AS units,
              SUM(oi.unit_price * GREATEST(oi.quantity - COALESCE(refunded.quantity, 0), 0)) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN LATERAL (
         SELECT SUM(r.quantity)::int AS quantity
         FROM order_adjustment_requests r
         JOIN refunds f ON f.request_id = r.id
         WHERE r.order_item_id = oi.id
       ) refunded ON TRUE
       WHERE ${baseWhere}
       GROUP BY c.name
       ORDER BY revenue DESC LIMIT 5`,
      [range.from, range.to]
    ),
    db.query(
      `SELECT COUNT(*)::int AS "totalShipments",
              COUNT(*) FILTER (WHERE s.status = 'delivered')::int AS delivered,
              COUNT(*) FILTER (WHERE s.status = 'failed')::int AS failed,
              COUNT(*) FILTER (WHERE s.status IN ('dispatched', 'in_transit'))::int AS inTransit,
              COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (s.delivered_at - s.shipped_at)) / 86400)
                FILTER (WHERE s.status = 'delivered' AND s.shipped_at IS NOT NULL), 2), 0)
                AS "averageDeliveryDays",
              COUNT(*) FILTER (
                WHERE s.status = 'delivered' AND s.buyer_confirmed_at IS NOT NULL
              )::int AS "buyerConfirmed",
              COUNT(*) FILTER (
                WHERE s.status = 'delivered' AND s.buyer_confirmed_at IS NULL
              )::int AS "awaitingBuyerConfirmation"
       FROM shipments s
       JOIN orders o ON o.id = s.order_id
       WHERE ${baseWhere}`,
      [range.from, range.to]
    ),
    db.query(
      `SELECT COALESCE(NULLIF(s.carrier, ''), 'Courier not recorded') AS "carrier",
              COUNT(*)::int AS shipments,
              COUNT(*) FILTER (WHERE s.status = 'delivered')::int AS delivered,
              COUNT(*) FILTER (WHERE s.status = 'failed')::int AS failed,
              COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (s.delivered_at - s.shipped_at)) / 86400)
                FILTER (WHERE s.status = 'delivered' AND s.shipped_at IS NOT NULL), 2), 0)
                AS "averageDeliveryDays"
       FROM shipments s
       JOIN orders o ON o.id = s.order_id
       WHERE ${baseWhere}
       GROUP BY COALESCE(NULLIF(s.carrier, ''), 'Courier not recorded')
       ORDER BY shipments DESC, "carrier" ASC
       LIMIT 10`,
      [range.from, range.to]
    )
  ]);

  return {
    range,
    summary: summary.rows[0],
    daily: daily.rows,
    topProducts: topProducts.rows,
    topSellers: topSellers.rows,
    topCategories: topCategories.rows,
    deliveryPerformance: deliveryPerformance.rows[0],
    deliveryProviders: deliveryProviders.rows
  };
}

async function getCommissions(status = 'all') {
  const params = [];
  const where = ['1 = 1'];
  if (status !== 'all') {
    params.push(status);
    where.push(`c.status = $${params.length}`);
  }

  const [totals, sellers, recent] = await Promise.all([
    db.query(
      `SELECT
         COALESCE(SUM(commission_amount) FILTER (WHERE status <> 'refunded'), 0) AS "platformCommission",
         COALESCE(SUM(seller_earnings) FILTER (WHERE status <> 'refunded'), 0) AS "sellerEarnings",
         COALESCE(SUM(seller_earnings) FILTER (WHERE status = 'earned'), 0) AS "availableBalance",
         COALESCE(SUM(seller_earnings) FILTER (WHERE status = 'paid'), 0) AS "paidOut"
       FROM commissions`
    ),
    db.query(
      `SELECT u.id AS "sellerId", sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
              u.email,
              COALESCE(SUM(c.gross_amount), 0) AS "grossSales",
              COALESCE(SUM(c.commission_amount) FILTER (WHERE c.status <> 'refunded'), 0) AS "platformCommission",
              COALESCE(SUM(c.seller_earnings) FILTER (WHERE c.status <> 'refunded'), 0) AS "lifetimeEarnings",
              COALESCE(SUM(c.seller_earnings) FILTER (WHERE c.status = 'earned'), 0) AS "availableBalance",
              COALESCE(SUM(c.seller_earnings) FILTER (WHERE c.status = 'paid'), 0) AS "paidOut",
              MAX(c.paid_at) AS "lastPayoutAt"
       FROM commissions c
       JOIN users u ON u.id = c.seller_id
       JOIN seller_profiles sp ON sp.user_id = u.id
       GROUP BY u.id, sp.shop_name, sp.shop_slug, u.email
       ORDER BY "availableBalance" DESC, "grossSales" DESC`
    ),
    db.query(
      `SELECT c.id, c.created_at AS "createdAt", c.status, c.gross_amount AS "grossAmount",
              c.commission_amount AS "commissionAmount", c.seller_earnings AS "sellerEarnings",
              c.payout_reference AS "payoutReference", c.paid_at AS "paidAt",
              o.order_number AS "orderNumber", oi.product_name AS "productName",
              sp.shop_name AS "shopName"
       FROM commissions c
       JOIN orders o ON o.id = c.order_id
       JOIN order_items oi ON oi.id = c.order_item_id
       JOIN seller_profiles sp ON sp.user_id = c.seller_id
       WHERE ${where.join(' AND ')}
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT 30`,
      params
    )
  ]);

  return {
    totals: totals.rows[0],
    sellers: sellers.rows,
    recent: recent.rows
  };
}

async function getPaymentReconciliation({ status = 'all', page = 1, limit = 30 } = {}) {
  const params = [];
  const where = [];
  if (status !== 'all') {
    params.push(status);
    where.push(`p.status = $${params.length}`);
  }
  const offset = (page - 1) * limit;
  const count = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM payments p
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
    params
  );
  const [summary, rows] = await Promise.all([
    db.query(
      `WITH payment_checks AS (
         SELECT p.id, p.status, p.amount, o.total AS "orderTotal",
                p.provider, p.transaction_ref AS "transactionRef",
                o.payment_status AS "paymentStatus",
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS "itemCount",
                (SELECT COUNT(*) FROM commissions c WHERE c.order_id = o.id) AS "commissionCount"
         FROM payments p
         JOIN orders o ON o.id = p.order_id
       )
       SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
              COUNT(*) FILTER (WHERE status = 'success')::int AS successful,
              COUNT(*) FILTER (
                WHERE status = 'success' AND (
                  amount <> "orderTotal"
                  OR "paymentStatus" NOT IN ('paid', 'refunded')
                  OR "commissionCount" < "itemCount"
                  OR (provider = 'mpesa' AND "transactionRef" IS NULL)
                )
              )::int AS "paymentMismatches",
              (SELECT COUNT(*)::int FROM orders o
               WHERE o.payment_status IN ('paid', 'refunded')
                 AND NOT EXISTS (
                   SELECT 1 FROM payments p
                   WHERE p.order_id = o.id AND p.status = 'success'
                 )) AS "paidOrdersWithoutPayment",
              COALESCE((SELECT SUM(amount) FROM refunds), 0) AS "refundedAmount"
       FROM payment_checks`
    ),
    db.query(
      `WITH payment_rows AS (
         SELECT p.id, p.provider, p.provider_ref AS "providerRef",
                p.transaction_ref AS "transactionRef", p.amount, p.status,
                p.failure_reason AS "failureReason", p.verified_at AS "verifiedAt",
                p.created_at AS "createdAt", o.order_number AS "orderNumber",
                o.total AS "orderTotal", o.payment_status AS "paymentStatus",
                buyer.full_name AS "buyerName", buyer.email AS "buyerEmail",
                (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS "itemCount",
                (SELECT COUNT(*)::int FROM commissions c WHERE c.order_id = o.id) AS "commissionCount",
                COALESCE((SELECT SUM(f.amount) FROM refunds f WHERE f.order_id = o.id), 0) AS "refundedAmount",
                COALESCE((
                  SELECT STRING_AGG(f.provider_reference, ', ' ORDER BY f.created_at)
                  FROM refunds f WHERE f.order_id = o.id
                ), '') AS "refundReferences"
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         JOIN users buyer ON buyer.id = o.buyer_id
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       )
       SELECT *,
              CASE
                WHEN status = 'success' AND (
                  amount <> "orderTotal"
                  OR "paymentStatus" NOT IN ('paid', 'refunded')
                  OR "commissionCount" < "itemCount"
                  OR (provider = 'mpesa' AND "transactionRef" IS NULL)
                ) THEN 'mismatch'
                WHEN status = 'success' THEN 'matched'
                ELSE status
              END AS "reconciliationStatus"
       FROM payment_rows
       ORDER BY "createdAt" DESC, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )
  ]);
  return {
    summary: summary.rows[0],
    payments: rows.rows,
    pagination: {
      page,
      limit,
      total: count.rows[0].total,
      totalPages: Math.max(1, Math.ceil(count.rows[0].total / limit))
    }
  };
}

async function paySeller(sellerId, reference) {
  return db.withTransaction(async (client) => {
    const existingRef = await client.query(
      'SELECT 1 FROM commissions WHERE payout_reference = $1 LIMIT 1',
      [reference]
    );
    if (existingRef.rowCount) throw conflict('That payout reference has already been used.');

    const earned = await client.query(
      `SELECT id, seller_earnings AS amount
       FROM commissions
       WHERE seller_id = $1 AND status = 'earned'
       FOR UPDATE`,
      [sellerId]
    );
    if (!earned.rows.length) throw conflict('This seller has no unpaid earnings.');

    const amount = earned.rows.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2);

    await client.query(
      `UPDATE commissions
       SET status = 'paid', paid_at = now(), payout_reference = $2
       WHERE seller_id = $1 AND status = 'earned'`,
      [sellerId, reference]
    );

    return { count: earned.rows.length, amount, reference };
  });
}

async function getSettings() {
  const settings = await settingsService.getSettings();
  return settings;
}

async function updateSettings(input) {
  if (input.commissionRate !== undefined) {
    await settingsService.setSetting('platform_commission_rate', input.commissionRate.toFixed(4));
  }
  if (input.shippingFee !== undefined) {
    await settingsService.setSetting('shipping_fee', input.shippingFee);
  }
  if (input.freeShippingThreshold !== undefined) {
    await settingsService.setSetting('free_shipping_threshold', input.freeShippingThreshold);
  }
  return settingsService.getSettings();
}

module.exports = {
  getOverview,
  listUsers,
  setUserActive,
  listSellers,
  reviewSeller,
  setSellerFeatured,
  setProductFeatured,
  listProducts,
  reviewProduct,
  listCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
  listOrders,
  updateOrderStatus,
  getReports,
  getCommissions,
  getPaymentReconciliation,
  paySeller,
  getSettings,
  updateSettings
};
