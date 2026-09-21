// Mtaafix backend entry point.
// Loads .env (if present), initialises the database, wires middleware & routes.

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// --- minimal .env loader (no dependency) ------------------------------------
(function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['\"]|['\"]$/g, '');
  }
})();

const db = require('./src/db');
const { UPLOAD_DIR } = require('./src/uploads');
const routes = require('./src/routes');
const seed = require('./src/seed');

const PORT = process.env.PORT || 4000;

function parseAllowedOrigins(value) {
  if (!value || value.trim() === '*') {
    return [
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5500',
      'http://localhost:5500'
    ];
  }

  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.CORS_ORIGIN);

// Build the fully-wired Express app (used by server startup and tests).
async function createApp() {
  await db.init();
  await seed.ensureSeed();

  const app = express();

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  app.use(cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Admin-Token']
  }));

  app.use(express.json({ limit: '8mb' }));            // base64 photos can be large
  app.use(express.urlencoded({ extended: true, limit: '8mb' }));

  // uploaded photos (read-only)
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

  // optionally serve the bundled demo frontend from /public
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) app.use('/', express.static(publicDir));

  app.use('/api', routes);

  // 404 for unknown API routes
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // central error handler (multer + unexpected)
  app.use((err, req, res, next) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Photo too large (max 5 MB)' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

async function main() {
  if (!process.env.ADMIN_TOKEN || process.env.ADMIN_TOKEN.trim() === '') {
    throw new Error('ADMIN_TOKEN must be set in the environment before starting the server.');
  }

  const app = await createApp();
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Mtaafix API running at http://127.0.0.1:${PORT}`);
    console.log(`  Demo frontend: http://127.0.0.1:${PORT}/`);
    console.log(`  Health check:  http://127.0.0.1:${PORT}/api/health`);
  });
}

module.exports = { createApp };

// Only start listening when run directly (not when imported by tests).
if (require.main === module) {
  main().catch(err => { console.error('Failed to start:', err); process.exit(1); });
}