const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = require('../models/userModel');

const publicRoles = new Set(['company', 'organization', 'volunteer']);

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

function sendAuthResponse(res, user, status = 200) {
  return res.status(status).json({
    message: status === 201 ? 'Account created.' : 'Signed in.',
    token: createToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

async function register(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const role = typeof req.body.role === 'string' ? req.body.role : '';

  if (!name || name.length > 150) {
    return res.status(400).json({ error: 'Enter a name of 1 to 150 characters.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' });
  }
  if (!publicRoles.has(role)) {
    return res.status(400).json({ error: 'Choose a valid account type.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await users.create({ name, email, passwordHash, role });
    return sendAuthResponse(res, user, 201);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('Registration failed:', error.message);
    return res.status(500).json({ error: 'Could not create your account right now.' });
  }
}

async function login(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  try {
    const user = await users.findByEmail(email);
    const validPassword = user && await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    return sendAuthResponse(res, user);
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({ error: 'Could not sign in right now.' });
  }
}

async function me(req, res) {
  try {
    const user = await users.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
    return res.json({ user });
  } catch (error) {
    console.error('Account lookup failed:', error.message);
    return res.status(500).json({ error: 'Could not load your account.' });
  }
}

module.exports = { register, login, me };