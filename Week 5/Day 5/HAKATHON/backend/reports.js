// Data-access + business logic for reports.

const db = require('./db');
const { STATUSES } = require('./constants');

function genId() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MTF-${year}-${rand}`;
}

// Keep the reporter's contact details private on any public response.
// Only the office handling the report should ever see the raw values
// (that would be a separate authenticated admin view, not built here).
function maskPhone(value) {
  if (!value) return '';
  const v = String(value).trim();
  if (v.includes('@')) {
    const [user, domain] = v.split('@');
    return (user.slice(0, 2) || '') + '***@' + (domain || '');
  }
  const digits = v.replace(/\s+/g, '');
  if (digits.length <= 4) return '***';
  return digits.slice(0, 4) + '***' + digits.slice(-1);
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'Anonymous';
}

// Shape a raw DB row into the public representation the frontend consumes.
function toPublic(row) {
  return {
    id: row.id,
    cat: row.cat,
    ward: row.ward,
    landmark: row.landmark || '',
    desc: row.description,
    name: firstName(row.name),
    phone: maskPhone(row.phone),
    photo: row.photo || null,
    status: row.status,
    statusLabel: STATUSES[row.status],
    created: row.created,
    updated: row.updated
  };
}

function list({ category, status } = {}) {
  let sql = 'SELECT * FROM reports';
  const where = [];
  const params = [];
  if (category) { where.push('cat = ?'); params.push(category); }
  if (status !== undefined && status !== null && status !== '') {
    where.push('status = ?'); params.push(Number(status));
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY created DESC';
  return db.all(sql, params).map(toPublic);
}

function getById(id) {
  const row = db.get('SELECT * FROM reports WHERE id = ?', [String(id).toUpperCase()]);
  if (!row) return null;
  const pub = toPublic(row);
  pub.history = db
    .all('SELECT status, note, at FROM status_history WHERE report_id = ? ORDER BY at ASC', [row.id]);
  return pub;
}

function create(data) {
  const now = new Date().toISOString();
  let id = genId();
  // extremely unlikely collision guard
  while (db.get('SELECT id FROM reports WHERE id = ?', [id])) id = genId();

  db.run(
    `INSERT INTO reports (id, cat, ward, landmark, description, name, phone, photo, status, created, updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, data.cat, data.ward, data.landmark || null, data.desc, data.name, data.phone, data.photo || null, now, now]
  );
  db.run(
    'INSERT INTO status_history (report_id, status, note, at) VALUES (?, 0, ?, ?)',
    [id, 'Received by Mtaafix', now]
  );
  return getById(id);
}

function setStatus(id, status, note) {
  const row = db.get('SELECT * FROM reports WHERE id = ?', [String(id).toUpperCase()]);
  if (!row) return null;
  const now = new Date().toISOString();
  db.run('UPDATE reports SET status = ?, updated = ? WHERE id = ?', [status, now, row.id]);
  db.run(
    'INSERT INTO status_history (report_id, status, note, at) VALUES (?, ?, ?, ?)',
    [row.id, status, note || null, now]
  );
  return getById(row.id);
}

function stats() {
  const total = db.get('SELECT COUNT(*) c FROM reports').c;
  const resolved = db.get('SELECT COUNT(*) c FROM reports WHERE status = 4').c;
  const active = db.get('SELECT COUNT(*) c FROM reports WHERE status > 0 AND status < 4').c;
  const categories = db.get('SELECT COUNT(DISTINCT cat) c FROM reports').c;
  return { total, resolved, active, categories };
}

function count() {
  return db.get('SELECT COUNT(*) c FROM reports').c;
}

module.exports = { list, getById, create, setStatus, stats, count, genId };