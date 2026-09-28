const express = require('express');
const { fetchPosts } = require('./data/dataService');

const app = express();
const port = process.env.PORT || 5000;

app.get('/api/posts', async (req, res, next) => {
  try {
    const posts = await fetchPosts();
    console.log('Posts retrieved from JSONPlaceholder and sent to the client');
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Failed to retrieve posts:', err.message);
  res.status(502).json({ error: 'Unable to retrieve posts from the upstream service' });
});

app.listen(port, () => {
  console.log(`Posts API is running on port ${port}`);
});