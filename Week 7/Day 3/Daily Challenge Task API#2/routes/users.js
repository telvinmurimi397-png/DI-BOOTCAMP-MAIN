const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcrypt');
const express = require('express');

const router = express.Router();
const usersFilePath = path.join(__dirname, '..', 'users.json');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_.-]{3,24}$/;

async function readUsers() {
  const content = await fs.readFile(usersFilePath, 'utf8');
  const users = JSON.parse(content);
  if (!Array.isArray(users)) throw new Error('User storage must contain a JSON array.');
  return users;
}

async function writeUsers(users) {
  await fs.writeFile(usersFilePath, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function normalizeProfile(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (name.length < 1 || name.length > 60) return { error: 'Name must be between 1 and 60 characters.' };
  if (lastName.length < 1 || lastName.length > 60) return { error: 'Last name must be between 1 and 60 characters.' };
  if (!emailPattern.test(email) || email.length > 254) return { error: 'Enter a valid email address.' };
  if (!usernamePattern.test(username)) return { error: 'Username must be 3 to 24 letters, numbers, dots, underscores, or hyphens.' };
  if (password.length < 8 || password.length > 128) return { error: 'Password must be between 8 and 128 characters.' };

  return { name, lastName, email, username, usernameKey: username.toLowerCase(), password };
}

async function passwordIsUsed(users, password, excludeId) {
  for (const user of users) {
    if (user.id === excludeId) continue;
    if (await bcrypt.compare(password, user.passwordHash)) return true;
  }
  return false;
}

function getUserId(req) {
  return typeof req.params.id === 'string' ? req.params.id.trim() : '';
}

router.post('/register', async (req, res) => {
  const profile = normalizeProfile(req.body);
  if (profile.error) return res.status(400).json({ error: profile.error });

  const users = await readUsers();
  const duplicate = users.some((user) =>
    user.username.toLowerCase() === profile.usernameKey || user.email.toLowerCase() === profile.email
  );
  if (duplicate || await passwordIsUsed(users, profile.password)) {
    return res.status(409).json({ error: 'Username, email, or password already exists.' });
  }

  const user = {
    id: crypto.randomUUID(),
    name: profile.name,
    lastName: profile.lastName,
    email: profile.email,
    username: profile.username,
    passwordHash: await bcrypt.hash(profile.password, 12),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await writeUsers(users);
  res.status(201).json({ message: `User ${user.username} successfully registered.`, user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  const users = await readUsers();
  const user = users.find((item) => item.username.toLowerCase() === username.toLowerCase());
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Username or password is incorrect.' });
  }

  res.json({ message: `You are logged in as ${user.username}.`, user: publicUser(user) });
});

router.get('/users', async (req, res) => {
  const users = await readUsers();
  res.json(users.map(publicUser));
});

router.get('/users/:id', async (req, res) => {
  const user = (await readUsers()).find((item) => item.id === getUserId(req));
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(publicUser(user));
});

router.put('/users/:id', async (req, res) => {
  const users = await readUsers();
  const index = users.findIndex((item) => item.id === getUserId(req));
  if (index === -1) return res.status(404).json({ error: 'User not found.' });

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'A JSON object with user fields is required.' });
  }

  const current = users[index];
  const profile = normalizeProfile({
    name: body.name ?? current.name,
    lastName: body.lastName ?? current.lastName,
    email: body.email ?? current.email,
    username: body.username ?? current.username,
    password: body.password ?? 'unchanged-password-placeholder'
  });
  if (profile.error) return res.status(400).json({ error: profile.error });

  const duplicate = users.some((user, userIndex) => userIndex !== index &&
    (user.username.toLowerCase() === profile.usernameKey || user.email.toLowerCase() === profile.email));
  if (duplicate) return res.status(409).json({ error: 'Username or email already exists.' });
  if (body.password !== undefined) {
    if (await passwordIsUsed(users, profile.password, current.id)) {
      return res.status(409).json({ error: 'Password already exists.' });
    }
    current.passwordHash = await bcrypt.hash(profile.password, 12);
  }

  current.name = profile.name;
  current.lastName = profile.lastName;
  current.email = profile.email;
  current.username = profile.username;
  await writeUsers(users);
  res.json({ message: 'User updated.', user: publicUser(current) });
});

module.exports = router;