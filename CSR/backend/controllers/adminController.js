const pool = require('../config/database');

const userRoles = new Set(['company', 'organization', 'volunteer']);
const projectStatuses = new Set(['Pending', 'Approved', 'Completed', 'Rejected']);
const sponsorshipStatuses = new Set(['Pending', 'Approved', 'Rejected']);
const ticketStatuses = new Set(['Open', 'In Progress', 'Resolved']);

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function getOverview(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*)::integer FROM users WHERE role IN ('company', 'organization', 'volunteer')) AS total_users,
         (SELECT COUNT(*)::integer FROM users WHERE role = 'company') AS companies,
         (SELECT COUNT(*)::integer FROM users WHERE role = 'organization') AS organizations,
         (SELECT COUNT(*)::integer FROM users WHERE role = 'volunteer') AS volunteers,
         (SELECT COUNT(*)::integer FROM projects) AS total_projects,
         (SELECT COUNT(*)::integer FROM projects WHERE status = 'Pending') AS pending_projects,
         (SELECT COUNT(*)::integer FROM projects WHERE status = 'Approved') AS active_projects,
         (SELECT COUNT(*)::integer FROM projects WHERE status = 'Completed') AS completed_projects,
         (SELECT COUNT(*)::integer FROM sponsorships WHERE status = 'Pending') AS pending_sponsorships,
         (SELECT COALESCE(SUM(amount), 0)::numeric(14, 2) FROM sponsorships WHERE status = 'Approved') AS approved_sponsorship_amount,
         (SELECT COUNT(*)::integer FROM support_tickets WHERE status != 'Resolved') AS open_tickets,
         (SELECT COALESCE(SUM(target_metric), 0)::integer FROM projects WHERE status = 'Completed') AS completed_project_target_units`
    );
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin overview failed:', error.message);
    return res.status(500).json({ error: 'Could not load the admin overview.' });
  }
}

async function listUsers(req, res) {
  const role = req.query.role;
  if (role && !userRoles.has(role)) {
    return res.status(400).json({ error: 'Choose a valid user role filter.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, role, is_verified AS "isVerified", created_at AS "createdAt"
       FROM users
       WHERE ($1::text IS NULL OR role = $1)
       ORDER BY created_at DESC, id DESC
       LIMIT 500`,
      [role || null]
    );
    return res.json({ users: result.rows });
  } catch (error) {
    console.error('Admin user list failed:', error.message);
    return res.status(500).json({ error: 'Could not load users.' });
  }
}

