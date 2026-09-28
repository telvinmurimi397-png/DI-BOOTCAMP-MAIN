const express = require('express');
const postsRouter = require('./routes/posts');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/posts', postsRouter);

// Return JSON for malformed request bodies and unexpected server errors.
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON' });
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Blog API is running at http://localhost:${port}`);
  });
}

module.exports = app;