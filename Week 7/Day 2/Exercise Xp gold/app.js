require('dotenv').config();

const express = require('express');
const db = require('./server/config/db');
const todosRouter = require('./server/routes/todos');

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json());
app.use('/api/todos', todosRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => console.log(`Todo API listening on port ${port}`));
}

module.exports = { app, db };