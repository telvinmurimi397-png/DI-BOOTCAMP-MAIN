const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const { readDatabase, updateDatabase } = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();
const upload = multer({
  dest: path.join(__dirname, '..', '..', 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, done) => {
    if (!file.mimetype.startsWith('image/')) return done(new Error('Only image files are accepted.'));
    done(null, true);
  }
});
const problemTypes = ['illegal-dumping', 'blocked-drainage'];
const statuses = ['pending', 'verified', 'assigned', 'in-progress', 'resolved'];

router.get('/', requireAuth, async (req, res) => {
  const database = await readDatabase();
  const reports = ['admin', 'collector'].includes(req.auth.role)
    ? database.reports
    : database.reports.filter((report) => report.reportedBy === req.auth.sub);
  res.json({ reports: reports.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

router.post('/', requireAuth, requireRole('resident'), upload.single('photo'), async (req, res) => {
  const problemType = req.body?.problemType;
  const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  if (!problemTypes.includes(problemType) || location.length < 3 || description.length < 10) {
    return res.status(400).json({ error: 'Choose a problem type, add a location, and describe the issue in at least 10 characters.' });
  }
  const database = await readDatabase();
  const user = database.users.find((item) => item.id === req.auth.sub);
  const now = new Date().toISOString();
  const report = {
    id: crypto.randomUUID(),
    title: problemType === 'blocked-drainage' ? 'Blocked drainage' : 'Illegal dumping',
    description,
    problemType,
    location,
    image: req.file ? `/uploads/${req.file.filename}` : '',
    status: 'pending',
    reportedBy: user.id,
    reportedByName: user.name,
    assignedTo: null,
    createdAt: now,
    updates: [{ status: 'pending', note: 'Report received and awaiting review.', at: now }]
  };
  await updateDatabase((current) => current.reports.push(report));
  res.status(201).json({ report });
});

router.get('/:id', requireAuth, async (req, res) => {
  const report = (await readDatabase()).reports.find((item) => item.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found.' });
  if (!['admin', 'collector'].includes(req.auth.role) && report.reportedBy !== req.auth.sub) {
    return res.status(403).json({ error: 'You can only view your own reports.' });
  }
  res.json({ report });
});

router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  const status = req.body?.status;
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
  if (!statuses.includes(status)) return res.status(400).json({ error: 'Choose a valid report status.' });
  const report = await updateDatabase((database) => {
    const item = database.reports.find((entry) => entry.id === req.params.id);
    if (!item) return null;
    item.status = status;
    if (req.body?.assignedTo !== undefined) item.assignedTo = req.body.assignedTo || null;
    item.updates.push({ status, note: note || `Status updated to ${status.replace('-', ' ')}.`, at: new Date().toISOString() });
    return item;
  });
  if (!report) return res.status(404).json({ error: 'Report not found.' });
  res.json({ report });
});

module.exports = router;