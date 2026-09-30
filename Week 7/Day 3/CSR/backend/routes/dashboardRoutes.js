const express = require('express');
const { readDatabase } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const database = await readDatabase();
  if (req.auth.role === 'admin') {
    return res.json({
      role: 'admin',
      users: database.users.length,
      pendingReports: database.reports.filter((item) => item.status === 'pending').length,
      verifiedReports: database.reports.filter((item) => item.status === 'verified').length,
      resolvedReports: database.reports.filter((item) => item.status === 'resolved').length,
      upcomingCleanups: database.cleanups.filter((item) => item.date >= new Date().toISOString().slice(0, 10)).length,
      sponsors: new Set(database.sponsorships.map((item) => item.sponsorId)).size
    });
  }
  if (req.auth.role === 'sponsor') {
    const sponsorships = database.sponsorships.filter((item) => item.sponsorId === req.auth.sub);
    const projectIds = new Set(sponsorships.map((item) => item.projectId));
    const projects = database.projects.filter((item) => projectIds.has(item.id));
    const impactTotal = (key) => projects.reduce((total, project) => total + (project.impact?.[key] || 0), 0);
    return res.json({
      role: 'sponsor',
      projectsSponsored: projectIds.size,
      totalSponsored: sponsorships.reduce((total, item) => total + item.amount, 0),
      cleanupsSupported: impactTotal('cleanups'),
      volunteers: impactTotal('volunteers'),
      wasteCollectedKg: impactTotal('wasteCollectedKg'),
      drainageSections: impactTotal('drainageSections'),
      wasteBinsProvided: impactTotal('wasteBinsProvided'),
      communitiesSupported: new Set(projects.map((item) => item.location)).size
    });
  }
  const reports = database.reports.filter((item) => item.reportedBy === req.auth.sub);
  res.json({
    role: req.auth.role,
    reports: reports.length,
    openReports: reports.filter((item) => item.status !== 'resolved').length,
    resolvedReports: reports.filter((item) => item.status === 'resolved').length,
    cleanupsJoined: database.cleanups.filter((item) => item.volunteers.includes(req.auth.sub)).length
  });
});

module.exports = router;