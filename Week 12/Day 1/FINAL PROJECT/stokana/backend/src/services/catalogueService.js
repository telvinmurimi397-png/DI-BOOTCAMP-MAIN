const db = require('../config/db');
const promotionService = require('./promotionService');

const PRODUCT_BASE_PRICE = `COALESCE((
  SELECT MIN(COALESCE(pv.price, p.price))
  FROM product_variants pv WHERE pv.product_id = p.id
), p.price)`;
const PRODUCT_PRICE_SQL = `COALESCE((
  SELECT MIN(${promotionService.activePriceExpression('p', 'COALESCE(pv.price, p.price)')})
  FROM product_variants pv WHERE pv.product_id = p.id
), ${promotionService.activePriceExpression('p', 'p.price')})`;
const PRODUCT_ACTIVE_PRICE = promotionService.activePriceExpression('p', 'p.price');
const PRODUCT_COMPARE_PRICE = `CASE
  WHEN (${PRODUCT_PRICE_SQL}) < (${PRODUCT_BASE_PRICE})
    THEN GREATEST(COALESCE(p.compare_at_price, ${PRODUCT_BASE_PRICE}), ${PRODUCT_BASE_PRICE})
  ELSE p.compare_at_price
END`;

const PRODUCT_CARD_SELECT = `
  SELECT
    p.id,
    p.name,
    p.slug,
    ${PRODUCT_PRICE_SQL} AS price,
    ${PRODUCT_COMPARE_PRICE} AS "compareAtPrice",
    p.stock,
    p.condition,
    EXISTS (SELECT 1 FROM product_variants options WHERE options.product_id = p.id) AS "hasVariants",
    p.is_featured AS "isFeatured",
    p.views_count AS "viewsCount",
    p.created_at AS "createdAt",
    c.id AS "categoryId",
    c.name AS "categoryName",
    c.slug AS "categorySlug",
    c.parent_category_id AS "parentCategoryId",
    u.id AS "sellerId",
    sp.shop_name AS "shopName",
    sp.shop_slug AS "shopSlug",
    sp.county AS "shopCounty",
    COALESCE(pi.url, '/assets/placeholder.svg') AS "imageUrl",
    COALESCE(r.rating_average, 0)::float AS "ratingAverage",
    COALESCE(r.rating_count, 0)::int AS "ratingCount"
  FROM products p
  JOIN categories c ON c.id = p.category_id AND c.is_active = TRUE
  JOIN users u ON u.id = p.seller_id AND u.is_active = TRUE
  JOIN seller_profiles sp ON sp.user_id = u.id AND sp.status = 'approved'
  LEFT JOIN LATERAL (
    SELECT url
    FROM product_images
    WHERE product_id = p.id
    ORDER BY is_primary DESC, sort_order ASC, id ASC
    LIMIT 1
  ) pi ON TRUE
  LEFT JOIN LATERAL (
    SELECT AVG(rating)::numeric(3,2) AS rating_average, COUNT(*) AS rating_count
    FROM reviews
    WHERE product_id = p.id
  ) r ON TRUE
`;

const PRODUCT_COUNT_FROM = `
  FROM products p
  JOIN categories c ON c.id = p.category_id AND c.is_active = TRUE
  JOIN users u ON u.id = p.seller_id AND u.is_active = TRUE
  JOIN seller_profiles sp ON sp.user_id = u.id AND sp.status = 'approved'
`;

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function buildProductFilters(filters, params) {
  const where = ["p.status = 'approved'"];
  let searchParam = null;
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (filters.q) {
    const term = add(`%${escapeLike(filters.q)}%`);
    searchParam = params.length;
    where.push(`(p.name ILIKE ${term} ESCAPE '\\' OR p.description ILIKE ${term} ESCAPE '\\' OR c.name ILIKE ${term} ESCAPE '\\' OR sp.shop_name ILIKE ${term} ESCAPE '\\')`);
  }
  if (filters.category) {
    const categoryParam = add(filters.category);
    where.push(`(c.slug = ${categoryParam} OR c.parent_category_id = (SELECT id FROM categories WHERE slug = ${categoryParam}))`);
  }
  if (filters.shop) where.push(`sp.shop_slug = ${add(filters.shop)}`);
  if (filters.seller) where.push(`sp.shop_name ILIKE ${add(`%${escapeLike(filters.seller)}%`)} ESCAPE '\\'`);
  if (filters.location) {
    const location = add(`%${escapeLike(filters.location)}%`);
    where.push(`(p.location ILIKE ${location} ESCAPE '\\'
      OR sp.county ILIKE ${location} ESCAPE '\\'
      OR sp.town ILIKE ${location} ESCAPE '\\')`);
  }
  if (filters.minPrice !== undefined) where.push(`${PRODUCT_PRICE_SQL} >= ${add(filters.minPrice)}`);
  if (filters.maxPrice !== undefined) where.push(`${PRODUCT_PRICE_SQL} <= ${add(filters.maxPrice)}`);
  if (filters.inStock === 'true') where.push('p.stock > 0');
  if (filters.featured === 'true') where.push('p.is_featured = TRUE');

  return { where, searchParam };
}

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: `${PRODUCT_PRICE_SQL} ASC, p.id DESC`,
  price_desc: `${PRODUCT_PRICE_SQL} DESC, p.id DESC`,
  popular: 'p.views_count DESC, p.created_at DESC',
  rating: 'r.rating_average DESC NULLS LAST, r.rating_count DESC, p.created_at DESC'
};

