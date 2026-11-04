const bcrypt = require('bcrypt');
const db = require('../config/db');
const env = require('../config/env');
const userService = require('../services/userService');
const { toPublicUser } = require('../utils/toPublicUser');
const { uniqueSlug } = require('../utils/slug');
const { randomToken, hashToken } = require('../utils/tokens');
const verificationService = require('../services/verificationService');
const verificationDelivery = require('../services/verificationDelivery');
const { generateSecret, verifyCode, provisioningUri, encryptSecret, decryptSecret } = require('../utils/totp');
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
  const {
    fullName, email, phone, password, role, shopName, shopDescription,
    shopCounty, shopTown, referralCode, marketingEmailConsent
  } = req.body;

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
  const referral = referralCode
    ? await db.query(
      `SELECT id FROM users
       WHERE upper(referral_code) = upper($1) AND role = 'buyer' AND is_active = TRUE`,
      [referralCode]
    )
    : null;
  if (referralCode && !referral?.rowCount) throw badRequest('That referral code is not valid.');

  const userId = await db.withTransaction(async (client) => {
    const userResult = await client.query(
      `INSERT INTO users
         (full_name, email, phone, password_hash, role, email_verified, phone_verified,
          marketing_email_consent, referred_by)
       VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7, $8)
       RETURNING id`,
      [
        fullName, email, phone, passwordHash, role, !phone,
        marketingEmailConsent, referral?.rows[0]?.id || null
      ]
    );
    const id = userResult.rows[0].id;
    await client.query(
      `UPDATE users SET referral_code = 'STK' || upper(to_hex(id)) WHERE id = $1`,
      [id]
    );

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
  const verification = {};
  const verificationFailures = [];
  for (const channel of ['email', ...(phone ? ['phone'] : [])]) {
    try {
      const result = await verificationService.send(row, channel);
      if (channel === 'email') Object.assign(verification, result);
      else verification.phone = result.devCode;
    } catch (error) {
      if (!(error instanceof verificationService.VerificationDeliveryError)) throw error;
      verificationFailures.push(channel);
    }
  }
  const verificationDeliveryFailed = verificationFailures.length > 0;
  const message = verificationDeliveryFailed
    ? `Account created, but we could not send your ${verificationFailures.join(' and ')} verification code. Sign in and request a new code from Account settings.`
    : role === 'seller'
      ? 'Shop created. An administrator will review it before your products go live.'
      : 'Welcome to Stokana.';

  res.status(201).json({
    message,
    ...(verificationDeliveryFailed ? { verificationDeliveryFailed: true } : {}),
    user: toPublicUser(row),
    ...(!env.isProduction ? { devVerification: verification } : {})
  });
}

async function login(req, res) {
  const { email, password, role } = req.body;
  const found = await userService.findByEmail(email);
  const row = found ? await userService.findByIdWithSecurity(found.id) : null;

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

  if (row.twoFactorEnabled) {
    const challengeToken = randomToken(32);
    await db.query(
      `INSERT INTO two_factor_login_challenges (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '5 minutes')`,
      [row.id, hashToken(challengeToken)]
    );
    return res.json({
      message: 'Enter the code from your authenticator app.',
      requiresTwoFactor: true,
      challengeToken
    });
  }

  await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [row.id]);
  await regenerateSession(req);
  req.session.userId = Number(row.id);
  await saveSession(req);

  res.json({ message: `Welcome back, ${row.fullName.split(' ')[0]}.`, user: toPublicUser(row) });
}

