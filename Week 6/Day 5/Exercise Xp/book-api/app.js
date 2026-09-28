const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

let books = [
  { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', publishedYear: 1937 },
  { id: 2, title: 'Pride and Prejudice', author: 'Jane Austen', publishedYear: 1813 },
  { id: 3, title: 'Things Fall Apart', author: 'Chinua Achebe', publishedYear: 1958 }
];
let nextId = 4;

app.get('/api/books', (req, res) => {
  res.json(books);
});

app.get('/api/books/:bookId', (req, res) => {
  const book = books.find((item) => item.id === Number(req.params.bookId));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.status(200).json(book);
});

app.post('/api/books', (req, res) => {
  const { title, author, publishedYear } = req.body;
  if (
    typeof title !== 'string' || !title.trim() ||
    typeof author !== 'string' || !author.trim() ||
    !Number.isInteger(publishedYear)
  ) {
    return res.status(400).json({ error: 'Title, author, and publishedYear are required' });
  }

  const book = { id: nextId++, title: title.trim(), author: author.trim(), publishedYear };
  books.push(book);
  res.status(201).json(book);
});

app.put('/api/books/:bookId', (req, res) => {
  const book = books.find((item) => item.id === Number(req.params.bookId));
  if (!book) return res.status(404).json({ error: 'Book not found' });

  const { title, author, publishedYear } = req.body;
  if (
    typeof title !== 'string' || !title.trim() ||
    typeof author !== 'string' || !author.trim() ||
    !Number.isInteger(publishedYear)
  ) {
    return res.status(400).json({ error: 'Title, author, and publishedYear are required' });
  }

  book.title = title.trim();
  book.author = author.trim();
  book.publishedYear = publishedYear;
  res.json(book);
});

app.delete('/api/books/:bookId', (req, res) => {
  const index = books.findIndex((item) => item.id === Number(req.params.bookId));
  if (index === -1) return res.status(404).json({ error: 'Book not found' });
  books.splice(index, 1);
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
  console.log(`Book API is running on port ${port}`);
});