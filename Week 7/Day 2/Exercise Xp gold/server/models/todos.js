const db = require('../config/db');

function list() {
  return db('tasks').select('*').orderBy('id');
}

function find(id) {
  return db('tasks').where({ id }).first();
}

async function create(todo) {
  const [created] = await db('tasks').insert(todo).returning('*');
  return created;
}

async function update(id, todo) {
  const [updated] = await db('tasks').where({ id }).update(todo).returning('*');
  return updated;
}

async function remove(id) {
  const deleted = await db('tasks').where({ id }).del();
  return deleted > 0;
}

module.exports = { list, find, create, update, remove };