async function setUserVerification(req, res) {
  const id = parseId(req.params.id);
  const { isVerified } = req.body || {};
  if (!id || typeof isVerified !== 'boolean') {
    return res.status(400).json({ error: 'Provide a valid user ID and verification status.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET is_verified = $1
       WHERE id = $2 AND role IN ('company', 'organization')
       RETURNING id, name, role, is_verified AS "isVerified"`,
      [isVerified, id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Company or organization account not found.' });
    }
    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Admin verification update failed:', error.message);
    return res.status(500).json({ error: 'Could not update verification status.' });
  }
}

async function listProjects(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.category, p.status, p.target_metric AS "targetMetric",
              p.created_at AS "createdAt", u.name AS "ownerName", u.role AS "ownerRole",
              COUNT(DISTINCT pv.volunteer_id)::integer AS "volunteerCount"
       FROM projects p
       LEFT JOIN users u ON u.id = p.company_id
       LEFT JOIN project_volunteers pv ON pv.project_id = p.id
       GROUP BY p.id, u.name, u.role
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT 500`
    );
    return res.json({ projects: result.rows });
  } catch (error) {
    console.error('Admin project list failed:', error.message);
    return res.status(500).json({ error: 'Could not load projects.' });
  }
}

async function updateProjectStatus(req, res) {
  const id = parseId(req.params.id);
  const { status } = req.body || {};
  if (!id || !projectStatuses.has(status)) {
    return res.status(400).json({ error: 'Provide a valid project ID and status.' });
  }

  try {
    const result = await pool.query(
      'UPDATE projects SET status = $1 WHERE id = $2 RETURNING id, title, status',
      [status, id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Project not found.' });
    return res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Admin project update failed:', error.message);
    return res.status(500).json({ error: 'Could not update project status.' });
  }
}

async function listSponsorships(req, res) {
  try {
    const result = await pool.query(
      `SELECT s.id, s.amount::text, s.status, s.created_at AS "createdAt",
              c.name AS "companyName", p.title AS "projectTitle"
       FROM sponsorships s
       JOIN users c ON c.id = s.company_id
       JOIN projects p ON p.id = s.project_id
       ORDER BY s.created_at DESC, s.id DESC
       LIMIT 500`
    );
    return res.json({ sponsorships: result.rows });
  } catch (error) {
    console.error('Admin sponsorship list failed:', error.message);
    return res.status(500).json({ error: 'Could not load sponsorships.' });
  }
}

async function createSponsorship(req, res) {
  const body = req.body || {};
  const companyId = parseId(body.companyId);
  const projectId = parseId(body.projectId);
  const amount = Number(body.amount);
  if (!companyId || !projectId || !Number.isFinite(amount) || amount <= 0 || amount > 9999999999.99) {
    return res.status(400).json({ error: 'Choose a company and project and enter an amount greater than zero.' });
  }

  try {
    const company = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [companyId, 'company']);
    if (!company.rowCount) return res.status(400).json({ error: 'Choose a valid company.' });

    const project = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (!project.rowCount) return res.status(400).json({ error: 'Choose a valid project.' });

    const result = await pool.query(
      `INSERT INTO sponsorships (company_id, project_id, amount)
       VALUES ($1, $2, $3)
       RETURNING id, amount::text, status`,
      [companyId, projectId, amount]
    );
    return res.status(201).json({ sponsorship: result.rows[0] });
  } catch (error) {
    console.error('Admin sponsorship creation failed:', error.message);
    return res.status(500).json({ error: 'Could not create sponsorship commitment.' });
  }
}

async function updateSponsorshipStatus(req, res) {
  const id = parseId(req.params.id);
  const { status } = req.body || {};
  if (!id || !sponsorshipStatuses.has(status)) {
    return res.status(400).json({ error: 'Provide a valid sponsorship ID and status.' });
  }

  try {
    const result = await pool.query(
      'UPDATE sponsorships SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Sponsorship not found.' });
    return res.json({ sponsorship: result.rows[0] });
  } catch (error) {
    console.error('Admin sponsorship update failed:', error.message);
    return res.status(500).json({ error: 'Could not update sponsorship status.' });
  }
}

async function listSupportTickets(req, res) {
  try {
    const result = await pool.query(
      `SELECT t.id, t.subject, t.message, t.status, t.resolution_note AS "resolutionNote",
              t.created_at AS "createdAt", u.name AS "submitterName", u.email AS "submitterEmail",
              u.role AS "submitterRole"
       FROM support_tickets t
       JOIN users u ON u.id = t.user_id
       ORDER BY CASE t.status WHEN 'Open' THEN 0 WHEN 'In Progress' THEN 1 ELSE 2 END,
                t.created_at DESC, t.id DESC
       LIMIT 500`
    );
    return res.json({ tickets: result.rows });
  } catch (error) {
    console.error('Admin support list failed:', error.message);
    return res.status(500).json({ error: 'Could not load support tickets.' });
  }
}

async function createSupportTicket(req, res) {
  const body = req.body || {};
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!subject || subject.length > 200 || !message || message.length > 5000) {
    return res.status(400).json({ error: 'Enter a subject (up to 200 characters) and message (up to 5000 characters).' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, message)
       VALUES ($1, $2, $3)
       RETURNING id, subject, status, created_at AS "createdAt"`,
      [req.user.id, subject, message]
    );
    return res.status(201).json({ ticket: result.rows[0] });
  } catch (error) {
    console.error('Support ticket creation failed:', error.message);
    return res.status(500).json({ error: 'Could not create support ticket.' });
  }
}

async function updateSupportTicket(req, res) {
  const id = parseId(req.params.id);
  const body = req.body || {};
  const { status } = body;
  const resolutionNote = typeof body.resolutionNote === 'string' ? body.resolutionNote.trim() : '';
  if (!id || !ticketStatuses.has(status) || resolutionNote.length > 5000) {
    return res.status(400).json({ error: 'Provide a valid ticket ID, status, and resolution note (up to 5000 characters).' });
  }

  try {
    const result = await pool.query(
      `UPDATE support_tickets
       SET status = $1, resolution_note = NULLIF($2, ''), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, status, resolution_note AS "resolutionNote"`,
      [status, resolutionNote, id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Support ticket not found.' });
    return res.json({ ticket: result.rows[0] });
  } catch (error) {
    console.error('Support ticket update failed:', error.message);
    return res.status(500).json({ error: 'Could not update support ticket.' });
  }
}

module.exports = {
  getOverview,
  listUsers,
  setUserVerification,
  listProjects,
  updateProjectStatus,
  listSponsorships,
  createSponsorship,
  updateSponsorshipStatus,
  listSupportTickets,
  createSupportTicket,
  updateSupportTicket
};
