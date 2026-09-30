const path = require('node:path');
const express = require('express');
const usersRouter = require('./routes/users');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', usersRouter);

app.get('/', (req, res) => res.redirect('/login.html'));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }

  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (require.main === module) {
  app.listen(port, () => console.log(`User Management API is running at http://localhost:${port}`));
}

module.exports = app;