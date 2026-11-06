require('dotenv').config();

const path = require('path');
const express = require('express');
const adminRoutes = require('./routes/adminRoutes');
const companyRoutes = require('./routes/companyRoutes');
const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const supportRoutes = require('./routes/supportRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Set JWT_SECRET to at least 32 characters in backend/.env.');
}

const app = express();
const frontendPath = path.join(__dirname, '..', 'frontend');

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok' });
  } catch {
    return res.status(503).json({ status: 'unavailable', error: 'Database connection failed.' });
  }
});
app.use(express.static(frontendPath));
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

const port = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await pool.query('SELECT 1');
    app.listen(port, () => {
      console.log(`GreenFuture running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Could not connect to PostgreSQL:', error.message);
    console.error('Check PostgreSQL is running and backend/.env has the correct DB settings.');
    process.exitCode = 1;
    await pool.end();
  }
}

start();