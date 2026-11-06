const pool = require('../config/database');

async function getDashboardSummary(req, res) {
  if (req.user.role !== 'organization') {
    return res.status(403).json({ error: 'Organization access is required.' });
  }

  try {
    const result = await pool.query(
      `SELECT
         u.is_verified,
         COUNT(DISTINCT p.id)::integer AS total_projects,
         COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'Approved')::integer AS active_projects,
         COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'Pending')::integer AS pending_proposals,
         COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'Completed')::integer AS completed_projects,
         COUNT(DISTINCT pv.volunteer_id)::integer AS volunteers_recruited,
         COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'Approved')::integer AS approved_sponsorships
       FROM users u
       LEFT JOIN projects p ON p.company_id = u.id
       LEFT JOIN project_volunteers pv ON pv.project_id = p.id
       LEFT JOIN sponsorships s ON s.project_id = p.id
       WHERE u.id = $1
       GROUP BY u.id, u.is_verified`,
      [req.user.id]
    );
    const summary = result.rows[0];
    if (!summary) {
      return res.status(404).json({ error: 'Organization account no longer exists.' });
    }

    return res.json({
      isVerified: summary.is_verified,
      totalProjects: summary.total_projects,
      activeProjects: summary.active_projects,
      pendingProposals: summary.pending_proposals,
      approvedSponsorships: summary.approved_sponsorships,
      totalVolunteersRecruited: summary.volunteers_recruited,
      projectCompletionRate: summary.total_projects === 0
        ? 0
        : Math.round(summary.completed_projects / summary.total_projects * 100)
    });
  } catch (error) {
    console.error('Organization dashboard summary failed:', error.message);
    return res.status(500).json({ error: 'Could not load organization dashboard totals.' });
  }
}

module.exports = { getDashboardSummary };
