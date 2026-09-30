const crypto = require('node:crypto');
const express = require('express');
const { readDatabase, updateDatabase } = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const cleanups = (await readDatabase()).cleanups;
  res.json({ cleanups: cleanups.slice().sort((a, b) => a.date.localeCompare(b.date)) });
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
  const date = typeof req.body?.date === 'string' ? req.body.date : '';
  const time = typeof req.body?.time === 'string' ? req.body.time : '';
  const wasteTargetKg = Number(req.body?.wasteTargetKg);
  if (title.length < 4 || location.length < 3 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time || !Number.isFinite(wasteTargetKg) || wasteTargetKg < 0) {
    return res.status(400).json({ error: 'Add a title, location, date, time, and valid waste target.' });
  }
  if (date < new Date().toISOString().slice(0, 10)) return res.status(400).json({ error: 'Cleanup date must be today or later.' });
  const cleanup = { id: crypto.randomUUID(), title, location, date, time, wasteTargetKg, volunteers: [], impact: null, createdAt: new Date().toISOString() };
  await updateDatabase((database) => database.cleanups.push(cleanup));
  res.status(201).json({ cleanup });
});

router.post('/:id/join', requireAuth, requireRole('resident', 'collector'), async (req, res) => {
  const result = await updateDatabase((database) => {
    const cleanup = database.cleanups.find((item) => item.id === req.params.id);
    if (!cleanup) return { missing: true };
    if (cleanup.date < new Date().toISOString().slice(0, 10)) return { expired: true };
    const index = cleanup.volunteers.indexOf(req.auth.sub);
    if (index === -1) cleanup.volunteers.push(req.auth.sub);
    else cleanup.volunteers.splice(index, 1);
    return { cleanup, joined: index === -1 };
  });
  if (result.missing) return res.status(404).json({ error: 'Cleanup event not found.' });
  if (result.expired) return res.status(409).json({ error: 'This cleanup event has already passed.' });
  res.json({ cleanup: result.cleanup, joined: result.joined });
});

router.patch('/:id/impact', requireAuth, requireRole('admin', 'collector'), async (req, res) => {
  const impact = {};
  for (const key of ['volunteers', 'wasteCollectedKg', 'drainageSections', 'wasteBinsProvided']) {
    const value = Number(req.body?.[key]);
    if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: 'Impact values must be zero or greater.' });
    impact[key] = value;
  }
  const cleanup = await updateDatabase((database) => {
    const item = database.cleanups.find((entry) => entry.id === req.params.id);
    if (!item) return null;
    item.impact = { ...impact, recordedAt: new Date().toISOString() };
    return item;
  });
  if (!cleanup) return res.status(404).json({ error: 'Cleanup event not found.' });
  res.json({ cleanup });
});

module.exports = router;