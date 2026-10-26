const session = require('express-session');
const PgStore = require('connect-pg-simple')(session);
const env = require('./env');

function createSessionMiddleware(pool) {
  const store = new PgStore({
    pool,
    tableName: 'session',
    createTableIfMissing: false,
    pruneSessionInterval: 60 * 15
  });

  return session({
    name: env.session.name,
    secret: env.sessionSecret,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.cookieSecure,
      maxAge: env.session.maxAgeMs
    }
  });
}

module.exports = createSessionMiddleware;
