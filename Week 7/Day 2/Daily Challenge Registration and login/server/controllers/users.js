const bcrypt = require('bcrypt');
const users = require('../models/users');

const BCRYPT_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;
const EDITABLE_FIELDS = ['email', 'username', 'first_name', 'last_name', 'password'];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validEmail(value) {
  return typeof value === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validName(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validPassword(value) {
  return typeof value === 'string'
    && value.length >= 8
    && Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES;
}

function parseId(value) {
  if (!/^\d+$/.test(value) || Number(value) < 1) return null;
  return Number(value);
}

function registrationValues(body) {
  if (!isObject(body)) return { error: 'Request body must be a JSON object' };
  if (!validEmail(body.email)) return { error: 'A valid email is required' };
  if (!validName(body.username)) return { error: 'A non-empty username is required' };
  if (!validPassword(body.password)) {
    return { error: 'Password must be 8 to 72 UTF-8 bytes' };
  }
  if (body.first_name !== undefined && !validName(body.first_name)) {
    return { error: 'first_name must be a non-empty string' };
  }
  if (body.last_name !== undefined && !validName(body.last_name)) {
    return { error: 'last_name must be a non-empty string' };
  }

  return {
    values: {
      user: {
        email: body.email.trim(),
        username: body.username.trim(),
        first_name: body.first_name?.trim() || null,
        last_name: body.last_name?.trim() || null,
      },
      password: body.password,
    },
  };
}

function updateValues(body) {
  if (!isObject(body)) return { error: 'Request body must be a JSON object' };
  const fields = Object.keys(body).filter((field) => EDITABLE_FIELDS.includes(field));
  if (fields.length === 0) return { error: 'Provide at least one editable user field' };

  const values = {};
  for (const field of fields) {
    const value = body[field];
    if (field === 'email') {
      if (!validEmail(value)) return { error: 'A valid email is required' };
      values.email = value.trim();
    } else if (field === 'username') {
      if (!validName(value)) return { error: 'username must be a non-empty string' };
      values.username = value.trim();
    } else if (field === 'first_name' || field === 'last_name') {
      if (value !== null && !validName(value)) {
        return { error: `${field} must be a non-empty string or null` };
      }
      values[field] = value === null ? null : value.trim();
    } else {
      if (!validPassword(value)) return { error: 'Password must be 8 to 72 UTF-8 bytes' };
      values.password = value;
    }
  }

  return { values };
}

async function register(req, res) {
  const result = registrationValues(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  const passwordHash = await bcrypt.hash(result.values.password, BCRYPT_ROUNDS);
  const user = await users.create(result.values.user, passwordHash);
  res.status(201).json({ user });
}

async function login(req, res) {
  if (!isObject(req.body) || !validName(req.body.username)
  || typeof req.body.password !== 'string'
  || Buffer.byteLength(req.body.password, 'utf8') > MAX_PASSWORD_BYTES) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = await users.findForLogin(req.body.username.trim());
  if (!user || !await bcrypt.compare(req.body.password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  delete user.passwordHash;
  res.json({ message: 'Login successful', user });
}

async function getAll(req, res) {
  res.json(await users.list());
}

async function getById(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id must be a positive integer' });

  const user = await users.find(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}

async function update(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id must be a positive integer' });

  const result = updateValues(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  const changes = { ...result.values };
  if (changes.password) {
    changes.passwordHash = await bcrypt.hash(changes.password, BCRYPT_ROUNDS);
    delete changes.password;
  }

  const user = await users.update(id, changes);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}

module.exports = { register, login, getAll, getById, update };