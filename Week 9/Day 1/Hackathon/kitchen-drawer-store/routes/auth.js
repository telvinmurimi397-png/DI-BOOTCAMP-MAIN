const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Create Account', error: null });
});

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.render('auth/register', {
      title: 'Create Account',
      error: 'All fields are required. Password must be at least 6 characters.',
    });
  }
  const cleanEmail = email.trim().toLowerCase();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)) {
    return res.render('auth/register', { title: 'Create Account', error: 'That email is already registered.' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name.trim(), cleanEmail, hash);
  req.session.user = { id: result.lastInsertRowid, name: name.trim(), email: cleanEmail, role: 'customer' };
  res.redirect('/');
});

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login', error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get((email || '').trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.render('auth/login', { title: 'Login', error: 'Invalid email or password.' });
  }
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.redirect(user.role === 'admin' ? '/admin' : '/');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/account', requireAuth, (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.session.user.id);
  res.render('auth/account', { title: 'My Account', orders });
});

module.exports = router;
