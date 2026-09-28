const { randomUUID } = require('node:crypto');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || 'development-secret-change-before-deploy';
const users = new Map();
const maxLoginAttempts = 5;
const lockDurationMs = 15 * 60 * 1000;

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set; using a development-only secret.');
}

app.use(express.json());

function publicUser(user) {
  return { id: user.id, email: user.email, role: user.role };
}

function requireAuth(req, res, next) {
  const authorization = req.get('authorization');
  const match = authorization && authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'A bearer token is required' });

  try {
    req.auth = jwt.verify(match[1], jwtSecret);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.post('/api/register', async (req, res, next) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  if (!/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'A valid email and password are required' });
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,}$/.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and include upper, lower, numeric, and special characters' });
  }
  if (users.has(email)) return res.status(409).json({ error: 'An account with this email already exists' });

  try {
    const user = {
      id: randomUUID(),
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'user',
      failedAttempts: 0,
      lockedUntil: 0
    };
    users.set(email, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/login', async (req, res, next) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  const user = users.get(email);
  if (!user || typeof password !== 'string') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.lockedUntil > Date.now()) {
    return res.status(423).json({ error: 'Account temporarily locked after too many failed login attempts' });
  }

  try {
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= maxLoginAttempts) {
        user.lockedUntil = Date.now() + lockDurationMs;
        return res.status(423).json({ error: 'Account temporarily locked after too many failed login attempts' });
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.failedAttempts = 0;
    user.lockedUntil = 0;
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '1h' });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/profile', requireAuth, (req, res) => {
  const user = users.get(req.auth.email);
  if (!user || user.id !== req.auth.sub) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status === 400 ? 400 : 500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`User login API is running on port ${port}`);
});