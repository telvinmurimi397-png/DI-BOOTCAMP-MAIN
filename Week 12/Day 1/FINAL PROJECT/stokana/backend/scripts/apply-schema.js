const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Set DATABASE_URL to the intended PostgreSQL database before applying the schema.');
}

const sslEnabled = ['1', 'true', 'yes', 'on'].includes(
  String(process.env.PGSSL || '').toLowerCase()
);
const schemaPath = path.join(__dirname, '../../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

async function applySchema() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined
  });

  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT current_database() AS database,
              COALESCE(
                array_agg(table_name ORDER BY table_name),
                ARRAY[]::text[]
              ) AS tables
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const tables = rows[0].tables;
    console.log(`Connected to database "${rows[0].database}".`);
    if (tables.length) {
      throw new Error(
        `Refusing to apply the fresh schema because public tables already exist: ${tables.join(', ')}.`
      );
    }

    await client.query(schema);
    console.log('STOKANA schema applied successfully. No demo data was added.');
  } finally {
    await client.end();
  }
}

applySchema().catch((error) => {
  console.error(`Schema setup failed: ${error.message}`);
  process.exitCode = 1;
});
