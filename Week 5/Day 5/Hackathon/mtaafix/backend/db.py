"""Persistence layer backed by the standard-library sqlite3 module.

Schema:
  rulers          - area rulers / officials (the only accounts allowed to post)
  residents       - phone-based accounts that can view + rate + get SMS alerts
  sessions        - opaque tokens for both rulers and residents
  reports         - civic issue reports, each authored by a ruler
  status_history  - status timeline per report
  ratings         - one rating (1-5) per resident per report
  sms_outbox      - AI-composed SMS notifications sent to residents
"""

import os
import sqlite3
import threading

_HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(_HERE, "..", "data")
DB_FILE = os.path.join(DATA_DIR, "mtaafix.sqlite")

_conn = None
_lock = threading.Lock()


def init(db_file=None):
    """Open (creating if needed) the database and ensure the schema exists."""
    global _conn, DB_FILE
    if db_file is not None:
        DB_FILE = db_file
    os.makedirs(DATA_DIR, exist_ok=True)
    _conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    _conn.row_factory = sqlite3.Row
    _conn.execute("PRAGMA journal_mode=WAL;")
    _conn.execute("PRAGMA foreign_keys=ON;")
    _conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS rulers (
          id       INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT    NOT NULL UNIQUE,
          password TEXT    NOT NULL,
          name     TEXT    NOT NULL,
          role     TEXT    NOT NULL DEFAULT 'ruler',   -- 'admin' | 'ruler'
          area     TEXT,                                -- area id (null for admin)
          created  TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS residents (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          phone      TEXT    NOT NULL UNIQUE,
          name       TEXT,
          area       TEXT,          -- preferred area, or null = all areas
          verified   INTEGER NOT NULL DEFAULT 0,
          subscribed INTEGER NOT NULL DEFAULT 1,   -- opted in to SMS alerts
          created    TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
          token        TEXT PRIMARY KEY,
          subject_type TEXT NOT NULL,   -- 'ruler' | 'resident'
          subject_id   INTEGER NOT NULL,
          created      TEXT NOT NULL,
          expires      TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reports (
          id          TEXT PRIMARY KEY,
          cat         TEXT    NOT NULL,
          area        TEXT    NOT NULL,
          ward        TEXT    NOT NULL,
          landmark    TEXT,
          description TEXT    NOT NULL,
          author_id   INTEGER NOT NULL,
          author_name TEXT    NOT NULL,
          photo       TEXT,
          status      INTEGER NOT NULL DEFAULT 0,
          created     TEXT    NOT NULL,
          updated     TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS status_history (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          report_id TEXT    NOT NULL,
          status    INTEGER NOT NULL,
          note      TEXT,
          at        TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ratings (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          report_id   TEXT    NOT NULL,
          resident_id INTEGER NOT NULL,
          stars       INTEGER NOT NULL,   -- 1..5
          created     TEXT    NOT NULL,
          updated     TEXT    NOT NULL,
          UNIQUE (report_id, resident_id)
        );

        CREATE TABLE IF NOT EXISTS sms_outbox (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          report_id    TEXT,
          resident_id  INTEGER NOT NULL,
          phone        TEXT    NOT NULL,
          body         TEXT    NOT NULL,
          ai_generated INTEGER NOT NULL DEFAULT 1,
          status       TEXT    NOT NULL DEFAULT 'sent',  -- queued|sent|failed
          confirmed    INTEGER NOT NULL DEFAULT 0,
          created      TEXT    NOT NULL
        );
        """
    )
    _migrate(_conn)
    _conn.commit()
    return _conn


def _migrate(conn):
    """Lightweight, idempotent migrations for databases created before a
    column was added. CREATE TABLE IF NOT EXISTS never alters an existing
    table, so new columns must be added explicitly here."""
    cols = {r["name"] for r in [dict(x) for x in conn.execute("PRAGMA table_info(residents)")]}
    if "subscribed" not in cols:
        # Existing residents keep receiving alerts (default 1) to avoid a
        # silent opt-out on upgrade.
        conn.execute("ALTER TABLE residents ADD COLUMN subscribed INTEGER NOT NULL DEFAULT 1")


def _require():
    if _conn is None:
        raise RuntimeError("db.init() must be called before using the database")
    return _conn


def all(sql, params=()):
    conn = _require()
    with _lock:
        cur = conn.execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]
        cur.close()
    return rows


def get(sql, params=()):
    rows = all(sql, params)
    return rows[0] if rows else None


def run(sql, params=()):
    conn = _require()
    with _lock:
        cur = conn.execute(sql, params)
        conn.commit()
        last = cur.lastrowid
        cur.close()
    return last