import os
import sqlite3
from contextlib import closing

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "mtaafix.db")
DB_PATH = os.path.abspath(DB_PATH)


os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with closing(get_connection()) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS rulers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                phone TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS residents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                resident_id INTEGER,
                ruler_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(resident_id) REFERENCES residents(id),
                FOREIGN KEY(ruler_id) REFERENCES rulers(id)
            );

            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                resident_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                area TEXT NOT NULL,
                category TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                latitude REAL,
                longitude REAL,
                image_url TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(resident_id) REFERENCES residents(id)
            );

            CREATE TABLE IF NOT EXISTS status_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                note TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(report_id) REFERENCES reports(id)
            );

            CREATE TABLE IF NOT EXISTS ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                resident_id INTEGER NOT NULL,
                score INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(report_id, resident_id),
                FOREIGN KEY(report_id) REFERENCES reports(id),
                FOREIGN KEY(resident_id) REFERENCES residents(id)
            );

            CREATE TABLE IF NOT EXISTS sms_outbox (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER,
                recipient TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'queued',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        conn.commit()


def seed_demo_data():
    from backend.seed import seed
    seed()
