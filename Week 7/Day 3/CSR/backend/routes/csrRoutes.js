const crypto = require('node:crypto');
const express = require('express');
const { readDatabase, updateDatabase } = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

router.get('/projects', requireAuth, async (req, res) => {
  res.json({ projects: (await readDatabase()).projects });
});

router.post('/projects', requireAuth, requireRole('admin'), async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
  const fundingRequired = Number(req.body?.fundingRequired);
  const activities = Array.isArray(req.body?.activities)
    ? req.body.activities.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];
  if (name.length < 4 || description.length < 15 || location.length < 3 || !Number.isFinite(fundingRequired) || fundingRequired <= 0) {
    return res.status(400).json({ error: 'Project needs a name, detailed description, location, and positive funding target.' });
  }
  const project = {
    id: crypto.randomUUID(), name, description, location, fundingRequired, amountRaised: 0, sponsorIds: [], activities,
    status: 'seeking-funding',
    impact: { cleanups: 0, volunteers: 0, wasteCollectedKg: 0, drainageSections: 0, wasteBinsProvided: 0 },
    createdAt: new Date().toISOString()
  };
  await updateDatabase((database) => database.projects.push(project));
  res.status(201).json({ project });
});

router.post('/projects/:id/sponsor', requireAuth, requireRole('sponsor'), async (req, res) => {
  const amount = Number(req.body?.amount);
  const companyName = typeof req.body?.companyName === 'string' ? req.body.companyName.trim() : '';
  if (!Number.isFinite(amount) || amount <= 0 || companyName.length < 2) {
    return res.status(400).json({ error: 'Enter a company name and a positive sponsorship amount.' });
  }
  const result = await updateDatabase((database) => {
    const project = database.projects.find((item) => item.id === req.params.id);
    if (!project) return { missing: true };
    if (project.status === 'complete') return { complete: true };
    const sponsor = database.users.find((item) => item.id === req.auth.sub);
    const sponsorship = { id: crypto.randomUUID(), projectId: project.id, projectName: project.name, sponsorId: sponsor.id, companyName, amount, createdAt: new Date().toISOString() };
    project.amountRaised += amount;
    if (!project.sponsorIds.includes(sponsor.id)) project.sponsorIds.push(sponsor.id);
    if (project.amountRaised >= project.fundingRequired) project.status = 'funded';
    database.sponsorships.push(sponsorship);
    return { project, sponsorship };
  });
  if (result.missing) return res.status(404).json({ error: 'CSR project not found.' });
  if (result.complete) return res.status(409).json({ error: 'This project is already complete.' });
  res.status(201).json(result);
});

router.patch('/projects/:id/impact', requireAuth, requireRole('admin'), async (req, res) => {
  const result = await updateDatabase((database) => {
    const project = database.projects.find((item) => item.id === req.params.id);
    if (!project) return null;
    for (const key of ['cleanups', 'volunteers', 'wasteCollectedKg', 'drainageSections', 'wasteBinsProvided']) {
      if (req.body?.[key] === undefined) continue;
      const value = Number(req.body[key]);
      if (!Number.isFinite(value) || value < 0) return { error: 'Impact values must be zero or greater.' };
      project.impact[key] = value;
    }
    if (req.body?.status === 'complete') project.status = 'complete';
    return { project };
  });
  if (!result) return res.status(404).json({ error: 'CSR project not found.' });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.get('/sponsorships', requireAuth, requireRole('admin', 'sponsor'), async (req, res) => {
  const database = await readDatabase();
  const sponsorships = req.auth.role === 'admin'
    ? database.sponsorships
    : database.sponsorships.filter((item) => item.sponsorId === req.auth.sub);
  res.json({ sponsorships });
});

module.exports = router;