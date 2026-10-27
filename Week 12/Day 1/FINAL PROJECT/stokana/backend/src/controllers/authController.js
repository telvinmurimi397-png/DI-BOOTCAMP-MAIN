const bcrypt = require('bcrypt');
const db = require('../config/db');
const env = require('../config/env');
const userService = require('../services/userService');
const { toPublicUser } = require('../utils/toPublicUser');
const { uniqueSlug } = require('../utils/slug');
const { randomToken, hashToken } = require('../utils/tokens');
const { badRequest, conflict, forbidden, notFound, unauthorized } = require('../utils/errors');

const DUMMY_HASH = bcrypt.hashSync('stokana-dummy-password', 12);

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

async function register(req, res) {
  const { fullName, email, phone, password, role, shopName, shopDescription, shopCounty, shopTown } = req.body;

  const existing = await userService.findByEmail(email);
  if (existing) throw conflict('An account with this email already exists.');

  if (role === 'seller') {
    const shopExists = await db.query(
      'SELECT 1 FROM seller_profiles WHERE lower(shop_name) = lower($1)',
      [shopName]
    );
    if (shopExists.rowCount) throw conflict('That shop name is already in use. Try another one.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const shopSlug = role === 'seller' ? uniqueSlug(shopName) : null;

  const userId = await db.withTransaction(async (client) => {
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [fullName, email, phone, passwordHash, role]
    );
    const id = userResult.rows[0].id;

    if (role === 'seller') {
      await client.query(
        `INSERT INTO seller_profiles
           (user_id, shop_name, shop_slug, description, county, town, phone, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
        [id, shopName, shopSlug, shopDescription || null, shopCounty || null, shopTown || null, phone]
      );
    }
    return id;
  });

  await regenerateSession(req);
  req.session.userId = userId;
  await saveSession(req);

  const row = await userService.findById(userId);
  res.status(201).json({
    message: role === 'seller'
      ? 'Shop created. An administrator will review it before your products go live.'
      : 'Welcome to Stokana.',
    user: toPublicUser(row)
  });
}

async function login(req, res) {
  const { email, password, role } = req.body;
  const row = await userService.findByEmail(email);

  const passwordMatches = await bcrypt.compare(password, row ? row.passwordHash : DUMMY_HASH);
  if (!row || !passwordMatches) {
    throw unauthorized('The email or password is incorrect.');
  }
  if (!row.isActive) {
    throw forbidden('This account has been deactivated. Please contact support.');
  }
  if (role && role !== row.role) {
    const accountType = row.role === 'admin' ? 'an admin' : `a ${row.role}`;
    throw forbidden(`This account is registered as ${accountType}. Choose the ${row.role} option to sign in.`);
  }

  await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [row.id]);
  await regenerateSession(req);
  req.session.userId = Number(row.id);
  await saveSession(req);

  res.json({ message: `Welcome back, ${row.fullName.split(' ')[0]}.`, user: toPublicUser(row) });
}

async function logout(req, res) {
  await new Promise((resolve) => {
    req.session.destroy(() => resolve());
  });
  res.clearCookie(env.session.name, { path: '/' });
  res.json({ message: 'You have been signed out.' });
}

async function me(req, res) {
  res.json({ user: req.user || null });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  const row = await userService.findByEmail(email);

  let devResetToken = null;
  if (row && row.isActive) {
    await db.query(
      'UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL',
      [row.id]
    );
    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [row.id, hashToken(token), expiresAt]
    );

    const resetUrl = `${env.appUrl}/pages/reset-password.html?token=${token}`;
    console.log(`[password-reset] ${row.email} -> ${resetUrl}`);
    if (!env.isProduction) devResetToken = token;
  }

  res.json({
    message: 'If that email is registered, we have sent password reset instructions.',
    ...(devResetToken ? { devResetToken } : {})
  });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  const tokenHash = hashToken(token);

  const { rows } = await db.query(
    `SELECT pr.id, pr.user_id AS "userId"
     FROM password_resets pr
     WHERE pr.token_hash = $1 AND pr.used_at IS NULL AND pr.expires_at > now()`,
    [tokenHash]
  );
  const reset = rows[0];
  if (!reset) throw badRequest('This reset link has expired or has already been used.');

  const passwordHash = await bcrypt.hash(password, 12);

  await db.withTransaction(async (client) => {
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, reset.userId]
    );
    await client.query('UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [
      reset.userId
    ]);
    await client.query(
      `DELETE FROM "session" WHERE (sess->>'userId')::bigint = $1`,
      [reset.userId]
    );
  });

  res.json({ message: 'Your password has been reset. You can now sign in.' });
}

async function updateProfile(req, res) {
  const { fullName, phone } = req.body;
  const updates = [];
  const params = [];

  if (fullName !== undefined) {
    params.push(fullName);
    updates.push(`full_name = $${params.length}`);
  }
  if (phone !== undefined) {
    params.push(phone);
    updates.push(`phone = $${params.length}`);
  }
  if (!updates.length) throw badRequest('Provide at least one profile field to update.');

  params.push(req.user.id);
  await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
  const row = await userService.findById(req.user.id);
  res.json({ message: 'Profile updated.', user: toPublicUser(row) });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (currentPassword === newPassword) {
    throw badRequest('Choose a new password that is different from your current one.');
  }

  const row = await userService.findByIdWithPassword(req.user.id);
  if (!row) throw notFound('Account not found.');
  const matches = await bcrypt.compare(currentPassword, row.passwordHash);
  if (!matches) throw badRequest('Your current password is incorrect.');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);
  await db.query(
    `DELETE FROM "session" WHERE (sess->>'userId')::bigint = $1 AND sid <> $2`,
    [req.user.id, req.sessionID]
  );

  res.json({ message: 'Password changed. Other devices have been signed out.' });
}

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword
};
