const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const controllerPath = path.resolve(__dirname, '../src/controllers/authController.js');
let verificationSend = async () => ({});

class VerificationDeliveryError extends Error {
  constructor(channel) {
    super('Email service unavailable.');
    this.channel = channel;
  }
}

const user = {
  id: 7,
  fullName: 'Test Buyer',
  email: 'buyer@example.test',
  role: 'buyer',
  emailVerified: false,
  isActive: true,
  twoFactorEnabled: false,
  passwordHash: 'password-hash'
};
let foundByEmail = null;
let registrationUser = user;
let sellerProfileCreated = false;
const db = {
  query: async () => ({ rows: [], rowCount: 0 }),
  withTransaction: async (callback) => callback({
    query: async (sql) => {
      if (sql.includes('INSERT INTO users')) return { rows: [{ id: registrationUser.id }] };
      if (sql.includes('INSERT INTO seller_profiles')) {
        sellerProfileCreated = true;
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
  })
};
const userService = {
  findByEmail: async () => foundByEmail,
  findById: async () => registrationUser,
  findByIdWithSecurity: async () => foundByEmail
};
const verificationService = {
  send: (...args) => verificationSend(...args),
  VerificationDeliveryError
};

const stubs = {
  bcrypt: {
    hash: async () => 'password-hash',
    hashSync: () => 'dummy-hash',
    compare: async (password, hash) => password === 'StrongPass123' && hash === 'password-hash'
  },
  '../config/db': db,
  '../config/env': { isProduction: true },
  '../services/userService': userService,
  '../utils/toPublicUser': { toPublicUser: (row) => row },
  '../utils/slug': { uniqueSlug: (value) => value },
  '../utils/tokens': { randomToken: () => 'token', hashToken: () => 'hash' },
  '../services/verificationService': verificationService,
  '../services/verificationDelivery': {},
  '../utils/totp': {},
  '../utils/errors': {
    badRequest: (message) => new Error(message),
    conflict: (message) => new Error(message),
    forbidden: (message) => new Error(message),
    notFound: (message) => new Error(message),
    unauthorized: (message) => Object.assign(new Error(message), { status: 401 })
  }
};

const originalLoad = Module._load;
Module._load = function loadWithAuthStubs(request, parent, isMain) {
  if (parent?.filename === controllerPath && Object.hasOwn(stubs, request)) {
    return stubs[request];
  }
  return originalLoad.call(this, request, parent, isMain);
};
const authController = require(controllerPath);
Module._load = originalLoad;

function registrationRequest(role = 'buyer') {
  return {
    body: {
      fullName: user.fullName,
      email: user.email,
      password: 'StrongPass123',
      role,
      marketingEmailConsent: false,
      ...(role === 'seller' ? { shopName: 'Test Seller Shop' } : {})
    },
    session: {
      regenerate: (callback) => callback(null),
      save: (callback) => callback(null)
    }
  };
}

function registrationResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('account creation succeeds with a clear warning when verification delivery fails', async () => {
  registrationUser = user;
  sellerProfileCreated = false;
  verificationSend = async (_user, channel) => {
    if (channel === 'email') throw new VerificationDeliveryError(channel);
    return {};
  };
  const req = registrationRequest();
  const res = registrationResponse();

  await authController.register(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.user.id, user.id);
  assert.equal(res.body.verificationDeliveryFailed, true);
  assert.match(res.body.message, /Account created.*email verification code/);
  assert.equal(req.session.userId, user.id);
});

test('seller account and shop are created even when verification delivery fails', async () => {
  registrationUser = { ...user, role: 'seller', sellerProfileId: 5, shopName: 'Test Seller Shop' };
  sellerProfileCreated = false;
  verificationSend = async (_user, channel) => {
    if (channel === 'email') throw new VerificationDeliveryError(channel);
    return {};
  };
  const req = registrationRequest('seller');
  const res = registrationResponse();

  await authController.register(req, res);

  assert.equal(sellerProfileCreated, true);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.user.role, 'seller');
  assert.equal(res.body.verificationDeliveryFailed, true);
  assert.match(res.body.message, /Account created.*email verification code/);
});

test('account creation still fails for non-delivery verification errors', async () => {
  registrationUser = user;
  verificationSend = async () => {
    throw new Error('Verification storage is unavailable.');
  };
  const res = registrationResponse();

  await assert.rejects(authController.register(registrationRequest(), res), /Verification storage is unavailable/);
  assert.equal(res.statusCode, null);
});

test('a registered buyer can sign in with the matching password', async () => {
  foundByEmail = user;
  const req = {
    body: { email: user.email, password: 'StrongPass123' },
    session: {
      regenerate: (callback) => callback(null),
      save: (callback) => callback(null)
    }
  };
  const res = registrationResponse();

  await authController.login(req, res);

  assert.equal(res.statusCode, null);
  assert.equal(res.body.user.id, user.id);
  assert.equal(req.session.userId, user.id);
});

test('sign-in rejects an incorrect password', async () => {
  foundByEmail = user;
  const req = {
    body: { email: user.email, password: 'WrongPassword123' },
    session: {
      regenerate: (callback) => callback(null),
      save: (callback) => callback(null)
    }
  };
  const res = registrationResponse();

  await assert.rejects(authController.login(req, res), (error) => error.status === 401);
  assert.equal(res.statusCode, null);
});
