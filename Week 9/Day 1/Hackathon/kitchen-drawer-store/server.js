require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'db') }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
  })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user, cart count and flash message available in every view
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  const cart = req.session.cart || [];
  res.locals.cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  res.locals.message = req.session.message || null;
  delete req.session.message;
  next();
});

app.use('/', require('./routes/shop'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).render('404', { title: 'Page Not Found' }));

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`The Kitchen Drawer is running at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.log(`Port ${port} is busy, trying http://localhost:${nextPort}`);
      startServer(nextPort);
      return;
    }

    throw error;
  });
};

startServer(DEFAULT_PORT);
