const fs = require('fs');
const http = require('http');
const path = require('path');
const express = require('express');
const helmet = require('helmet');

const env = require('./config/env');
const db = require('./config/db');
const createSessionMiddleware = require('./config/session');
const apiRoutes = require('./routes');
const { attachUser } = require('./middleware/auth');
const verifyOrigin = require('./middleware/verifyOrigin');
const { notFoundApi, errorHandler } = require('./middleware/error');
const createChatServer = require('./sockets/chat');

const app = express();
const server = http.createServer(app);

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy ? 1 : false);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        ...(env.isProduction ? { upgradeInsecureRequests: [] } : {})
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

fs.mkdirSync(path.join(env.uploadDir, 'products'), { recursive: true });

const sessionMiddleware = createSessionMiddleware(db.pool);

app.get('/api/health', async (req, res) => {
  try {
    const info = await db.ping();
    res.json({
      status: 'ok',
      database: info.database,
      time: info.now,
      uptime: Math.round(process.uptime())
    });
  } catch (error) {
    res.status(503).json({ status: 'unavailable', message: 'Database connection failed.' });
  }
});

app.use('/api', verifyOrigin, sessionMiddleware, attachUser, apiRoutes);
app.use('/api', notFoundApi);

app.use(
  '/uploads',
  express.static(env.uploadDir, {
    fallthrough: true,
    maxAge: env.isProduction ? '7d' : 0,
    immutable: env.isProduction
  })
);

app.use(
  '/assets',
  express.static(path.join(env.frontendDir, 'assets'), {
    fallthrough: true,
    maxAge: env.isProduction ? '30d' : 0,
    immutable: env.isProduction
  })
);

const PAGE_ROUTES = new Map([
  ['/', 'pages/home.html'],
  ['/explore', 'pages/explore.html'],
  ['/categories', 'pages/categories.html'],
  ['/shops', 'pages/shops.html'],
  ['/cart', 'pages/cart.html'],
  ['/checkout', 'pages/checkout.html'],
  ['/login', 'pages/login.html'],
  ['/register', 'pages/register.html'],
  ['/forgot-password', 'pages/forgot-password.html'],
  ['/reset-password', 'pages/reset-password.html'],
  ['/help', 'pages/help.html'],
  ['/refunds', 'pages/refunds.html'],
  ['/terms', 'pages/terms.html'],
  ['/privacy', 'pages/privacy.html'],
  ['/account', 'pages/account.html'],
  ['/account/orders', 'pages/account-orders.html'],
  ['/account/order', 'pages/order-detail.html'],
  ['/account/messages', 'pages/messages.html'],
  ['/account/reviews', 'pages/account-reviews.html'],
  ['/seller', 'pages/seller-dashboard.html'],
  ['/seller/products', 'pages/seller-products.html'],
  ['/seller/products/new', 'pages/seller-product-form.html'],
  ['/seller/products/edit', 'pages/seller-product-form.html'],
  ['/seller/orders', 'pages/seller-orders.html'],
  ['/seller/messages', 'pages/seller-messages.html'],
  ['/seller/sales', 'pages/seller-sales.html'],
  ['/seller/shop', 'pages/seller-shop.html'],
  ['/admin', 'pages/admin-dashboard.html'],
  ['/admin/users', 'pages/admin-users.html'],
  ['/admin/sellers', 'pages/admin-sellers.html'],
  ['/admin/products', 'pages/admin-products.html'],
  ['/admin/categories', 'pages/admin-categories.html'],
  ['/admin/orders', 'pages/admin-orders.html'],
  ['/admin/reports', 'pages/admin-reports.html'],
  ['/admin/commissions', 'pages/admin-commissions.html'],
  ['/admin/settings', 'pages/admin-settings.html']
]);

function sendPage(res, relativeFile) {
  res.sendFile(path.join(env.frontendDir, relativeFile));
}

app.get('/index.html', (req, res) => res.redirect(301, '/'));

app.get(/^\/product\/[a-z0-9-]+$/i, (req, res) => sendPage(res, 'pages/product.html'));
app.get(/^\/shop\/[a-z0-9-]+$/i, (req, res) => sendPage(res, 'pages/shop.html'));

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const clean = req.path.length > 1 && req.path.endsWith('/')
    ? req.path.slice(0, -1)
    : req.path;

  if (PAGE_ROUTES.has(clean)) return sendPage(res, PAGE_ROUTES.get(clean));

  if (/^\/pages\/[a-z0-9-]+\.html$/i.test(req.path)) {
    return sendFileIfPresent(res, next, req.path.slice(1));
  }

  next();
});

function sendFileIfPresent(res, next, relativeFile) {
  const absolute = path.join(env.frontendDir, relativeFile);
  if (absolute.startsWith(env.frontendDir) && fs.existsSync(absolute)) {
    return res.sendFile(absolute);
  }
  next();
}

app.use(
  express.static(env.frontendDir, {
    index: false,
    extensions: ['html'],
    maxAge: env.isProduction ? '1h' : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    }
  })
);

app.use((req, res, next) => {
  if (req.accepts(['html', 'json']) === 'json') {
    return res.status(404).json({ message: 'Page not found.' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(404).send('Not found');
  }
  const notFoundPage = path.join(env.frontendDir, 'pages/404.html');
  if (fs.existsSync(notFoundPage)) return res.status(404).sendFile(notFoundPage);
  res.status(404).send('Page not found');
});

app.use(errorHandler);

const io = createChatServer(server, sessionMiddleware);
app.set('io', io);

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[app] ${signal} received, shutting down...`);
  server.close(async () => {
    try {
      await db.pool.end();
    } finally {
      process.exit(0);
    }
  });
  io.close();
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[app] unhandled promise rejection:', reason);
});

async function start() {
  try {
    const info = await db.ping();
    console.log(`[db] connected to "${info.database}"`);
  } catch (error) {
    console.error('[db] could not connect:', error.message);
    console.error('     Check DATABASE_URL in backend/.env, then run the schema and seed.');
    process.exit(1);
  }

  server.listen(env.port, () => {
    console.log(`[app] STOKANA running at ${env.appUrl}`);
    console.log(`[app] environment: ${env.nodeEnv} | payments: ${env.paymentProvider}`);
    if (!env.isProduction) {
      console.log(`[app] demo accounts (after seeding): admin@stokana.co.ke / Admin@2026`);
    }
  });
}

start();

module.exports = { app, server };
