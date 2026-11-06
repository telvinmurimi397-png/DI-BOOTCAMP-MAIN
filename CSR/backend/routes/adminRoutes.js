const express = require('express');
const admin = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/overview', admin.getOverview);
router.get('/users', admin.listUsers);
router.patch('/users/:id/verification', admin.setUserVerification);
router.get('/projects', admin.listProjects);
router.patch('/projects/:id/status', admin.updateProjectStatus);
router.get('/sponsorships', admin.listSponsorships);
router.post('/sponsorships', admin.createSponsorship);
router.patch('/sponsorships/:id/status', admin.updateSponsorshipStatus);
router.get('/support', admin.listSupportTickets);
router.post('/support', admin.createSupportTicket);
router.patch('/support/:id', admin.updateSupportTicket);

module.exports = router;
