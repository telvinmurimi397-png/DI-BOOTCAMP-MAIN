const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
const fullName = String(process.env.ADMIN_NAME || 'STOKANA Administrator').trim();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Set ADMIN_EMAIL to a valid email address.');
}
if (
  password.length < 8 ||
  Buffer.byteLength(password, 'utf8') > 72 ||
  !/[a-z]/.test(password) ||
  !/[A-Z]/.test(password) ||
  !/[0-9]/.test(password)
) {
  throw new Error('ADMIN_PASSWORD must be 8-72 bytes and contain lowercase, uppercase, and numeric characters.');
}
if (fullName.length < 2 || fullName.length > 120) {
  throw new Error('ADMIN_NAME must be between 2 and 120 characters.');
}

const bcrypt = require('bcrypt');
const db = require('../src/config/db');

async function bootstrapAdmin() {
  const passwordHash = await bcrypt.hash(password, 12);

  await db.withTransaction(async (client) => {
    const target = await client.query(
      'SELECT id, role FROM users WHERE email = $1 FOR UPDATE',
      [email]
    );
    if (target.rowCount && target.rows[0].role !== 'admin') {
      throw new Error('ADMIN_EMAIL already belongs to a non-admin account.');
    }

    if (target.rowCount) {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, target.rows[0].id]
      );
      return;
    }

    const admins = await client.query(
      "SELECT id FROM users WHERE role = 'admin' ORDER BY id FOR UPDATE"
    );
    if (admins.rowCount > 1) {
      throw new Error('Multiple admin accounts exist; choose the admin account to update manually.');
    }
    if (admins.rowCount === 1) {
      await client.query(
        'UPDATE users SET email = $1, password_hash = $2, full_name = $3 WHERE id = $4',
        [email, passwordHash, fullName, admins.rows[0].id]
      );
      return;
    }

    await client.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')`,
      [fullName, email, passwordHash]
    );
  });

  console.log(`Admin login configured for ${email}.`);
}

bootstrapAdmin()
  .catch((error) => {
    console.error(`Admin setup failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
