const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  getMigrationFiles,
  initializeSchemaIfEmpty,
  unwrapMigration
} = require('../scripts/migrate');

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
  assert.ok(names.includes('20261105_initial_categories.sql'));
});

test('production start applies migrations before starting the server', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
  );
  assert.match(packageJson.scripts.start, /db:migrate.*src\/app\.js/);
});

test('migration runner initializes a completely empty database', async () => {
  const queries = [];
  const client = {
    async query(sql) {
      queries.push(sql);
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ has_users: false, has_tables: false }] };
      }
      return { rows: [] };
    }
  };

  assert.equal(await initializeSchemaIfEmpty(client), true);
  assert.ok(queries.includes('BEGIN'));
  assert.ok(queries.some((sql) => sql.includes('CREATE TABLE users')));
  assert.ok(queries.includes('COMMIT'));
});

test('migration runner initializes a database containing only its tracking table', async () => {
  const queries = [];
  const client = {
    async query(sql) {
      queries.push(sql);
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ has_users: false, has_tables: false }] };
      }
      return { rows: [] };
    }
  };

  assert.equal(await initializeSchemaIfEmpty(client), true);
  assert.ok(queries.some((sql) => sql.includes("table_name <> 'stokana_schema_migrations'")));
  assert.ok(queries.some((sql) => sql.includes('CREATE TABLE users')));
});

test('migration runner refuses to initialize a partial database', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ has_users: false, has_tables: true }] };
      }
      throw new Error('Unexpected database mutation.');
    }
  };

  await assert.rejects(
    initializeSchemaIfEmpty(client),
    /partial database/
  );
});
