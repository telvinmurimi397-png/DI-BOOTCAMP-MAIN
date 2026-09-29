require('dotenv').config();

const connection = process.env.DATABASE_URL || {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'registration_api',
};

module.exports = {
  development: {
    client: 'pg',
    connection,
    migrations: { directory: './server/migrations' },
  },
};