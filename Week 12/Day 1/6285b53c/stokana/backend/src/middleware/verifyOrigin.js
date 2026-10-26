const env = require('../config/env');

function verifyOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) return next();

  let normalized;
  try {
    normalized = new URL(origin).origin;
  } catch {
    return res.status(403).json({ message: 'Request origin could not be verified.' });
  }

  if (!env.allowedOrigins.includes(normalized)) {
    return res.status(403).json({
      message: 'This request was blocked because it came from an untrusted origin.'
    });
  }
  next();
}

module.exports = verifyOrigin;
