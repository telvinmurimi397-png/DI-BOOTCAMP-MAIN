const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');
const LOCK_KEY = 731904;

function getMigrationFiles(directory = MIGRATIONS_DIR) {
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => path.join(directory, name));
}

function unwrapMigration(sql) {
  return sql
    .replace(/^\uFEFF?\s*BEGIN\s*;\s*/i, '')
    .replace(/\s*COMMIT\s*;\s*$/i, '');
}

async function runMigrations() {
  const { Client } = require('pg');
  const env = require('../src/config/env');
  const client = new Client({
    connectionString: env.databaseUrl,
    ssl: env.pgSsl ? { rejectUnauthorized: false } : undefined
  });

  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS stokana_schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    for (const file of getMigrationFiles()) {
      const name = path.basename(file);
      const applied = await client.query(
        'SELECT 1 FROM stokana_schema_migrations WHERE name = $1',
        [name]
      );
      if (applied.rowCount) continue;

      await client.query('BEGIN');
      try {
        await client.query(unwrapMigration(fs.readFileSync(file, 'utf8')));
        await client.query(
          'INSERT INTO stokana_schema_migrations (name) VALUES ($1)',
          [name]
        );
        await client.query('COMMIT');
        console.log(`Applied database migration ${name}.`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Database migration ${name} failed: ${error.message}`, { cause: error });
      }
    }
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigrations().catch((error) => {
    console.error(`Database migrations failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { getMigrationFiles, unwrapMigration, runMigrations };
