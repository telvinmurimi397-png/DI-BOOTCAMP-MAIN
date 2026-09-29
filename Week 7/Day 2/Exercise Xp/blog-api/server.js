require('dotenv').config();

const express = require('express');
const db = require('./server/config/db');
const postsRouter = require('./server/routes/posts');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use('/posts', postsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => console.log(`Blog API listening on port ${port}`));
}

module.exports = { app, db };