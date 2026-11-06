const pool = require('../config/database');

async function getDashboardSummary(req, res) {
  if (req.user.role !== 'volunteer') {
    return res.status(403).json({ error: 'Volunteer access is required.' });
  }

  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)::integer AS activities_joined,
         COUNT(*) FILTER (WHERE p.status = 'Completed')::integer AS completed_activities
       FROM project_volunteers pv
       JOIN projects p ON p.id = pv.project_id
       WHERE pv.volunteer_id = $1`,
      [req.user.id]
    );
    const summary = result.rows[0];

    return res.json({
      activitiesJoined: summary.activities_joined,
      completedActivities: summary.completed_activities,
      upcomingActivities: null,
      volunteerHours: null,
      environmentalImpact: null
    });
  } catch (error) {
    console.error('Volunteer dashboard summary failed:', error.message);
    return res.status(500).json({ error: 'Could not load volunteer activity totals.' });
  }
}

module.exports = { getDashboardSummary };
