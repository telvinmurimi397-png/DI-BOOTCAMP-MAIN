const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'mtaaclean-local-development-secret';

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    req.auth = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.auth?.role)) return res.status(403).json({ error: 'You do not have permission to do that.' });
    next();
  };
}

module.exports = { createToken, requireAuth, requireRole };