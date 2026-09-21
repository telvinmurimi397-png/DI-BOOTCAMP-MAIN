// ============================================================================
// Mtaafix Backend — All Source Files Combined
// ============================================================================
// Each original file is separated by a banner with its file path and type.
// ============================================================================



// ============================================================================
// FILE: server.js
// TYPE: Entry Point — Express wiring + startup
// ============================================================================
// Mtaafix backend entry point.
// Loads .env (if present), initialises the database, wires middleware & routes.

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// --- minimal .env loader (no dependency) ------------------------------------
(function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
})();

const db = require('./src/db');
const { UPLOAD_DIR } = require('./src/uploads');
const routes = require('./src/routes');
const adminRoutes = require('./src/adminRoutes');
const seed = require('./src/seed');

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Build the fully-wired Express app (used by server startup and tests).
async function createApp() {
  await db.init();
  await seed.ensureSeed();

  const app = express();

  app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map(s => s.trim()) }));
  app.use(express.json({ limit: '8mb' }));            // base64 photos can be large
  app.use(express.urlencoded({ extended: true, limit: '8mb' }));

  // uploaded photos (read-only)
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

  // optionally serve the bundled demo frontend from /public
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
    app.use('/', express.static(publicDir));
  }

  app.use('/api', routes);
  app.use('/api/admin', adminRoutes);

  // 404 for unknown API routes
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // central error handler (multer + unexpected)
  app.use((err, req, res, next) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Photo too large (max 5 MB)' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

async function main() {
  const app = await createApp();
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Mtaafix API running at http://127.0.0.1:${PORT}`);
    console.log(`  Demo frontend: http://127.0.0.1:${PORT}/`);
    console.log(`  Admin console: http://127.0.0.1:${PORT}/admin`);
    console.log(`  Health check:  http://127.0.0.1:${PORT}/api/health`);
    if (!process.env.ADMIN_TOKEN) {
      console.warn('  ⚠  ADMIN_TOKEN is not set — status-update endpoint is disabled until you set it.');
    }
  });
}

module.exports = { createApp };

// Only start listening when run directly (not when imported by tests).
if (require.main === module) {
  main().catch(err => { console.error('Failed to start:', err); process.exit(1); });
}



// ============================================================================
// FILE: src/db.js
// TYPE: Database Layer — sql.js (WASM SQLite) persistence
// ============================================================================
// Lightweight persistence layer backed by sql.js (SQLite compiled to WASM).
// No native compilation required — runs on any Node version.
// The database lives entirely in memory and is flushed to disk after each
// write so it survives restarts.

const initSqlJs = require('sql.js');
// const fs = require('fs');        // already required above
// const path = require('path');    // already required above

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'mtaafix.sqlite');

let _db = null;

