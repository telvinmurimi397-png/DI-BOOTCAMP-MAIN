const express = require('express');
const pageRoutes = require('./routes');
const todoRoutes = require('./routes/todos');
const bookRoutes = require('./routes/books');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Mount each exercise's router at its own URL prefix.
app.use('/', pageRoutes);
app.use('/todos', todoRoutes);
app.use('/books', bookRoutes);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Exercise Xp server is running at http://localhost:${port}`);
  });
}

module.exports = app;