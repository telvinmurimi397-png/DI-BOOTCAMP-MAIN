const express = require('express');
const reports = require('./reports');
const { CATEGORIES, STATUSES } = require('./constants');
const { validateReport, validateStatus } = require('./validate');
const { upload, saveDataUrl } = require('./uploads');

const router = express.Router();

// --- reference data ---------------------------------------------------------
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
router.get('/categories', (req, res) => res.json(CATEGORIES));
router.get('/statuses', (req, res) => res.json(STATUSES));
router.get('/stats', (req, res) => res.json(reports.stats()));

// --- public reads -----------------------------------------------------------
router.get('/reports', (req, res) => {
  const { category, status } = req.query;
  res.json(reports.list({ category, status }));
});

router.get('/reports/:id', (req, res) => {
  const r = reports.getById(req.params.id);
  if (!r) return res.status(404).json({ error: 'No report found with that ID' });
  res.json(r);
});

// --- create (public) --------------------------------------------------------
// Accepts multipart/form-data (field "photo") or JSON (photo as base64 data URL).
router.post('/reports', upload.single('photo'), (req, res) => {
  const { value, errors } = validateReport(req.body);
  if (errors) return res.status(400).json({ errors });

  if (req.file) {
    value.photo = '/uploads/' + req.file.filename;
  } else if (req.body.photo) {
    value.photo = saveDataUrl(req.body.photo); // null if invalid — silently dropped
  }

  const created = reports.create(value);
  res.status(201).json(created);
});

// --- status update (ADMIN ONLY) --------------------------------------------
// Protected by a shared admin token. Without this guard anyone could mark
// reports resolved, so the endpoint must never be exposed unauthenticated.
function requireAdmin(req, res, next) {
  const token = req.get('X-Admin-Token');
  if (!process.env.ADMIN_TOKEN) {
    return res.status(500).json({ error: 'Server missing ADMIN_TOKEN configuration' });
  }
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: valid X-Admin-Token required' });
  }
  next();
}

router.patch('/reports/:id/status', requireAdmin, (req, res) => {
  const { value, errors } = validateStatus(req.body.status);
  if (errors) return res.status(400).json({ errors });
  const updated = reports.setStatus(req.params.id, value, req.body.note);
  if (!updated) return res.status(404).json({ error: 'No report found with that ID' });
  res.json(updated);
});

module.exports = router;