async function _dbInit() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const SQL = await initSqlJs();

  _db = fs.existsSync(DB_FILE)
    ? new SQL.Database(fs.readFileSync(DB_FILE))
    : new SQL.Database();

  _db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id          TEXT PRIMARY KEY,
      cat         TEXT    NOT NULL,
      ward        TEXT    NOT NULL,
      landmark    TEXT,
      description TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      phone       TEXT    NOT NULL,
      photo       TEXT,
      status      INTEGER NOT NULL DEFAULT 0,
      created     TEXT    NOT NULL,
      updated     TEXT    NOT NULL
    );
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS status_history (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT    NOT NULL,
      status    INTEGER NOT NULL,
      note      TEXT,
      at        TEXT    NOT NULL
    );
  `);

  _dbPersist();
  return _db;
}

function _dbPersist() {
  if (!_db) return;
  fs.writeFileSync(DB_FILE, Buffer.from(_db.export()));
}

// --- tiny query helpers -----------------------------------------------------
function _dbAll(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function _dbGet(sql, params = []) {
  return _dbAll(sql, params)[0] || null;
}

function _dbRun(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  _dbPersist();
}

// Note: In the real project these are exported as { init, all, get, run, persist }.
// We alias them here with prefixed names to avoid collisions in this single-file version.



// ============================================================================
// FILE: src/constants.js
// TYPE: Domain Constants — categories + status labels
// ============================================================================
// Shared domain constants — kept in sync with the frontend.

const CATEGORIES = [
  { id: 'roads',    label: 'Roads & Potholes',  icon: '🛣️' },
  { id: 'water',    label: 'Water',             icon: '💧' },
  { id: 'power',    label: 'Electricity',       icon: '⚡' },
  { id: 'garbage',  label: 'Garbage',           icon: '🗑️' },
  { id: 'lights',   label: 'Streetlights',      icon: '💡' },
  { id: 'drainage', label: 'Drainage & Floods', icon: '🌊' },
  { id: 'security', label: 'Security',          icon: '🚨' },
  { id: 'other',    label: 'Other',             icon: '📌' }
];

const CATEGORY_IDS = CATEGORIES.map(c => c.id);

// status index -> human label (mirrors the frontend timeline)
const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];



// ============================================================================
// FILE: src/reports.js
// TYPE: Data Access — report model, contact masking, tracking IDs
// ============================================================================
// Data-access + business logic for reports.

// const db = require('./db');   — using _dbRun / _dbAll / _dbGet from this file
// const { STATUSES } = require('./constants'); — using STATUSES from this file

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

function reportList({ category, status, cats } = {}) {
  let sql = 'SELECT * FROM reports';
  const where = [];
  const params = [];
  if (category) { where.push('cat = ?'); params.push(category); }
  if (Array.isArray(cats) && cats.length) {
    where.push('cat IN (' + cats.map(() => '?').join(',') + ')');
    params.push(...cats);
  }
  if (status !== undefined && status !== null && status !== '') {
    where.push('status = ?'); params.push(Number(status));
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY created DESC';
  return _dbAll(sql, params).map(toPublic);
}

function reportGetById(id) {
  const row = _dbGet('SELECT * FROM reports WHERE id = ?', [String(id).toUpperCase()]);
  if (!row) return null;
  const pub = toPublic(row);
  pub.history = _dbAll(
    'SELECT status, note, at FROM status_history WHERE report_id = ? ORDER BY at ASC', [row.id]);
  return pub;
}

function reportCreate(data) {
  const now = new Date().toISOString();
  let id = genId();
  // extremely unlikely collision guard
  while (_dbGet('SELECT id FROM reports WHERE id = ?', [id])) id = genId();

  _dbRun(
    `INSERT INTO reports (id, cat, ward, landmark, description, name, phone, photo, status, created, updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, data.cat, data.ward, data.landmark || null, data.desc, data.name, data.phone, data.photo || null, now, now]
  );
  _dbRun(
    'INSERT INTO status_history (report_id, status, note, at) VALUES (?, 0, ?, ?)',
    [id, 'Received by Mtaafix', now]
  );
  return reportGetById(id);
}

function reportSetStatus(id, status, note) {
  const row = _dbGet('SELECT * FROM reports WHERE id = ?', [String(id).toUpperCase()]);
  if (!row) return null;
  const now = new Date().toISOString();
  _dbRun('UPDATE reports SET status = ?, updated = ? WHERE id = ?', [status, now, row.id]);
  _dbRun(
    'INSERT INTO status_history (report_id, status, note, at) VALUES (?, ?, ?, ?)',
    [row.id, status, note || null, now]
  );
  return reportGetById(row.id);
}

function reportStats() {
  const total = _dbGet('SELECT COUNT(*) c FROM reports').c;
  const resolved = _dbGet('SELECT COUNT(*) c FROM reports WHERE status = 4').c;
  const active = _dbGet('SELECT COUNT(*) c FROM reports WHERE status > 0 AND status < 4').c;
  const categories = _dbGet('SELECT COUNT(DISTINCT cat) c FROM reports').c;
  return { total, resolved, active, categories };
}

function reportCount() {
  return _dbGet('SELECT COUNT(*) c FROM reports').c;
}

// --- admin / management views ----------------------------------------------
// Full representation WITH raw contact details — only for authenticated staff.
function toFull(row) {
  return {
    id: row.id,
    cat: row.cat,
    ward: row.ward,
    landmark: row.landmark || '',
    desc: row.description,
    name: row.name,
    phone: row.phone,
    photo: row.photo || null,
    status: row.status,
    statusLabel: STATUSES[row.status],
    created: row.created,
    updated: row.updated
  };
}