async function verifyTwoFactorLogin(req, res) {
  const tokenHash = hashToken(req.body.challengeToken);
  const { rows } = await db.query(
    `SELECT c.id, c.user_id AS "userId", u.two_factor_secret AS secret
     FROM two_factor_login_challenges c JOIN users u ON u.id = c.user_id
     WHERE c.token_hash = $1 AND c.expires_at > now() AND u.is_active
       AND u.two_factor_enabled AND u.email_verified`,
    [tokenHash]
  );
  const challenge = rows[0];
  if (!challenge || !verifyCode(decryptSecret(challenge.secret), req.body.code)) {
    throw unauthorized('The authenticator code is invalid or the challenge has expired.');
  }
  const consumed = await db.query(
    `DELETE FROM two_factor_login_challenges
     WHERE id = $1 AND expires_at > now() RETURNING user_id AS "userId"`,
    [challenge.id]
  );
  if (!consumed.rowCount) throw unauthorized('The sign-in challenge has expired.');
  const row = await userService.findById(challenge.userId);
  await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [row.id]);
  await regenerateSession(req);
  req.session.userId = Number(row.id);
  await saveSession(req);
  res.json({ message: 'Signed in successfully.', user: toPublicUser(row) });
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
    await verificationDelivery.sendEmail(
      row.email,
      'Reset your Stokana password',
      `Use this link to reset your Stokana password: ${resetUrl}\n\nThis link expires in one hour. If you did not request this, you can ignore this email.`
    );
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
  const { fullName, phone, marketingEmailConsent } = req.body;
  const updates = [];
  const params = [];

  if (fullName !== undefined) {
    params.push(fullName);
    updates.push(`full_name = $${params.length}`);
  }
  if (phone !== undefined) {
    const changed = phone !== (req.user.phone || null);
    params.push(phone);
    updates.push(`phone = $${params.length}`);
    if (changed) updates.push(`phone_verified = ${phone ? 'FALSE' : 'TRUE'}`);
  }
  if (marketingEmailConsent !== undefined) {
    params.push(marketingEmailConsent);
    updates.push(`marketing_email_consent = $${params.length}`);
  }
  if (!updates.length) throw badRequest('Provide at least one profile field to update.');

  params.push(req.user.id);
  const phoneChanged = phone !== undefined && phone !== (req.user.phone || null);
  await db.withTransaction(async (client) => {
    await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    if (phoneChanged) {
      await client.query(
        `UPDATE user_verifications SET used_at = now()
         WHERE user_id = $1 AND channel = 'phone' AND used_at IS NULL`,
        [req.user.id]
      );
    }
  });
  const row = await userService.findById(req.user.id);
  const verification = phoneChanged && phone ? await verificationService.send(row, 'phone') : {};
  res.json({
    message: 'Profile updated.',
    user: toPublicUser(row),
    ...(!env.isProduction && verification.devCode ? { devVerificationCode: verification.devCode } : {})
  });
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

async function twoFactorSetup(req, res) {
  const row = await userService.findById(req.user.id);
  if (!row.emailVerified) throw forbidden('Verify your email before enabling two-factor authentication.');
  if (row.twoFactorEnabled) throw badRequest('Two-factor authentication is already enabled.');
  const secret = generateSecret();
  await db.query('UPDATE users SET two_factor_secret = $1 WHERE id = $2', [encryptSecret(secret), req.user.id]);
  res.json({
    secret,
    provisioningUri: provisioningUri(secret, row.email),
    message: 'Add this secret to your authenticator app, then confirm with its current code.'
  });
}

async function twoFactorEnable(req, res) {
  const row = await userService.findByIdWithSecurity(req.user.id);
  if (!row?.twoFactorSecret || !verifyCode(decryptSecret(row.twoFactorSecret), req.body.code)) {
    throw badRequest('The authenticator code is invalid. Set up a new secret and try again.');
  }
  await db.query('UPDATE users SET two_factor_enabled = TRUE WHERE id = $1', [req.user.id]);
  res.json({ message: 'Two-factor authentication enabled.' });
}

async function twoFactorDisable(req, res) {
  const row = await userService.findByIdWithSecurity(req.user.id);
  if (!row) throw notFound('Account not found.');
  const passwordMatches = await bcrypt.compare(req.body.password, row.passwordHash);
  if (
    !passwordMatches ||
    !row.twoFactorSecret ||
    !verifyCode(decryptSecret(row.twoFactorSecret), req.body.code)
  ) {
    throw badRequest('The password or authenticator code is incorrect.');
  }
  await db.query(
    'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = $1',
    [req.user.id]
  );
  res.json({ message: 'Two-factor authentication disabled.' });
}

module.exports = {
  register,
  login,
  verifyTwoFactorLogin,
  logout,
  me,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  twoFactorSetup,
  twoFactorEnable,
  twoFactorDisable
};
