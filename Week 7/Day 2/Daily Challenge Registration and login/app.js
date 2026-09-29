require('dotenv').config();

const express = require('express');
const usersRouter = require('./server/routes/users');

const app = express();
const port = Number(process.env.PORT || 3003);

app.use(express.json());
app.use('/', usersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (error.code === '23505') {
    return res.status(409).json({ error: 'Username or email is already registered' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => console.log(`Registration API listening on port ${port}`));
}

module.exports = app;