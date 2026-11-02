const db = require('../config/db');

const USER_COLUMNS = `
  u.id,
  u.full_name AS "fullName",
  u.email,
  u.phone,
  u.role,
  u.is_active AS "isActive",
  u.email_verified AS "emailVerified",
  u.phone_verified AS "phoneVerified",
  u.marketing_email_consent AS "marketingEmailConsent",
  u.two_factor_enabled AS "twoFactorEnabled",
  u.created_at AS "createdAt",
  sp.id AS "sellerProfileId",
  sp.shop_name AS "shopName",
  sp.shop_slug AS "shopSlug",
  sp.status AS "sellerStatus",
  sp.rejection_reason AS "sellerRejectionReason",
  sp.logo_url AS "shopLogoUrl"
`;

async function findById(id) {
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}
     FROM users u
     LEFT JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}, u.password_hash AS "passwordHash"
     FROM users u
     LEFT JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE u.email = $1`,
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

async function findByIdWithPassword(id) {
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}, u.password_hash AS "passwordHash"
     FROM users u
     LEFT JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findByIdWithSecurity(id) {
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}, u.password_hash AS "passwordHash",
            u.two_factor_secret AS "twoFactorSecret"
     FROM users u
     LEFT JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE u.id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { findById, findByEmail, findByIdWithPassword, findByIdWithSecurity };
