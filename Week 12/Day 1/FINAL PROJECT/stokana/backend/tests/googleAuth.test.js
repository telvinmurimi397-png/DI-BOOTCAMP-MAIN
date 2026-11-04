const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const controllerPath = path.resolve(__dirname, '../src/controllers/googleAuthController.js');
const env = {
  appUrl: 'https://stokana.example',
  googleOAuth: {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret'
  }
};
const createdUser = {
  id: 21,
  fullName: 'Google Buyer',
  email: 'buyer@example.test',
  role: 'buyer',
  isActive: true,
  twoFactorEnabled: false
};
let lookupUser = null;
let dbQueries = [];

const db = {
  query: async (...args) => {
    dbQueries.push(args);
    return { rows: [], rowCount: 1 };
  },
  withTransaction: async (callback) => callback({
    query: async (sql) => {
      if (sql.includes('INSERT INTO users')) return { rows: [{ id: createdUser.id }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    }
  })
};
const userService = {
  findByEmail: async () => lookupUser,
  findById: async () => createdUser
};
const stubs = {
  bcrypt: { hash: async () => 'generated-password-hash' },
  '../config/db': db,
  '../config/env': env,
  '../services/userService': userService,
  '../utils/toPublicUser': { toPublicUser: (user) => user }
};
const originalLoad = Module._load;
Module._load = function loadWithGoogleAuthStubs(request, parent, isMain) {
  if (parent?.filename === controllerPath && Object.hasOwn(stubs, request)) {
    return stubs[request];
  }
  return originalLoad.call(this, request, parent, isMain);
};
const googleAuthController = require(controllerPath);
Module._load = originalLoad;

function response() {
  return {
    redirectUrl: null,
    redirect(url) {
      this.redirectUrl = url;
      return this;
    }
  };
}

function session() {
  return {
    save(callback) {
      callback(null);
    },
    regenerate(callback) {
      for (const key of Object.keys(this)) delete this[key];
      this.save = (done) => done(null);
      this.regenerate = (done) => done(null);
      callback(null);
    }
  };
}

test('Google OAuth start stores state and a PKCE verifier before redirecting', async () => {
  env.googleOAuth.clientId = 'test-client-id';
  const req = { query: { next: '/checkout?step=payment' }, session: session() };
  const res = response();

  await googleAuthController.start(req, res);

  const authorizationUrl = new URL(res.redirectUrl);
  assert.equal(authorizationUrl.origin, 'https://accounts.google.com');
  assert.equal(authorizationUrl.searchParams.get('redirect_uri'), 'https://stokana.example/api/auth/google/callback');
  assert.equal(authorizationUrl.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(req.session.googleOAuthNext, '/checkout?step=payment');
  assert.equal(authorizationUrl.searchParams.get('state'), req.session.googleOAuthState);
  assert.notEqual(authorizationUrl.searchParams.get('code_challenge'), req.session.googleOAuthVerifier);

  const unsafeReq = { query: { next: '//attacker.example' }, session: session() };
  await googleAuthController.start(unsafeReq, response());
  assert.equal(unsafeReq.session.googleOAuthNext, null);
});

test('Google callback rejects a mismatched OAuth state without contacting Google', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('Google must not be contacted for an invalid state.');
  };
  try {
    const res = response();
    await googleAuthController.callback({
      query: { code: 'authorization-code', state: 'attacker-state' },
      session: { googleOAuthState: 'expected-state' }
    }, res);

    assert.equal(res.redirectUrl, '/login?google_error=invalid_state');
  } finally {
    global.fetch = originalFetch;
  }
});

test('Google callback creates a verified buyer session and returns to a safe next path', async () => {
  const originalFetch = global.fetch;
  const fetchCalls = [];
  global.fetch = async (url, options) => {
    fetchCalls.push({ url: String(url), options });
    if (String(url).includes('/token')) {
      return { ok: true, json: async () => ({ access_token: 'google-access-token' }) };
    }
    return {
      ok: true,
      json: async () => ({
        sub: 'google-user-id',
        email: 'Buyer@Example.Test',
        email_verified: true,
        name: 'Google Buyer'
      })
    };
  };
  lookupUser = null;
  dbQueries = [];
  try {
    const reqSession = session();
    Object.assign(reqSession, {
      googleOAuthState: 'correct-state',
      googleOAuthVerifier: 'pkce-verifier',
      googleOAuthNext: '/checkout'
    });
    const res = response();

    await googleAuthController.callback({
      query: { code: 'authorization-code', state: 'correct-state' },
      session: reqSession
    }, res);

    assert.equal(fetchCalls.length, 2);
    assert.match(fetchCalls[0].options.body.toString(), /code_verifier=pkce-verifier/);
    assert.equal(fetchCalls[1].options.headers.Authorization, 'Bearer google-access-token');
    assert.equal(dbQueries[0][1][0], createdUser.id);
    assert.equal(reqSession.userId, createdUser.id);
    assert.equal(res.redirectUrl, '/checkout');
  } finally {
    global.fetch = originalFetch;
  }
});