function reportListFull({ category, status, q, cats } = {}) {
  let sql = 'SELECT * FROM reports';
  const where = [];
  const params = [];
  if (category) { where.push('cat = ?'); params.push(category); }
  if (Array.isArray(cats) && cats.length) {
    where.push('cat IN (' + cats.map(() => '?').join(',') + ')');
    params.push(...cats);
  }
  if (status !== undefined && status !== null && status !== '') {
    where.push('status = ?'); params.push(Number(status));
  }
  if (q) {
    where.push('(ward LIKE ? OR landmark LIKE ? OR description LIKE ? OR name LIKE ? OR id LIKE ?)');
    const like = '%' + q + '%';
    params.push(like, like, like, like, like);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY created DESC';
  return _dbAll(sql, params).map(toFull);
}

function reportGetByIdFull(id) {
  const row = _dbGet('SELECT * FROM reports WHERE id = ?', [String(id).toUpperCase()]);
  if (!row) return null;
  const full = toFull(row);
  full.history = _dbAll(
    'SELECT status, note, at FROM status_history WHERE report_id = ? ORDER BY at ASC', [row.id]);
  return full;
}

function reportRemove(id) {
  const row = _dbGet('SELECT id FROM reports WHERE id = ?', [String(id).toUpperCase()]);
  if (!row) return false;
  _dbRun('DELETE FROM status_history WHERE report_id = ?', [row.id]);
  _dbRun('DELETE FROM reports WHERE id = ?', [row.id]);
  return true;
}

// Richer stats for the management dashboard: totals + breakdowns.
function reportStatsBreakdown() {
  const base = reportStats();
  const byStatus = {};
  _dbAll('SELECT status, COUNT(*) c FROM reports GROUP BY status')
    .forEach(r => { byStatus[r.status] = r.c; });
  const byCategory = {};
  _dbAll('SELECT cat, COUNT(*) c FROM reports GROUP BY cat')
    .forEach(r => { byCategory[r.cat] = r.c; });
  return Object.assign({}, base, { byStatus, byCategory });
}



// ============================================================================
// FILE: src/validate.js
// TYPE: Validation — request validation for report creation + status updates
// ============================================================================
// const { CATEGORY_IDS, STATUSES } = require('./constants'); — using from this file

const MAX = { ward: 120, landmark: 160, desc: 2000, name: 120, phone: 120 };

function _str(v) { return typeof v === 'string' ? v.trim() : ''; }

// Validate + normalise a create-report payload.
// Returns { value } on success or { errors: [...] } on failure.
function validateReport(body) {
  const errors = [];
  const cat = _str(body.cat);
  const ward = _str(body.ward);
  const landmark = _str(body.landmark);
  const desc = _str(body.desc || body.description);
  const name = _str(body.name);
  const phone = _str(body.phone);

  if (!CATEGORY_IDS.includes(cat)) errors.push('cat must be one of: ' + CATEGORY_IDS.join(', '));
  if (!ward) errors.push('ward is required');
  if (!desc) errors.push('desc is required');
  if (!name) errors.push('name is required');
  if (!phone) errors.push('phone (or email) is required');

  if (ward.length > MAX.ward) errors.push('ward too long');
  if (landmark.length > MAX.landmark) errors.push('landmark too long');
  if (desc.length > MAX.desc) errors.push('desc too long');
  if (name.length > MAX.name) errors.push('name too long');
  if (phone.length > MAX.phone) errors.push('phone too long');

  if (errors.length) return { errors };
  return { value: { cat, ward, landmark, desc, name, phone } };
}

function validateStatus(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n >= STATUSES.length) {
    return { errors: [`status must be an integer 0..${STATUSES.length - 1}`] };
  }
  return { value: n };
}



// ============================================================================
// FILE: src/uploads.js
// TYPE: Upload Handling — photo storage (multipart + base64)
// ============================================================================
// Photo storage helpers. Files are written under data/uploads and served
// read-only from /uploads. Accepts either a multipart file (via multer) or a
// base64 data URL (so the existing frontend keeps working).

// const fs = require('fs');        // already required above
// const path = require('path');    // already required above
const crypto = require('crypto');
const multer = require('multer');
// const { DATA_DIR } = require('./db'); — using DATA_DIR from this file

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// multer instance: single optional field named "photo"
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = ALLOWED[file.mimetype] || 'bin';
      cb(null, crypto.randomBytes(8).toString('hex') + '.' + ext);
    }
  }),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => cb(null, !!ALLOWED[file.mimetype])
});

// Persist a base64 data URL to disk, return the public path or null.
function saveDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const m = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!m) return null;
  const ext = ALLOWED[m[1]];
  if (!ext) return null;
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_BYTES) return null;
  const name = crypto.randomBytes(8).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return '/uploads/' + name;
}



