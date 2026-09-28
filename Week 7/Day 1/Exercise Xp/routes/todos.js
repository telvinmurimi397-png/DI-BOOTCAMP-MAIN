const express = require('express');

const router = express.Router();
const todos = [];
let nextTodoId = 1;

// Exercise 2: in-memory to-do CRUD routes.
router.get('/', (req, res) => {
  res.json(todos);
});

router.post('/', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'A non-empty title is required' });
  if (req.body.completed !== undefined && typeof req.body.completed !== 'boolean') {
    return res.status(400).json({ error: 'completed must be a boolean' });
  }

  const todo = { id: nextTodoId++, title, completed: req.body.completed ?? false };
  todos.push(todo);
  res.status(201).json(todo);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((item) => item.id === id);
  if (!todo) return res.status(404).json({ error: 'To-do item not found' });

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'A non-empty title is required' });
  if (req.body.completed !== undefined && typeof req.body.completed !== 'boolean') {
    return res.status(400).json({ error: 'completed must be a boolean' });
  }

  todo.title = title;
  if (req.body.completed !== undefined) todo.completed = req.body.completed;
  res.json(todo);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = todos.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ error: 'To-do item not found' });

  todos.splice(index, 1);
  res.status(204).end();
});

module.exports = router;