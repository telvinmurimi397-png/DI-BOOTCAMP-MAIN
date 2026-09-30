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

        CREATE TABLE IF NOT EXISTS ruler_login_requests (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          request_hash      TEXT NOT NULL UNIQUE,
          ruler_id          INTEGER NOT NULL,
          status            TEXT NOT NULL DEFAULT 'pending',
          created           TEXT NOT NULL,
          expires           TEXT NOT NULL,
          reviewed_at       TEXT,
          reviewed_by       INTEGER,
          FOREIGN KEY(ruler_id) REFERENCES rulers(id),
          FOREIGN KEY(reviewed_by) REFERENCES rulers(id)
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


def create_ruler_login_request(request_hash, ruler_id, created, expires):
    return run(
        "INSERT INTO ruler_login_requests (request_hash, ruler_id, created, expires) "
        "VALUES (?, ?, ?, ?)",
        (request_hash, ruler_id, created, expires),
    )


def get_ruler_login_request(request_hash):
    return get(
        "SELECT status, expires FROM ruler_login_requests WHERE request_hash = ?",
        (request_hash,),
    )


def list_pending_ruler_login_requests(now):
    return all(
        "SELECT req.id, req.created, req.expires, ruler.username, ruler.name, ruler.area "
        "FROM ruler_login_requests AS req "
        "JOIN rulers AS ruler ON ruler.id = req.ruler_id "
        "WHERE req.status = 'pending' AND req.expires > ? "
        "ORDER BY req.created ASC",
        (now,),
    )


def decide_ruler_login_request(request_id, reviewer_id, decision, now):
    conn = _require()
    with _lock:
        # The conditional update prevents a second admin from deciding an expired or reviewed request.
        cursor = conn.execute(
            "UPDATE ruler_login_requests SET status = ?, reviewed_at = ?, reviewed_by = ? "
            "WHERE id = ? AND status = 'pending' AND expires > ?",
            (decision, now, reviewer_id, request_id, now),
        )
        conn.commit()
        updated = cursor.rowcount == 1
        cursor.close()
    return updated


def expire_ruler_login_request(request_hash):
    run(
        "UPDATE ruler_login_requests SET status = 'expired' "
        "WHERE request_hash = ? AND status IN ('pending', 'approved')",
        (request_hash,),
    )


def consume_approved_ruler_login_request(request_hash, now, session_token, session_expires):
    conn = _require()
    with _lock:
        # Serialize approval consumption so concurrent polls cannot create multiple sessions.
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute(
            "SELECT ruler.id, ruler.username, ruler.name, ruler.role, ruler.area "
            "FROM ruler_login_requests AS req "
            "JOIN rulers AS ruler ON ruler.id = req.ruler_id "
            "WHERE req.request_hash = ? AND req.status = 'approved' AND req.expires > ?",
            (request_hash, now),
        ).fetchone()
        if not row:
            conn.commit()
            return None
        updated = conn.execute(
            "UPDATE ruler_login_requests SET status = 'consumed' "
            "WHERE request_hash = ? AND status = 'approved'",
            (request_hash,),
        )
        if updated.rowcount != 1:
            conn.rollback()
            return None
        conn.execute(
            "INSERT INTO sessions (token, subject_type, subject_id, created, expires) "
            "VALUES (?, 'ruler', ?, ?, ?)",
            (session_token, row["id"], now, session_expires),
        )
        conn.commit()
        return dict(row)