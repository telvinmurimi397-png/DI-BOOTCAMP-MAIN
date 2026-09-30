const path = require('node:path');
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const cleanupRoutes = require('./routes/cleanupRoutes');
const csrRoutes = require('./routes/csrRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { readDatabase } = require('./db');

const app = express();
const port = process.env.PORT || 3003;
const frontend = path.join(__dirname, '..', 'frontend');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(frontend));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.get('/api/health', async (req, res) => {
  await readDatabase();
  res.json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cleanups', cleanupRoutes);
app.use('/api/csr', csrRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Photos must be 5 MB or smaller.' });
  if (error.message === 'Only image files are accepted.') return res.status(415).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

if (require.main === module) {
  app.listen(port, () => console.log(`MtaaClean is running at http://localhost:${port}`));
}

module.exports = app;