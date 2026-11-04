const bcrypt = require('bcrypt');
const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');
const db = require('../config/db');
const env = require('../config/env');
const userService = require('../services/userService');
const { toPublicUser } = require('../utils/toPublicUser');

const GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

function isConfigured() {
  return Boolean(env.googleOAuth.clientId && env.googleOAuth.clientSecret);
}

function callbackUrl() {
  return new URL('/api/auth/google/callback', env.appUrl).toString();
}

function safeNext(value) {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return null;
  }
  return new URL(value, env.appUrl).origin === new URL(env.appUrl).origin ? value : null;
}

function sessionOperation(session, operation) {
  return new Promise((resolve, reject) => {
    session[operation]((error) => (error ? reject(error) : resolve()));
  });
}

function clearOAuthSession(session) {
  delete session.googleOAuthState;
  delete session.googleOAuthVerifier;
  delete session.googleOAuthNext;
}

function matchesState(expected, actual) {
  if (typeof expected !== 'string' || typeof actual !== 'string') return false;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function loginError(res, code) {
  return res.redirect(`/login?google_error=${encodeURIComponent(code)}`);
}

async function start(req, res) {
  if (!isConfigured()) return loginError(res, 'not_configured');

  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  req.session.googleOAuthState = state;
  req.session.googleOAuthVerifier = verifier;
  req.session.googleOAuthNext = safeNext(req.query.next);
  await sessionOperation(req.session, 'save');

  const authorizationUrl = new URL(GOOGLE_AUTHORIZATION_URL);
  authorizationUrl.search = new URLSearchParams({
    client_id: env.googleOAuth.clientId,
    redirect_uri: callbackUrl(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  }).toString();
  res.redirect(authorizationUrl.toString());
}

function dashboardPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'seller') return '/seller';
  return '/account';
}

async function callback(req, res) {
  if (req.query.error) {
    clearOAuthSession(req.session);
    return loginError(res, req.query.error === 'access_denied' ? 'cancelled' : 'provider');
  }

  const { googleOAuthState: expectedState, googleOAuthVerifier: verifier, googleOAuthNext: next } = req.session;
  if (!matchesState(expectedState, req.query.state)) {
    clearOAuthSession(req.session);
    return loginError(res, 'invalid_state');
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  clearOAuthSession(req.session);
  await sessionOperation(req.session, 'save');
  if (!code || !verifier || !isConfigured()) return loginError(res, 'provider');

  let tokenResponse;
  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.googleOAuth.clientId,
        client_secret: env.googleOAuth.clientSecret,
        redirect_uri: callbackUrl(),
        grant_type: 'authorization_code',
        code_verifier: verifier
      }),
      signal: AbortSignal.timeout(10000)
    });
    tokenResponse = response.ok ? await response.json() : null;
  } catch (error) {
    console.error('[auth] Google token exchange failed:', error.message);
    return loginError(res, 'unavailable');
  }
  if (!tokenResponse?.access_token) return loginError(res, 'provider');

  let profile;
  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      signal: AbortSignal.timeout(10000)
    });
    profile = response.ok ? await response.json() : null;
  } catch (error) {
    console.error('[auth] Google profile request failed:', error.message);
    return loginError(res, 'unavailable');
  }

  const email = typeof profile?.email === 'string' ? profile.email.trim().toLowerCase() : '';
  if (
    !profile?.sub ||
    !email ||
    email.length > 255 ||
    profile.email_verified !== true
  ) {
    return loginError(res, 'unverified');
  }

  let row = await userService.findByEmail(email);
  if (row && !row.isActive) return loginError(res, 'account_disabled');
  if (row?.twoFactorEnabled) return loginError(res, 'two_factor');

  if (!row) {
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
    const fullName = (typeof profile.name === 'string' && profile.name.trim()
      ? profile.name.trim()
      : email.split('@')[0]).slice(0, 120);
    const userId = await db.withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO users
           (full_name, email, password_hash, email_verified, phone_verified)
         VALUES ($1, $2, $3, TRUE, TRUE)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [fullName, email, passwordHash]
      );
      if (!result.rowCount) return null;
      const id = result.rows[0].id;
      await client.query(
        `UPDATE users SET referral_code = 'STK' || upper(to_hex(id)) WHERE id = $1`,
        [id]
      );
      return id;
    });
    row = userId ? await userService.findById(userId) : await userService.findByEmail(email);
    if (!row) return loginError(res, 'provider');
    if (!row.isActive) return loginError(res, 'account_disabled');
    if (row.twoFactorEnabled) return loginError(res, 'two_factor');
  }

  await db.query(
    'UPDATE users SET email_verified = TRUE, last_login_at = now() WHERE id = $1',
    [row.id]
  );
  await sessionOperation(req.session, 'regenerate');
  req.session.userId = Number(row.id);
  await sessionOperation(req.session, 'save');
  res.redirect(safeNext(next) || dashboardPath(row.role));
}

module.exports = { start, callback };
