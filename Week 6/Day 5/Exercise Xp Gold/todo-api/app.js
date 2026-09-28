const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

let todos = [
  { id: 1, title: 'Review Express routes', completed: false },
  { id: 2, title: 'Test the todo API', completed: true }
];
let nextId = 3;

app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.get('/api/todos/:id', (req, res) => {
  const todo = todos.find((item) => item.id === Number(req.params.id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

app.post('/api/todos', (req, res) => {
  const { title, completed = false } = req.body;
  if (typeof title !== 'string' || !title.trim() || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'A non-empty title and boolean completed value are required' });
  }

  const todo = { id: nextId++, title: title.trim(), completed };
  todos.push(todo);
  res.status(201).json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const todo = todos.find((item) => item.id === Number(req.params.id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  const { title, completed } = req.body;
  if (typeof title !== 'string' || !title.trim() || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'A non-empty title and boolean completed value are required' });
  }

  todo.title = title.trim();
  todo.completed = completed;
  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const index = todos.findIndex((item) => item.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });
  todos.splice(index, 1);
  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status === 400 ? 400 : 500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Todo API is running on port ${port}`);
});