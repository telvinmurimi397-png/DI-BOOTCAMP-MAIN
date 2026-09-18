// Lightweight persistence layer backed by sql.js (SQLite compiled to WASM).
// No native compilation required — runs on any Node version.
// The database lives entirely in memory and is flushed to disk after each
// write so it survives restarts.

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'mtaafix.sqlite');

let db = null;

async function init() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const SQL = await initSqlJs();

  db = fs.existsSync(DB_FILE)
    ? new SQL.Database(fs.readFileSync(DB_FILE))
    : new SQL.Database();

  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS status_history (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT    NOT NULL,
      status    INTEGER NOT NULL,
      note      TEXT,
      at        TEXT    NOT NULL
    );
  `);

  persist();
  return db;
}

function persist() {
  if (!db) return;
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
}

// --- tiny query helpers -----------------------------------------------------
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  persist();
}

module.exports = { init, all, get, run, persist, DATA_DIR, DB_FILE };