const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let posts = [
  { id: 1, title: 'Welcome to the blog', content: 'This is the first post.' },
  { id: 2, title: 'Writing with Express', content: 'A simple REST API example.' }
];
let nextId = 3;

app.get('/posts', (req, res) => {
  res.json(posts);
});

app.get('/posts/:id', (req, res) => {
  const post = posts.find((item) => item.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

app.post('/posts', (req, res) => {
  const { title, content } = req.body;
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const post = { id: nextId++, title: title.trim(), content: content.trim() };
  posts.push(post);
  res.status(201).json(post);
});

app.put('/posts/:id', (req, res) => {
  const post = posts.find((item) => item.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { title, content } = req.body;
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  post.title = title.trim();
  post.content = content.trim();
  res.json(post);
});

app.delete('/posts/:id', (req, res) => {
  const index = posts.findIndex((item) => item.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Post not found' });
  posts.splice(index, 1);
  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Blog API is running on port ${port}`);
});