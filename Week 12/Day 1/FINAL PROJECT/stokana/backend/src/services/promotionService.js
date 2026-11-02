const db = require('../config/db');
const { toCents, fromCents } = require('../utils/money');
const { badRequest, conflict, notFound } = require('../utils/errors');
const settingsService = require('./settingsService');

function activePriceExpression(productAlias, basePrice) {
  return `COALESCE((
    SELECT CASE promo.discount_type
      WHEN 'percent' THEN GREATEST(${basePrice} * (1 - promo.discount_value / 100), 0.01)
      ELSE GREATEST(${basePrice} - promo.discount_value, 0.01)
    END
    FROM promotions promo
    WHERE promo.kind = 'flash_sale' AND promo.is_active = TRUE
      AND promo.product_id = ${productAlias}.id
      AND promo.starts_at <= now() AND (promo.ends_at IS NULL OR promo.ends_at > now())
    ORDER BY CASE promo.discount_type
      WHEN 'percent' THEN GREATEST(${basePrice} * (1 - promo.discount_value / 100), 0.01)
      ELSE GREATEST(${basePrice} - promo.discount_value, 0.01)
    END ASC, promo.id DESC
    LIMIT 1
  ), ${basePrice})`;
}

function discountCents(promotion, eligibleCents) {
  if (eligibleCents <= 0) return 0;
  const raw = promotion.discount_type === 'percent'
    ? Math.round(eligibleCents * Number(promotion.discount_value) / 100)
    : toCents(promotion.discount_value);
  const max = promotion.max_discount == null ? raw : Math.min(raw, toCents(promotion.max_discount));
  return Math.min(eligibleCents, max);
}

async function findCoupon(client, buyerId, code, lines, subtotalCents, { lock = false } = {}) {
  const query = await client.query(
    `SELECT id, owner_id AS "ownerId", upper(code) AS code,
            discount_type AS "discountType", discount_value AS "discountValue",
            max_discount AS "maxDiscount", minimum_subtotal AS "minimumSubtotal",
            usage_limit AS "usageLimit", starts_at AS "startsAt", ends_at AS "endsAt"
     FROM promotions
     WHERE upper(code) = upper($1) AND kind = 'coupon' AND is_active = TRUE
       AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now())
     ${lock ? 'FOR UPDATE' : ''}`,
    [code]
  );
  const promo = query.rows[0];
  if (!promo) throw badRequest('That discount code is invalid or has expired.');
  const eligible = promo.ownerId == null
    ? lines
    : lines.filter((line) => Number(line.sellerId) === Number(promo.ownerId));
  const eligibleCents = eligible.reduce((sum, line) => sum + line.lineCents, 0);
  if (!eligible.length) throw badRequest('This discount code does not apply to items in your cart.');
  if (eligibleCents < toCents(promo.minimumSubtotal)) {
    throw badRequest(`This code requires a minimum eligible subtotal of KSh ${Number(promo.minimumSubtotal).toLocaleString('en-KE')}.`);
  }
  const [usageResult, priorResult] = await Promise.all([
    client.query(
      `SELECT COUNT(*)::int AS uses FROM promotion_redemptions
       WHERE promotion_id = $1 AND status <> 'released'`,
      [promo.id]
    ),
    client.query(
      `SELECT 1 FROM promotion_redemptions
       WHERE promotion_id = $1 AND buyer_id = $2 AND status <> 'released' LIMIT 1`,
      [promo.id, buyerId]
    )
  ]);
  if (promo.usageLimit != null && usageResult.rows[0].uses >= promo.usageLimit) {
    throw conflict('This discount code has reached its usage limit.');
  }
  if (priorResult.rowCount) throw conflict('You have already used this discount code.');
  return {
    ...promo,
    discountCents: discountCents(promo, eligibleCents),
    eligibleCents
  };
}

