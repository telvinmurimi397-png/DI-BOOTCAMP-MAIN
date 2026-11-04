const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const authPath = path.resolve(__dirname, '../src/middleware/auth.js');
const stubs = {
  '../services/userService': {},
  '../utils/toPublicUser': {},
  '../utils/errors': {
    unauthorized: (message) => Object.assign(new Error(message), { status: 401 }),
    forbidden: (message) => Object.assign(new Error(message), { status: 403 })
  },
  '../config/env': { session: { name: 'stokana.sid' } }
};
const originalLoad = Module._load;
Module._load = function loadWithAuthStubs(request, parent, isMain) {
  if (parent?.filename === authPath && Object.hasOwn(stubs, request)) {
    return stubs[request];
  }
  return originalLoad.call(this, request, parent, isMain);
};
const { requireBuyer } = require(authPath);
Module._load = originalLoad;

test('checkout authorization allows buyers without verified email or phone', () => {
  const req = {
    user: {
      id: 12,
      role: 'buyer',
      emailVerified: false,
      phoneVerified: false
    }
  };
  let passed = false;

  requireBuyer(req, {}, (error) => {
    assert.equal(error, undefined);
    passed = true;
  });

  assert.equal(passed, true);
});

test('checkout authorization still rejects non-buyers', () => {
  const req = { user: { id: 13, role: 'seller', emailVerified: false, phoneVerified: false } };
  let error;

  requireBuyer(req, {}, (nextError) => {
    error = nextError;
  });

  assert.equal(error?.status, 403);
});
