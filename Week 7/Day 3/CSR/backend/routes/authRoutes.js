const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const express = require('express');
const { readDatabase, updateDatabase } = require('../db');
const { createToken, requireAuth } = require('../auth');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeUser(user) {
  const { passwordHash, ...profile } = user;
  return profile;
}

router.post('/register', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
  if (name.length < 2 || name.length > 80 || !emailPattern.test(email) || password.length < 8 || password.length > 128 || location.length < 2) {
    return res.status(400).json({ error: 'Enter a name, valid email, location, and password of at least 8 characters.' });
  }

  const user = { id: crypto.randomUUID(), name, email, passwordHash: await bcrypt.hash(password, 12), phone, role: 'resident', location, createdAt: new Date().toISOString() };
  const result = await updateDatabase((database) => {
    if (database.users.some((item) => item.email.toLowerCase() === email)) return false;
    database.users.push(user);
    return true;
  });
  if (!result) return res.status(409).json({ error: 'An account with this email already exists.' });
  res.status(201).json({ token: createToken(user), user: safeUser(user) });
});

router.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const user = (await readDatabase()).users.find((item) => item.email.toLowerCase() === email);
  if (!user || !await bcrypt.compare(password, user.passwordHash)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: createToken(user), user: safeUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = (await readDatabase()).users.find((item) => item.id === req.auth.sub);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  res.json({ user: safeUser(user) });
});

router.patch('/me', requireAuth, async (req, res) => {
  const result = await updateDatabase((database) => {
    const user = database.users.find((item) => item.id === req.auth.sub);
    if (!user) return null;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : user.name;
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : user.phone;
    const location = typeof req.body?.location === 'string' ? req.body.location.trim() : user.location;
    if (name.length < 2 || location.length < 2) return { error: 'Name and location are required.' };
    Object.assign(user, { name, phone, location });
    return { user };
  });
  if (!result) return res.status(404).json({ error: 'Account not found.' });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ user: safeUser(result.user) });
});

module.exports = router;