// ============================================================================
// FILE: src/auth.js
// TYPE: Authentication — accounts, scrypt password hashing, sessions
// ============================================================================
// Admin authentication: accounts with salted+hashed passwords (scrypt, no deps)
// and opaque session tokens stored in the DB. Used by the management system.

// const crypto = require('crypto');  — already required above
// const db = require('./db');       — using _dbRun / _dbAll / _dbGet from this file

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function authInitSchema() {
  _dbRun(`
    CREATE TABLE IF NOT EXISTS accounts (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT    NOT NULL UNIQUE,
      password TEXT    NOT NULL,
      role     TEXT    NOT NULL DEFAULT 'admin',
      org      TEXT,
      created  TEXT    NOT NULL
    );
  `);
  // migrate older databases that predate the `org` column
  const cols = _dbAll('PRAGMA table_info(accounts)').map(c => c.name);
  if (!cols.includes('org')) _dbRun('ALTER TABLE accounts ADD COLUMN org TEXT');
  _dbRun(`
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      account_id INTEGER NOT NULL,
      created    TEXT NOT NULL,
      expires    TEXT NOT NULL
    );
  `);
}

function authHashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return salt + ':' + key;
}

function authVerifyPassword(pw, stored) {
  const [salt, key] = String(stored).split(':');
  if (!salt || !key) return false;
  const k = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  const a = Buffer.from(k, 'hex');
  const b = Buffer.from(key, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function authCreateAccount(username, password, role = 'admin', org = null) {
  const now = new Date().toISOString();
  _dbRun('INSERT INTO accounts (username, password, role, org, created) VALUES (?, ?, ?, ?, ?)',
    [username, authHashPassword(password), role, org, now]);
  return _dbGet('SELECT id, username, role, org, created FROM accounts WHERE username = ?', [username]);
}

function authListAccounts() {
  return _dbAll('SELECT id, username, role, org, created FROM accounts ORDER BY id ASC');
}

function authFindByUsername(username) {
  return _dbGet('SELECT * FROM accounts WHERE username = ?', [username]);
}

function authCountAccounts() {
  return _dbGet('SELECT COUNT(*) c FROM accounts').c;
}

// Verify credentials and open a session. Returns { token, expires, user } or null.
function authLogin(username, password) {
  const acc = authFindByUsername(username);
  if (!acc || !authVerifyPassword(password, acc.password)) return null;
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expires = new Date(now + SESSION_TTL_MS).toISOString();
  _dbRun('INSERT INTO sessions (token, account_id, created, expires) VALUES (?, ?, ?, ?)',
    [token, acc.id, new Date(now).toISOString(), expires]);
  return { token, expires, user: { id: acc.id, username: acc.username, role: acc.role, org: acc.org || null } };
}

function authGetSession(token) {
  if (!token) return null;
  const s = _dbGet(
    `SELECT s.token, s.expires, a.id AS account_id, a.username, a.role, a.org
     FROM sessions s JOIN accounts a ON a.id = s.account_id
     WHERE s.token = ?`, [token]);
  if (!s) return null;
  if (new Date(s.expires).getTime() < Date.now()) { authLogout(token); return null; }
  return s;
}

function authLogout(token) {
  if (token) _dbRun('DELETE FROM sessions WHERE token = ?', [token]);
}

// Express middleware: requires a valid session token.
function authRequireAuth(req, res, next) {
  const bearer = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const token = bearer || req.get('X-Auth-Token');
  const s = authGetSession(token);
  if (!s) return res.status(401).json({ error: 'Unauthorized: please log in' });
  req.user = { id: s.account_id, username: s.username, role: s.role, org: s.org || null };
  req.token = token;
  next();
}



// ============================================================================
// FILE: src/organizations.js
// TYPE: Domain Model — organizations + per-org accountability stats
// ============================================================================
// Organizations that receive and resolve reports. Each organization owns one or
// more issue categories, so every report is implicitly routed to exactly one org.
// This module also computes per-organization accountability stats.

// const db = require('./db'); — using _dbAll / _dbGet from this file

const ORGANIZATIONS = [
  { id: 'roads',  name: 'Roads Authority',            short: 'Roads',   icon: '🛣️', color: '#b45309', categories: ['roads'] },
  { id: 'water',  name: 'Water & Sewerage Company',   short: 'Water',   icon: '💧', color: '#1d4ed8', categories: ['water', 'drainage'] },
  { id: 'power',  name: 'Power Utility',              short: 'Power',   icon: '⚡', color: '#a16207', categories: ['power', 'lights'] },
  { id: 'county', name: 'County Public Services',     short: 'County',  icon: '🏛️', color: '#15803d', categories: ['garbage', 'security', 'other'] }
];

const ORG_IDS = ORGANIZATIONS.map(o => o.id);
const orgById = Object.fromEntries(ORGANIZATIONS.map(o => [o.id, o]));

// category id -> organization id
const CAT_TO_ORG = {};
ORGANIZATIONS.forEach(o => o.categories.forEach(c => { CAT_TO_ORG[c] = o.id; }));

function orgGetById(id) { return orgById[id] || null; }
function orgForCategory(cat) { return CAT_TO_ORG[cat] || null; }
function orgCategoriesForOrg(id) { return orgById[id] ? orgById[id].categories.slice() : []; }
function orgIsValid(id) { return !!orgById[id]; }

// Compute accountability stats for one organization from the reports table.
function orgStatsFor(org) {
  const cats = org.categories;
  const placeholders = cats.map(() => '?').join(',');
  const rows = _dbAll(
    `SELECT status, COUNT(*) c FROM reports WHERE cat IN (${placeholders}) GROUP BY status`, cats);
  const byStatus = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  let total = 0;
  rows.forEach(r => { byStatus[r.status] = r.c; total += r.c; });
  const resolved = byStatus[4];
  const active = byStatus[1] + byStatus[2] + byStatus[3];
  const pending = byStatus[0];
  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;
  return { total, resolved, active, pending, byStatus, resolutionRate };
}

// All organizations with their stats, sorted by resolution rate (best first).
function orgListWithStats() {
  return ORGANIZATIONS
    .map(o => Object.assign(
      { id: o.id, name: o.name, short: o.short, icon: o.icon, color: o.color, categories: o.categories },
      orgStatsFor(o)))
    .sort((a, b) => b.resolutionRate - a.resolutionRate || b.total - a.total);
}

function orgDetail(id) {
  const org = orgById[id];
  if (!org) return null;
  return Object.assign(
    { id: org.id, name: org.name, short: org.short, icon: org.icon, color: org.color, categories: org.categories },
    orgStatsFor(org));
}



// ============================================================================
// FILE: src/seed.js
// TYPE: Database Seeder — first-run sample data + default admin + org operators
// ============================================================================
// Seed the database with sample reports on first run (mirrors the frontend demo).

// const db = require('./db');              — using _dbRun from this file
// const reports = require('./reports');    — using reportCount, reportCreate etc.
// const auth = require('./auth');          — using authInitSchema, authCreateAccount etc.
// const organizations = require('./organizations'); — using ORGANIZATIONS from this file

const SEED = [
  { id: 'MTF-2026-K2N7', cat: 'roads', ward: 'Kasarani', landmark: 'Near Kasarani Stadium gate B',
    desc: 'Huge pothole covering half the road on Kasarani–Mwiki road. Boda riders are swerving into oncoming traffic to avoid it.',
    name: 'James Mwangi', phone: '0712345678', status: 4, ageDays: 12 },
  { id: 'MTF-2026-P9Q4', cat: 'water', ward: "Kibera (Sarang'ombe)", landmark: 'Behind Toi Market',
    desc: 'Water pipe burst three days ago. Water is flowing into the road, and we have had no supply at home since yesterday.',
    name: 'Achieng O.', phone: '0722111222', status: 3, ageDays: 5 },
  { id: 'MTF-2026-D4F8', cat: 'lights', ward: 'Westlands', landmark: 'Parklands 5th Avenue',
    desc: 'Streetlights along 5th Avenue have been off for two weeks. The stretch is now unsafe at night, especially for women walking from work.',
    name: 'Fatuma Ali', phone: '0733444555', status: 2, ageDays: 3 },
  { id: 'MTF-2026-M6R2', cat: 'garbage', ward: 'Embakasi East', landmark: 'Nyayo Estate Phase 2 gate',
    desc: 'Garbage has not been collected for three weeks. The heap is now blocking part of the road and smells terrible.',
    name: 'Peter Njoroge', phone: '0744666777', status: 1, ageDays: 2 },
  { id: 'MTF-2026-W8T5', cat: 'drainage', ward: 'Mvita, Mombasa', landmark: 'Near Makadara Mosque',
    desc: 'Blocked drainage on Abdel Nasser Road. Every light rain floods the shops along the road.',
    name: 'Swaleh Omar', phone: '0755888999', status: 0, ageDays: 1 }
];

async function ensureSeed() {
  // --- admin accounts (management system) -----------------------------------
  authInitSchema();
  if (authCountAccounts() === 0) {
    const username = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    authCreateAccount(username, password, 'admin');
    console.log(`Created default admin account "${username}".`);
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('  ⚠  Using default password "admin123" — set ADMIN_PASSWORD and change it!');
    }

    // one scoped operator account per organization (demo passwords)
    for (const org of ORGANIZATIONS) {
      const orgUser = `${org.id}-admin`;
      if (!authFindByUsername(orgUser)) {
        authCreateAccount(orgUser, `${org.id}123`, 'org', org.id);
        console.log(`Created org operator account "${orgUser}" (${org.name}).`);
      }
    }
    console.warn('  ⚠  Org operator demo passwords are "<orgId>123" — change them in production!');
  }

  // --- sample reports -------------------------------------------------------
  if (reportCount() > 0) return; // already has data
  const now = Date.now();
  for (const s of SEED) {
    const created = new Date(now - s.ageDays * 86400000).toISOString();
    _dbRun(
      `INSERT INTO reports (id, cat, ward, landmark, description, name, phone, photo, status, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      [s.id, s.cat, s.ward, s.landmark, s.desc, s.name, s.phone, s.status, created, created]
    );
    // build a simple status history up to the current status
    for (let i = 0; i <= s.status; i++) {
      _dbRun('INSERT INTO status_history (report_id, status, note, at) VALUES (?, ?, ?, ?)',
        [s.id, i, i === 0 ? 'Received by Mtaafix' : null, created]);
    }
  }
  console.log(`Seeded ${SEED.length} sample reports.`);
}



// ============================================================================
// FILE: src/routes.js
// TYPE: Public API Routes — unauthenticated REST endpoints
// ============================================================================

// const express = require('express');  — already required above
// const reports = require('./reports');
// const organizations = require('./organizations');
// const { CATEGORIES, STATUSES } = require('./constants');
// const { validateReport, validateStatus } = require('./validate');
// const { upload, saveDataUrl } = require('./uploads');

function buildPublicRoutes() {
  const router = express.Router();

  // --- reference data ---------------------------------------------------------
  router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  router.get('/categories', (req, res) => res.json(CATEGORIES));
  router.get('/statuses', (req, res) => res.json(STATUSES));
  router.get('/stats', (req, res) => res.json(reportStats()));

  // --- organizations (public accountability data) -----------------------------
  router.get('/organizations', (req, res) => res.json(orgListWithStats()));

  router.get('/organizations/:id', (req, res) => {
    const org = orgDetail(req.params.id);
    if (!org) return res.status(404).json({ error: 'Unknown organization' });
    // include the org's public (masked) reports
    org.reports = reportList({ cats: orgCategoriesForOrg(req.params.id) });
    res.json(org);
  });

  // --- public reads -----------------------------------------------------------
  router.get('/reports', (req, res) => {
    const { category, status } = req.query;
    res.json(reportList({ category, status }));
  });

  router.get('/reports/:id', (req, res) => {
    const r = reportGetById(req.params.id);
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

    const created = reportCreate(value);
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
    const updated = reportSetStatus(req.params.id, value, req.body.note);
    if (!updated) return res.status(404).json({ error: 'No report found with that ID' });
    res.json(updated);
  });

  return router;
}



// ============================================================================
// FILE: src/adminRoutes.js
// TYPE: Admin API Routes — authenticated management endpoints with role scoping
// ============================================================================
// Management-system API. All routes except /login require a valid session
// (Authorization: Bearer <token>). These endpoints expose full report details
// including raw contact info, so they must stay behind authentication.
//
// Two roles exist:
//   'admin' - super administrator, sees everything and manages accounts.
//   'org'   - organization operator, scoped to only the report categories that
//             belong to their organization (auth.user.org).

// const express = require('express');  — already required above
// const auth = require('./auth');
// const reports = require('./reports');
// const organizations = require('./organizations');
// const { validateStatus } = require('./validate');

function buildAdminRoutes() {
  const router = express.Router();

  // Categories the current user is allowed to touch, or null for unrestricted.
  function scopeCats(user) {
    if (user.role === 'org' && user.org) return orgCategoriesForOrg(user.org);
    return null;
  }

  // Guard: only super admins may manage accounts / view every organization.
  function requireSuperAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: super-admin access required' });
    }
    next();
  }

  // --- session ----------------------------------------------------------------
  router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
    const session = authLogin(String(username), String(password));
    if (!session) return res.status(401).json({ error: 'Invalid username or password' });
    res.json(session);
  });

  router.post('/logout', authRequireAuth, (req, res) => {
    authLogout(req.token);
    res.json({ ok: true });
  });

  router.get('/me', authRequireAuth, (req, res) => res.json({ user: req.user }));

  // --- reports management -----------------------------------------------------
  router.get('/reports', authRequireAuth, (req, res) => {
    const { category, status, q } = req.query;
    const cats = scopeCats(req.user);
    // If an org operator requests a specific category outside their scope, deny.
    if (cats && category && !cats.includes(category)) {
      return res.status(403).json({ error: 'Forbidden: category outside your organization' });
    }
    res.json(reportListFull({ category, status, q, cats: cats || undefined }));
  });

  router.get('/reports/:id', authRequireAuth, (req, res) => {
    const r = reportGetByIdFull(req.params.id);
    if (!r) return res.status(404).json({ error: 'No report found with that ID' });
    const cats = scopeCats(req.user);
    if (cats && !cats.includes(r.cat)) return res.status(403).json({ error: 'Forbidden: report outside your organization' });
    res.json(r);
  });

  router.patch('/reports/:id/status', authRequireAuth, (req, res) => {
    const existing = reportGetByIdFull(req.params.id);
    if (!existing) return res.status(404).json({ error: 'No report found with that ID' });
    const cats = scopeCats(req.user);
    if (cats && !cats.includes(existing.cat)) return res.status(403).json({ error: 'Forbidden: report outside your organization' });
    const { value, errors } = validateStatus(req.body.status);
    if (errors) return res.status(400).json({ errors });
    const note = req.body.note || `Status set by ${req.user.username}`;
    const updated = reportSetStatus(req.params.id, value, note);
    if (!updated) return res.status(404).json({ error: 'No report found with that ID' });
    res.json(reportGetByIdFull(req.params.id));
  });

  router.delete('/reports/:id', authRequireAuth, (req, res) => {
    const existing = reportGetByIdFull(req.params.id);
    if (!existing) return res.status(404).json({ error: 'No report found with that ID' });
    const cats = scopeCats(req.user);
    if (cats && !cats.includes(existing.cat)) return res.status(403).json({ error: 'Forbidden: report outside your organization' });
    const ok = reportRemove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'No report found with that ID' });
    res.json({ ok: true });
  });

  router.get('/stats', authRequireAuth, (req, res) => res.json(reportStatsBreakdown()));

  // --- organizations (admin view with full stats) -----------------------------
  router.get('/organizations', authRequireAuth, (req, res) => {
    const cats = scopeCats(req.user);
    if (cats && req.user.org) {
      // org operators only see their own organization
      const org = orgDetail(req.user.org);
      return res.json(org ? [org] : []);
    }
    res.json(orgListWithStats());
  });

  router.get('/organizations/:id', authRequireAuth, (req, res) => {
    if (req.user.role === 'org' && req.user.org !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: not your organization' });
    }
    const org = orgDetail(req.params.id);
    if (!org) return res.status(404).json({ error: 'Unknown organization' });
    res.json(org);
  });

  // --- account management (super-admin only) ----------------------------------
  router.get('/accounts', authRequireAuth, requireSuperAdmin, (req, res) => {
    res.json(authListAccounts());
  });

  router.post('/accounts', authRequireAuth, requireSuperAdmin, (req, res) => {
    const { username, password, role, org } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
    const r = role === 'org' ? 'org' : 'admin';
    if (r === 'org' && !orgIsValid(org)) {
      return res.status(400).json({ error: 'org role requires a valid organization id' });
    }
    if (authFindByUsername(String(username))) {
      return res.status(409).json({ error: 'That username is already taken' });
    }
    const account = authCreateAccount(String(username), String(password), r, r === 'org' ? org : null);
    res.status(201).json(account);
  });

  return router;
}
