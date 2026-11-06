const pool = require('../config/database');

async function getDashboardSummary(req, res) {
  if (req.user.role !== 'company') {
    return res.status(403).json({ error: 'Company access is required.' });
  }

  try {
    const result = await pool.query(
      `SELECT
         u.is_verified,
         COUNT(p.id)::integer AS total_projects,
         COUNT(p.id) FILTER (WHERE p.status = 'Approved')::integer AS active_projects,
         COUNT(p.id) FILTER (WHERE p.status = 'Pending')::integer AS pending_proposals,
         COUNT(p.id) FILTER (WHERE p.status = 'Completed')::integer AS completed_projects,
         (SELECT COALESCE(SUM(s.amount), 0)::numeric(14, 2)::text
          FROM sponsorships s
          WHERE s.company_id = u.id AND s.status = 'Approved') AS total_amount_sponsored
       FROM users u
       LEFT JOIN projects p ON p.company_id = u.id
       WHERE u.id = $1
       GROUP BY u.id, u.is_verified`,
      [req.user.id]
    );
    const summary = result.rows[0];
    if (!summary) {
      return res.status(404).json({ error: 'Company account no longer exists.' });
    }

    return res.json({
      isVerified: summary.is_verified,
      totalProjects: summary.total_projects,
      activeProjects: summary.active_projects,
      totalAmountSponsored: summary.total_amount_sponsored,
      pendingProposals: summary.pending_proposals,
      environmentalImpact: null,
      projectCompletionRate: summary.total_projects === 0
        ? 0
        : Math.round(summary.completed_projects / summary.total_projects * 100)
    });
  } catch (error) {
    console.error('Company dashboard summary failed:', error.message);
    return res.status(500).json({ error: 'Could not load company dashboard totals.' });
  }
}

module.exports = { getDashboardSummary };
