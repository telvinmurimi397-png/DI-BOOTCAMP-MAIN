const pool = require('../config/database');

async function findByEmail(email) {
  const result = await pool.query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function create({ name, email, passwordHash, role }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, passwordHash, role]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query(
    'SELECT id, name, email, role FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { findByEmail, create, findById };