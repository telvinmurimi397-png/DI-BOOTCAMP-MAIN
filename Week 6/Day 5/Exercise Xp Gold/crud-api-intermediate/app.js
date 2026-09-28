const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;
const postsUrl = 'https://jsonplaceholder.typicode.com/posts';

app.use(express.json());

app.get('/api/posts', async (req, res, next) => {
  try {
    const response = await axios.get(postsUrl);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/posts/:id', async (req, res, next) => {
  try {
    const response = await axios.get(`${postsUrl}/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/posts', async (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || !Object.keys(req.body).length) {
    return res.status(400).json({ error: 'A post body is required' });
  }

  try {
    const response = await axios.post(postsUrl, req.body);
    res.status(201).json(response.data);
  } catch (error) {
    next(error);
  }
});

app.put('/api/posts/:id', async (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || !Object.keys(req.body).length) {
    return res.status(400).json({ error: 'Updated post data is required' });
  }

  try {
    const response = await axios.put(`${postsUrl}/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/posts/:id', async (req, res, next) => {
  try {
    const response = await axios.delete(`${postsUrl}/${req.params.id}`);
    res.status(200).json({ message: 'Post deleted', data: response.data });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  const status = error.response?.status === 404 ? 404 : 502;
  console.error('JSONPlaceholder request failed:', error.message);
  res.status(status).json({ error: status === 404 ? 'Post not found' : 'External posts service unavailable' });
});

app.listen(port, () => {
  console.log(`Intermediate CRUD API is running on port ${port}`);
});