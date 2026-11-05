const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'greenfuture_db',
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

module.exports = pool;