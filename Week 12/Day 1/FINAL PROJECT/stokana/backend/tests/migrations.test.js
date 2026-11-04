const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { getMigrationFiles, unwrapMigration } = require('../scripts/migrate');

test('migration runner removes file-level transaction wrappers', () => {
  assert.equal(
    unwrapMigration('BEGIN;\nALTER TABLE users ADD COLUMN test_flag BOOLEAN;\nCOMMIT;'),
    'ALTER TABLE users ADD COLUMN test_flag BOOLEAN;'
  );
});

test('migration runner leaves SQL without transaction wrappers unchanged', () => {
  const sql = 'ALTER TABLE users ADD COLUMN test_flag BOOLEAN;';
  assert.equal(unwrapMigration(sql), sql);
});

test('migration files are applied in sorted order', () => {
  const names = getMigrationFiles().map((file) => path.basename(file));
  assert.deepEqual(names, [...names].sort());
  assert.ok(names.includes('20261102_account_security_and_addresses.sql'));
  assert.ok(names.includes('20261102_growth_features.sql'));
  assert.ok(names.includes('20261103_order_lifecycle_workflows.sql'));
});
