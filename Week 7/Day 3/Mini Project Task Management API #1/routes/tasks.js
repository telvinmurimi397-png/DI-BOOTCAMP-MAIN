const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');

const router = express.Router();
const tasksFilePath = path.join(__dirname, '..', 'data', 'tasks.json');

async function readTasks() {
  const contents = await fs.readFile(tasksFilePath, 'utf8');
  const tasks = JSON.parse(contents);
  if (!Array.isArray(tasks)) throw new Error('Task storage must contain a JSON array');
  return tasks;
}

async function writeTasks(tasks) {
  await fs.writeFile(tasksFilePath, `${JSON.stringify(tasks, null, 2)}\n`);
}

function parseTaskId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateTask(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return null;
  if (body.description !== undefined && typeof body.description !== 'string') return null;
  if (body.completed !== undefined && typeof body.completed !== 'boolean') return null;

  return {
    title,
    description: typeof body.description === 'string' ? body.description.trim() : '',
    completed: body.completed ?? false
  };
}

router.get('/', async (req, res) => {
  res.json(await readTasks());
});

router.get('/:id', async (req, res) => {
  const id = parseTaskId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'Task ID must be a positive integer' });

  const task = (await readTasks()).find((item) => item.id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/', async (req, res) => {
  const fields = validateTask(req.body);
  if (!fields) {
    return res.status(400).json({ error: 'A non-empty title and valid optional fields are required' });
  }

  const tasks = await readTasks();
  const task = {
    id: tasks.reduce((highestId, item) => Math.max(highestId, item.id || 0), 0) + 1,
    ...fields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tasks.push(task);
  await writeTasks(tasks);
  res.location(`/tasks/${task.id}`).status(201).json(task);
});

router.put('/:id', async (req, res) => {
  const id = parseTaskId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'Task ID must be a positive integer' });

  const fields = validateTask(req.body);
  if (!fields) {
    return res.status(400).json({ error: 'A non-empty title and valid optional fields are required' });
  }

  const tasks = await readTasks();
  const taskIndex = tasks.findIndex((item) => item.id === id);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

  const updatedTask = {
    ...tasks[taskIndex],
    ...fields,
    updatedAt: new Date().toISOString()
  };
  tasks[taskIndex] = updatedTask;
  await writeTasks(tasks);
  res.json(updatedTask);
});

router.delete('/:id', async (req, res) => {
  const id = parseTaskId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'Task ID must be a positive integer' });

  const tasks = await readTasks();
  const taskIndex = tasks.findIndex((item) => item.id === id);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

  tasks.splice(taskIndex, 1);
  await writeTasks(tasks);
  res.status(204).end();
});

module.exports = router;