async function listProducts(filters) {
  const params = [];
  const { where, searchParam } = buildProductFilters(filters, params);
  const whereSql = where.join(' AND ');
  let sortSql = SORTS[filters.sort] || SORTS.newest;
  const limit = filters.limit || 12;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total ${PRODUCT_COUNT_FROM} WHERE ${whereSql}`,
    params
  );
  const total = countResult.rows[0].total;

  if (filters.q && filters.sort === 'newest') {
    params.push(`${escapeLike(filters.q)}%`);
    const prefixParam = `$${params.length}`;
    sortSql = `CASE
      WHEN p.name ILIKE ${prefixParam} ESCAPE '\\' THEN 0
      WHEN p.name ILIKE $${searchParam} ESCAPE '\\' THEN 1
      ELSE 2
    END, p.is_featured DESC, p.created_at DESC`;
  }

  const listParams = [...params, limit, offset];
  const { rows } = await db.query(
    `${PRODUCT_CARD_SELECT}
     WHERE ${whereSql}
     ORDER BY ${sortSql}
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  return {
    products: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}

async function getProductBySlug(slug) {
  const variantActivePrice = promotionService.activePriceExpression('p', 'COALESCE(pv.price, p.price)');
  const { rows } = await db.query(
    `SELECT
       p.id, p.name, p.slug, p.description, ${PRODUCT_ACTIVE_PRICE} AS price,
       ${PRODUCT_COMPARE_PRICE} AS "compareAtPrice",
       p.stock, p.condition, p.location, p.specifications,
       p.is_featured AS "isFeatured",
       p.views_count AS "viewsCount", p.created_at AS "createdAt", p.updated_at AS "updatedAt",
       c.id AS "categoryId", c.name AS "categoryName", c.slug AS "categorySlug",
       c.parent_category_id AS "parentCategoryId",
       u.id AS "sellerId", sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
       sp.description AS "shopDescription", sp.county AS "shopCounty", sp.town AS "shopTown",
       sp.logo_url AS "shopLogoUrl", sp.created_at AS "shopSince",
       COALESCE(r.rating_average, 0)::float AS "ratingAverage",
       COALESCE(r.rating_count, 0)::int AS "ratingCount",
       COALESCE((
         SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'altText', pi.alt_text)
                         ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC)
         FROM product_images pi WHERE pi.product_id = p.id
       ), '[]'::json) AS images,
       COALESCE((
         SELECT json_agg(json_build_object(
           'id', pv.id, 'sku', pv.sku, 'attributes', pv.attributes,
           'price', ${variantActivePrice},
           'compareAtPrice', CASE
             WHEN (${variantActivePrice}) < COALESCE(pv.price, p.price)
               THEN GREATEST(COALESCE(p.compare_at_price, COALESCE(pv.price, p.price)), COALESCE(pv.price, p.price))
             ELSE p.compare_at_price
           END,
           'stock', pv.stock
         ) ORDER BY pv.id)
         FROM product_variants pv WHERE pv.product_id = p.id
       ), '[]'::json) AS variants,
       (
         SELECT COUNT(*)::int FROM products p2
         WHERE p2.seller_id = p.seller_id AND p2.status = 'approved'
       ) AS "shopProductCount"
     FROM products p
     JOIN categories c ON c.id = p.category_id AND c.is_active = TRUE
     JOIN users u ON u.id = p.seller_id AND u.is_active = TRUE
     JOIN seller_profiles sp ON sp.user_id = u.id AND sp.status = 'approved'
     LEFT JOIN LATERAL (
       SELECT AVG(rating)::numeric(3,2) AS rating_average, COUNT(*) AS rating_count
       FROM reviews WHERE product_id = p.id
     ) r ON TRUE
     WHERE p.status = 'approved' AND p.slug = $1`,
    [slug]
  );

  const product = rows[0];
  if (!product) return null;

  await db.query('UPDATE products SET views_count = views_count + 1 WHERE id = $1', [product.id]);

  const [relatedResult, reviewResult] = await Promise.all([
    db.query(
      `${PRODUCT_CARD_SELECT}
       WHERE p.status = 'approved' AND p.category_id = $1 AND p.id <> $2
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT 4`,
      [product.categoryId, product.id]
    ),
    db.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at AS "createdAt",
              split_part(ru.full_name, ' ', 1) AS "buyerName"
       FROM reviews r
       JOIN users ru ON ru.id = r.buyer_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC
       LIMIT 3`,
      [product.id]
    )
  ]);

  return { product, related: relatedResult.rows, recentReviews: reviewResult.rows };
}

async function getProductReviews(productId, page, limit) {
  const offset = (page - 1) * limit;
  const [countResult, listResult] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS total FROM reviews WHERE product_id = $1', [productId]),
    db.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at AS "createdAt",
              split_part(ru.full_name, ' ', 1) AS "buyerName"
       FROM reviews r
       JOIN users ru ON ru.id = r.buyer_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    )
  ]);
  const total = countResult.rows[0].total;
  return {
    reviews: listResult.rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
  };
}

async function getRecommendations(buyerId) {
  const { rows } = await db.query(
    `WITH category_affinity AS (
       SELECT category_id, SUM(weight)::int AS score
       FROM (
         SELECT p.category_id, 3 AS weight
         FROM wishlists w JOIN products p ON p.id = w.product_id
         WHERE $1::bigint IS NOT NULL AND w.buyer_id = $1
         UNION ALL
         SELECT p.category_id, 5 AS weight
         FROM order_items oi JOIN products p ON p.id = oi.product_id
         JOIN orders o ON o.id = oi.order_id
         WHERE $1::bigint IS NOT NULL AND o.buyer_id = $1
           AND o.payment_status IN ('paid', 'refunded')
       ) signals
       GROUP BY category_id
     )
     ${PRODUCT_CARD_SELECT}
     WHERE p.status = 'approved'
       AND ($1::bigint IS NULL OR (
         NOT EXISTS (SELECT 1 FROM wishlists w WHERE w.buyer_id = $1 AND w.product_id = p.id)
         AND NOT EXISTS (
           SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
           WHERE o.buyer_id = $1 AND oi.product_id = p.id
         )
       ))
     ORDER BY COALESCE((
                SELECT ca.score FROM category_affinity ca WHERE ca.category_id = p.category_id
              ), 0) DESC,
              p.is_featured DESC, p.views_count DESC, p.created_at DESC
     LIMIT 8`,
    [buyerId || null]
  );
  return rows;
}

async function getProductSummaryBySlug(slug) {
  const { rows } = await db.query(
    'SELECT id, slug FROM products WHERE status = $1 AND slug = $2',
    ['approved', slug]
  );
  return rows[0] || null;
}

async function getProductsBySlugs(slugs) {
  if (!slugs.length) return [];
  const { rows } = await db.query(
    `${PRODUCT_CARD_SELECT}
     WHERE p.status = 'approved' AND p.slug = ANY($1::varchar[])
     ORDER BY array_position($1::varchar[], p.slug)`,
    [slugs]
  );
  return rows;
}

async function listCategories({ includeInactive = false } = {}) {
  const { rows } = await db.query(
    `WITH live AS (
       SELECT p.id, p.category_id
       FROM products p
       JOIN users u ON u.id = p.seller_id AND u.is_active = TRUE
       JOIN seller_profiles sp ON sp.user_id = u.id AND sp.status = 'approved'
       WHERE p.status = 'approved'
     )
     SELECT c.id, c.name, c.slug, c.description, c.icon, c.image_url AS "imageUrl",
            c.parent_category_id AS "parentCategoryId",
            c.sort_order AS "sortOrder", c.is_active AS "isActive",
            COALESCE(COUNT(l.id), 0)::int AS "productCount"
     FROM categories c
     LEFT JOIN live l ON l.category_id = c.id
       OR l.category_id IN (
         SELECT child.id FROM categories child WHERE child.parent_category_id = c.id
       )
     WHERE ($1::boolean = TRUE OR c.is_active = TRUE)
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`,
    [includeInactive]
  );
  return rows;
}

async function getCatalogueStats() {
  const { rows } = await db.query(
    `SELECT
       (SELECT COUNT(*)::int
        FROM products p
        JOIN users u ON u.id = p.seller_id AND u.is_active = TRUE
        JOIN seller_profiles sp ON sp.user_id = u.id AND sp.status = 'approved'
        JOIN categories c ON c.id = p.category_id AND c.is_active = TRUE
        WHERE p.status = 'approved') AS "productCount",
       (SELECT COUNT(*)::int FROM seller_profiles WHERE status = 'approved') AS "shopCount",
       (SELECT COUNT(*)::int FROM categories WHERE is_active = TRUE) AS "categoryCount",
       (SELECT COUNT(*)::int FROM users WHERE role = 'buyer' AND is_active = TRUE) AS "buyerCount"`
  );
  return rows[0];
}

async function listShops({ q, limit = 12 }) {
  const params = [];
  const where = ["sp.status = 'approved'", 'u.is_active = TRUE'];
  if (q) {
    params.push(`%${escapeLike(q)}%`);
    where.push(`(sp.shop_name ILIKE $${params.length} ESCAPE '\\' OR sp.description ILIKE $${params.length} ESCAPE '\\')`);
  }
  params.push(limit);
  const { rows } = await db.query(
    `SELECT sp.id, sp.shop_name AS "shopName", sp.shop_slug AS "shopSlug",
            sp.description, sp.logo_url AS "logoUrl", sp.banner_url AS "bannerUrl",
            sp.county, sp.town, sp.is_featured AS "isFeatured",
            sp.created_at AS "createdAt",
            COUNT(DISTINCT p.id)::int AS "productCount",
            COALESCE(AVG(r.rating), 0)::float AS "ratingAverage",
            COUNT(DISTINCT r.id)::int AS "reviewCount"
     FROM seller_profiles sp
     JOIN users u ON u.id = sp.user_id AND u.is_active = TRUE
     LEFT JOIN products p ON p.seller_id = u.id AND p.status = 'approved'
     LEFT JOIN reviews r ON r.seller_id = sp.user_id
     WHERE ${where.join(' AND ')}
     GROUP BY sp.id
     ORDER BY sp.is_featured DESC, "productCount" DESC, sp.created_at ASC
     LIMIT $${params.length}`,
    params
  );
  return rows;
}

async function getShopBySlug(slug) {
  const { rows } = await db.query(
    `SELECT sp.id, sp.user_id AS "sellerId", sp.shop_name AS "shopName",
            sp.shop_slug AS "shopSlug", sp.description, sp.logo_url AS "logoUrl",
            sp.banner_url AS "bannerUrl", sp.county, sp.town, sp.phone,
            sp.is_featured AS "isFeatured",
            sp.created_at AS "createdAt",
            (SELECT COUNT(*)::int FROM products p
             WHERE p.seller_id = sp.user_id AND p.status = 'approved') AS "productCount",
            COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM reviews r
                      WHERE r.seller_id = sp.user_id), 0)::float AS "ratingAverage",
            (SELECT COUNT(*)::int FROM reviews r WHERE r.seller_id = sp.user_id) AS "reviewCount"
     FROM seller_profiles sp
     JOIN users u ON u.id = sp.user_id AND u.is_active = TRUE
     WHERE sp.status = 'approved' AND sp.shop_slug = $1`,
    [slug]
  );
  return rows[0] || null;
}

module.exports = {
  listProducts,
  getProductBySlug,
  getProductReviews,
  getRecommendations,
  getProductSummaryBySlug,
  getProductsBySlugs,
  listCategories,
  getCatalogueStats,
  listShops,
  getShopBySlug
};
