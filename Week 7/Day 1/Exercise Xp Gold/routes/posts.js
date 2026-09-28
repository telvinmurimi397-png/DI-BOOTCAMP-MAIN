const express = require('express');

const router = express.Router();
const posts = [];
let nextPostId = 1;

// Exercise Xp Gold: in-memory blog post CRUD routes.
function findPost(id) {
  const postId = Number(id);
  if (!Number.isSafeInteger(postId) || postId < 1) return null;
  return posts.find((post) => post.id === postId) || null;
}

function validatePostFields(body) {
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!title || !content) return null;
  return { title, content };
}

router.get('/', (req, res) => {
  res.json(posts);
});

router.get('/:id', (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

router.post('/', (req, res) => {
  const fields = validatePostFields(req.body);
  if (!fields) {
    return res.status(400).json({ error: 'Non-empty title and content are required' });
  }

  const post = {
    id: nextPostId++,
    ...fields,
    timestamp: new Date().toISOString()
  };
  posts.push(post);
  res.location(`/posts/${post.id}`).status(201).json(post);
});

router.put('/:id', (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const fields = validatePostFields(req.body);
  if (!fields) {
    return res.status(400).json({ error: 'Non-empty title and content are required' });
  }

  post.title = fields.title;
  post.content = fields.content;
  res.json(post);
});

router.delete('/:id', (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  posts.splice(posts.indexOf(post), 1);
  res.status(204).end();
});

module.exports = router;