"""Reports: created by area rulers, viewed + rated by residents."""

import random
import string
from datetime import datetime, timezone

import db
import ratings
from constants import STATUSES, area_name


def _now():
    return datetime.now(timezone.utc).isoformat()


def gen_id():
    year = datetime.now().year
    rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"MTF-{year}-{rand}"


def _shape(row, rating=None):
    return {
        "id": row["id"],
        "cat": row["cat"],
        "area": row["area"],
        "areaName": area_name(row["area"]),
        "ward": row["ward"],
        "landmark": row["landmark"] or "",
        "desc": row["description"],
        "author": row["author_name"],
        "authorId": row["author_id"],
        "photo": row["photo"] or None,
        "status": row["status"],
        "statusLabel": STATUSES[row["status"]],
        "created": row["created"],
        "updated": row["updated"],
        "rating": rating or {"avg": 0, "count": 0},
    }


def _query(where, params):
    sql = "SELECT * FROM reports"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY created DESC"
    return db.all(sql, params)


def list(category=None, area=None, status=None, cats=None):
    where, params = [], []
    if category:
        where.append("cat = ?"); params.append(category)
    if area:
        where.append("area = ?"); params.append(area)
    if cats:
        where.append("cat IN (%s)" % ",".join("?" * len(cats))); params.extend(cats)
    if status not in (None, ""):
        where.append("status = ?"); params.append(int(status))
    rows = _query(where, params)
    rmap = ratings.summaries_for([r["id"] for r in rows])
    return [_shape(r, rmap.get(r["id"])) for r in rows]


def get_by_id(report_id, resident_id=None):
    row = db.get("SELECT * FROM reports WHERE id = ?", (str(report_id).upper(),))
    if not row:
        return None
    out = _shape(row, ratings.summary(row["id"], resident_id))
    out["history"] = db.all(
        "SELECT status, note, at FROM status_history WHERE report_id = ? ORDER BY at ASC", (row["id"],))
    return out


def create(data, author):
    """Create a report authored by a ruler. ``author`` is the ruler dict."""
    now = _now()
    report_id = gen_id()
    while db.get("SELECT id FROM reports WHERE id = ?", (report_id,)):
        report_id = gen_id()
    db.run(
        """INSERT INTO reports (id, cat, area, ward, landmark, description,
               author_id, author_name, photo, status, created, updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)""",
        (report_id, data["cat"], data["area"], data["ward"], data.get("landmark") or None,
         data["desc"], author["id"], author["name"], data.get("photo") or None, now, now))
    db.run("INSERT INTO status_history (report_id, status, note, at) VALUES (?, 0, ?, ?)",
           (report_id, "Posted by " + author["name"], now))
    return get_by_id(report_id)


def set_status(report_id, status, note=None):
    row = db.get("SELECT id FROM reports WHERE id = ?", (str(report_id).upper(),))
    if not row:
        return None
    now = _now()
    db.run("UPDATE reports SET status = ?, updated = ? WHERE id = ?", (status, now, row["id"]))
    db.run("INSERT INTO status_history (report_id, status, note, at) VALUES (?, ?, ?, ?)",
           (row["id"], status, note or None, now))
    return get_by_id(row["id"])


def remove(report_id):
    row = db.get("SELECT id FROM reports WHERE id = ?", (str(report_id).upper(),))
    if not row:
        return False
    db.run("DELETE FROM ratings WHERE report_id = ?", (row["id"],))
    db.run("DELETE FROM status_history WHERE report_id = ?", (row["id"],))
    db.run("DELETE FROM reports WHERE id = ?", (row["id"],))
    return True


def count():
    return db.get("SELECT COUNT(*) c FROM reports")["c"]


def stats():
    total = db.get("SELECT COUNT(*) c FROM reports")["c"]
    resolved = db.get("SELECT COUNT(*) c FROM reports WHERE status = 4")["c"]
    active = db.get("SELECT COUNT(*) c FROM reports WHERE status > 0 AND status < 4")["c"]
    categories = db.get("SELECT COUNT(DISTINCT cat) c FROM reports")["c"]
    return {"total": total, "resolved": resolved, "active": active, "categories": categories}


def stats_breakdown():
    base = stats()
    by_status, by_category, by_area = {}, {}, {}
    for r in db.all("SELECT status, COUNT(*) c FROM reports GROUP BY status"):
        by_status[str(r["status"])] = r["c"]
    for r in db.all("SELECT cat, COUNT(*) c FROM reports GROUP BY cat"):
        by_category[r["cat"]] = r["c"]
    for r in db.all("SELECT area, COUNT(*) c FROM reports GROUP BY area"):
        by_area[r["area"]] = r["c"]
    return {**base, "byStatus": by_status, "byCategory": by_category, "byArea": by_area}