import os

from backend.auth import hash_password
from backend.db import get_connection


def seed():
    conn = get_connection()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO rulers (username, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)",
            ("admin", hash_password("admin123"), "Admin", "User", "+254700000000"),
        )

        resident_phone = "+254700000001"
        conn.execute(
            "INSERT OR IGNORE INTO residents (name, phone, password_hash) VALUES (?, ?, ?)",
            ("Demo Resident", resident_phone, hash_password("resident123")),
        )

        report_count = conn.execute("SELECT COUNT(*) AS c FROM reports").fetchone()["c"]
        if report_count == 0:
            resident_id = conn.execute("SELECT id FROM residents WHERE phone = ?", (resident_phone,)).fetchone()["id"]
            conn.execute(
                "INSERT INTO reports (resident_id, title, description, area, category, status, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    resident_id,
                    "Broken water pipe",
                    "Water is leaking from the main pipe near the junction.",
                    "Kibera",
                    "Water",
                    "new",
                    -1.285,
                    36.817,
                ),
            )
            conn.execute(
                "INSERT INTO reports (resident_id, title, description, area, category, status, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    resident_id,
                    "Street light outage",
                    "The streetlight by the market has been off for days.",
                    "Central",
                    "Lights",
                    "acknowledged",
                    -1.286,
                    36.816,
                ),
            )
        conn.commit()
    finally:
        conn.close()
