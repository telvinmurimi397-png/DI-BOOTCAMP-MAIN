const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.pgSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

pool.on('error', (error) => {
  console.error('[db] idle client error:', error.message);
});

async function query(text, params) {
  const started = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - started;
  if (!env.isProduction && duration > 500) {
    console.warn(`[db] slow query (${duration}ms): ${text.slice(0, 120)}`);
  }
  return result;
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function ping() {
  const { rows } = await pool.query('SELECT now() AS now, current_database() AS database');
  return rows[0];
}

module.exports = { pool, query, withTransaction, ping };