async function quote(buyerId, { code, loyaltyPoints = 0, useReferralCredit = false } = {}) {
  const { rows } = await db.query(
    `SELECT COALESCE(pv.price, p.price) AS "basePrice",
            ${activePriceExpression('p', 'COALESCE(pv.price, p.price)')} AS price,
            p.seller_id AS "sellerId", ci.quantity
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.product_id = ci.product_id AND pv.id = ci.variant_id
     WHERE c.buyer_id = $1
     ORDER BY p.id`,
    [buyerId]
  );
  if (!rows.length) throw badRequest('Your cart is empty.');
  const lines = rows.map((row) => ({
    ...row,
    lineCents: toCents(row.price) * Number(row.quantity)
  }));
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineCents, 0);
  const promotion = code
    ? await findCoupon(db, buyerId, code.trim(), lines, subtotalCents)
    : null;
  const [settings, rewardsResult] = await Promise.all([
    settingsService.getSettings(),
    db.query(
      `SELECT COALESCE(SUM(points_delta), 0)::int AS points,
              COALESCE(SUM(credit_delta), 0) AS credit
       FROM customer_reward_ledger WHERE user_id = $1`,
      [buyerId]
    )
  ]);
  const points = Number(loyaltyPoints);
  const availablePoints = rewardsResult.rows[0].points;
  if (!Number.isInteger(points) || points < 0 || points > availablePoints) {
    throw badRequest('You do not have enough loyalty points for that redemption.');
  }
  const pointsDiscount = points * 10;
  if (pointsDiscount > Math.floor(subtotalCents / 2)) {
    throw badRequest('Loyalty points can cover up to 50% of the merchandise subtotal.');
  }
  const shipping = subtotalCents >= toCents(settings.freeShippingThreshold)
    ? 0
    : toCents(settings.shippingFee);
  const couponDiscount = promotion?.discountCents || 0;
  const creditBalance = toCents(rewardsResult.rows[0].credit);
  const creditDiscount = useReferralCredit
    ? Math.min(creditBalance, Math.max(0, subtotalCents + shipping - couponDiscount - pointsDiscount))
    : 0;
  return {
    subtotal: fromCents(subtotalCents),
    shippingFee: fromCents(shipping),
    discount: fromCents(couponDiscount + pointsDiscount + creditDiscount),
    couponDiscount: fromCents(couponDiscount),
    pointsDiscount: fromCents(pointsDiscount),
    creditDiscount: fromCents(creditDiscount),
    code: promotion?.code || null,
    pointsBalance: availablePoints,
    creditBalance: fromCents(creditBalance),
    total: fromCents(subtotalCents + shipping - couponDiscount - pointsDiscount - creditDiscount)
  };
}

async function list(ownerId, isAdmin) {
  const params = isAdmin ? [] : [ownerId];
  const where = isAdmin ? '' : 'WHERE owner_id = $1';
  const { rows } = await db.query(
    `SELECT id, code, kind, product_id AS "productId",
            discount_type AS "discountType", discount_value AS "discountValue",
            max_discount AS "maxDiscount", minimum_subtotal AS "minimumSubtotal",
            usage_limit AS "usageLimit", starts_at AS "startsAt", ends_at AS "endsAt",
            is_active AS "isActive", created_at AS "createdAt"
     FROM promotions ${where}
     ORDER BY created_at DESC, id DESC`,
    params
  );
  return rows;
}

async function create(ownerId, input) {
  if (input.kind === 'flash_sale' && !input.productId) {
    throw badRequest('Choose a product for a flash sale.');
  }
  if (input.kind === 'coupon' && !input.code) {
    throw badRequest('Enter a discount code.');
  }
  if (ownerId != null && input.kind !== 'coupon' && input.kind !== 'flash_sale') {
    throw badRequest('Unsupported seller promotion type.');
  }
  if (input.productId) {
    const ownerFilter = ownerId == null ? '' : ' AND seller_id = $2';
    const params = ownerId == null ? [input.productId] : [input.productId, ownerId];
    const product = await db.query(
      `SELECT id FROM products WHERE id = $1${ownerFilter} AND status = 'approved'`,
      params
    );
    if (!product.rowCount) {
      throw notFound(ownerId == null
        ? 'Choose an approved product for the flash sale.'
        : 'Choose one of your approved products.');
    }
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO promotions
         (owner_id, code, kind, product_id, discount_type, discount_value,
          max_discount, minimum_subtotal, usage_limit, starts_at, ends_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
       RETURNING id, code, kind, product_id AS "productId",
                 discount_type AS "discountType", discount_value AS "discountValue",
                 starts_at AS "startsAt", ends_at AS "endsAt", is_active AS "isActive"`,
      [
        ownerId,
        input.code ? input.code.trim().toUpperCase() : null,
        input.kind,
        input.productId || null,
        input.discountType,
        input.discountValue,
        input.maxDiscount ?? null,
        input.minimumSubtotal || 0,
        input.usageLimit ?? null,
        input.startsAt || new Date(),
        input.endsAt || null
      ]
    );
    return rows[0];
  } catch (error) {
    if (error.code === '23505') throw conflict('That discount code is already in use.');
    throw error;
  }
}

async function setActive(ownerId, isAdmin, promotionId, isActive) {
  const params = isAdmin ? [promotionId, isActive] : [promotionId, isActive, ownerId];
  const ownership = isAdmin ? '' : ' AND owner_id = $3';
  const { rows } = await db.query(
    `UPDATE promotions SET is_active = $2
     WHERE id = $1${ownership}
     RETURNING id, is_active AS "isActive"`,
    params
  );
  if (!rows[0]) throw notFound('Promotion not found.');
  return rows[0];
}

module.exports = {
  activePriceExpression,
  discountCents,
  findCoupon,
  quote,
  list,
  create,
  setActive
};
