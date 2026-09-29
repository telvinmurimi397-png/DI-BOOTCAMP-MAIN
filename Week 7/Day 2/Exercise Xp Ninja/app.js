require('dotenv').config();

const path = require('path');
const express = require('express');
const quizRouter = require('./server/routes/quiz');

const app = express();
const port = Number(process.env.PORT || 3002);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', quizRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => console.log(`Quiz app listening on port ${port}`));
}

module.exports = app;