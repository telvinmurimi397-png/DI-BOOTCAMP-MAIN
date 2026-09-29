const todos = require('../models/todos');

function parseId(value) {
  if (!/^\d+$/.test(value) || Number(value) < 1) return null;
  return Number(value);
}

function validateTodo(body, allowEmpty = false) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'request body must be a JSON object' };
  }

  const values = {};

  if (Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return { error: 'title must be a non-empty string' };
    }
    values.title = body.title.trim();
  } else if (!allowEmpty) {
    return { error: 'title is required' };
  }

  if (Object.hasOwn(body, 'completed')) {
    if (typeof body.completed !== 'boolean') {
      return { error: 'completed must be a boolean' };
    }
    values.completed = body.completed;
  } else if (!allowEmpty) {
    values.completed = false;
  }

  if (allowEmpty && Object.keys(values).length === 0) {
    return { error: 'provide title or completed to update' };
  }

  return { values };
}

async function getAll(req, res) {
  res.json(await todos.list());
}

async function getById(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id must be a positive integer' });

  const todo = await todos.find(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
}

async function create(req, res) {
  const result = validateTodo(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  const todo = await todos.create(result.values);
  res.status(201).json(todo);
}

async function update(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id must be a positive integer' });

  const result = validateTodo(req.body, true);
  if (result.error) return res.status(400).json({ error: result.error });

  const todo = await todos.update(id, result.values);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
}

async function remove(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id must be a positive integer' });

  const deleted = await todos.remove(id);
  if (!deleted) return res.status(404).json({ error: 'Todo not found' });
  res.status(204).end();
}

module.exports = { getAll, getById, create, update, remove };