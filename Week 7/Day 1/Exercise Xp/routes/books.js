const express = require('express');

const router = express.Router();
const books = [];
let nextBookId = 1;

// Exercise 3: in-memory book CRUD routes.
router.get('/', (req, res) => {
  res.json(books);
});

router.post('/', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const author = typeof req.body?.author === 'string' ? req.body.author.trim() : '';
  if (!title || !author) {
    return res.status(400).json({ error: 'Non-empty title and author are required' });
  }
  if (req.body.year !== undefined && !Number.isInteger(req.body.year)) {
    return res.status(400).json({ error: 'year must be an integer' });
  }

  const book = { id: nextBookId++, title, author, year: req.body.year ?? null };
  books.push(book);
  res.status(201).json(book);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((item) => item.id === id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const author = typeof req.body?.author === 'string' ? req.body.author.trim() : '';
  if (!title || !author) {
    return res.status(400).json({ error: 'Non-empty title and author are required' });
  }
  if (req.body.year !== undefined && req.body.year !== null && !Number.isInteger(req.body.year)) {
    return res.status(400).json({ error: 'year must be an integer or null' });
  }

  book.title = title;
  book.author = author;
  book.year = req.body.year ?? null;
  res.json(book);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = books.findIndex((item) => item.id === id);
  if (index === -1) return res.status(404).json({ error: 'Book not found' });

  books.splice(index, 1);
  res.status(204).end();
});

module.exports = router;