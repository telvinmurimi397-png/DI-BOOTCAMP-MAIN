"""Seed rulers, a couple of residents, and sample reports on first run."""

import os
from datetime import datetime, timedelta, timezone

import db
import auth
import reports
import residents
from constants import AREAS

# One area ruler per area (demo passwords), plus a super-admin ruler.
RULERS = [
    {"username": "kasarani-ruler", "name": "Kasarani Area Ruler", "area": "kasarani"},
    {"username": "kibera-ruler",   "name": "Kibera Area Ruler",   "area": "kibera"},
    {"username": "westlands-ruler", "name": "Westlands Area Ruler", "area": "westlands"},
    {"username": "embakasi-ruler", "name": "Embakasi Area Ruler", "area": "embakasi"},
    {"username": "mvita-ruler",    "name": "Mvita Area Ruler",    "area": "mvita"},
]

SEED_REPORTS = [
    {"cat": "roads", "area": "kasarani", "ward": "Kasarani", "landmark": "Near Kasarani Stadium gate B",
     "desc": "Pothole repair works on Kasarani-Mwiki road begin this week. Expect diversions between 8am and 4pm.",
     "author": "kasarani-ruler", "status": 3, "ageDays": 4},
    {"cat": "water", "area": "kibera", "ward": "Sarang'ombe", "landmark": "Behind Toi Market",
     "desc": "Burst water pipe behind Toi Market has been reported to the utility. Repair team dispatched.",
     "author": "kibera-ruler", "status": 2, "ageDays": 2},
    {"cat": "lights", "area": "westlands", "ward": "Parklands", "landmark": "5th Avenue",
     "desc": "Streetlights along 5th Avenue will be restored on Friday. Please stay alert at night until then.",
     "author": "westlands-ruler", "status": 1, "ageDays": 1},
]


def ensure_seed():
    if auth.count_rulers() == 0:
        admin_user = os.environ.get("ADMIN_USER", "admin")
        admin_pass = os.environ.get("ADMIN_PASSWORD", "admin123")
        auth.create_ruler(admin_user, admin_pass, "Chief Administrator", role="admin", area=None)
        print(f'Created super-admin ruler "{admin_user}".')
        if not os.environ.get("ADMIN_PASSWORD"):
            print('  WARNING: Using default admin password "admin123" - set ADMIN_PASSWORD and change it!')
        for r in RULERS:
            auth.create_ruler(r["username"], f"{r['area']}123", r["name"], role="ruler", area=r["area"])
            print(f'Created area ruler "{r["username"]}".')
        print('  WARNING: Area ruler demo passwords are "<areaId>123" - change them in production!')

    if residents.count() == 0:
        residents.register_or_login("0712345678", name="Jane Resident", area="kasarani")
        residents.register_or_login("0722111222", name="Peter Resident", area=None)
        print("Seeded 2 demo residents.")

    if reports.count() == 0:
        now = datetime.now(timezone.utc)
        for s in SEED_REPORTS:
            ruler = auth.find_ruler(s["author"])
            author = {"id": ruler["id"], "name": ruler["name"]}
            created = (now - timedelta(days=s["ageDays"])).isoformat()
            rid = reports.gen_id()
            db.run(
                """INSERT INTO reports (id, cat, area, ward, landmark, description,
                       author_id, author_name, photo, status, created, updated)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)""",
                (rid, s["cat"], s["area"], s["ward"], s["landmark"], s["desc"],
                 author["id"], author["name"], s["status"], created, created))
            for i in range(s["status"] + 1):
                db.run("INSERT INTO status_history (report_id, status, note, at) VALUES (?, ?, ?, ?)",
                       (rid, i, ("Posted by " + author["name"]) if i == 0 else None, created))
        print(f"Seeded {len(SEED_REPORTS)} sample reports.")


if __name__ == "__main__":
    db.init()
    ensure_seed()