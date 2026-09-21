"""Resident ratings for reports (1-5 stars, one per resident per report)."""

from datetime import datetime, timezone

import db


def _now():
    return datetime.now(timezone.utc).isoformat()


def rate(report_id, resident_id, stars):
    """Upsert a resident's rating. Returns the fresh summary, or None if the
    report does not exist."""
    rid = str(report_id).upper()
    if not db.get("SELECT id FROM reports WHERE id = ?", (rid,)):
        return None
    now = _now()
    existing = db.get("SELECT id FROM ratings WHERE report_id = ? AND resident_id = ?", (rid, resident_id))
    if existing:
        db.run("UPDATE ratings SET stars = ?, updated = ? WHERE id = ?", (stars, now, existing["id"]))
    else:
        db.run("INSERT INTO ratings (report_id, resident_id, stars, created, updated) VALUES (?, ?, ?, ?, ?)",
               (rid, resident_id, stars, now, now))
    return summary(rid)


def summary(report_id, resident_id=None):
    """Return {avg, count, mine} for a report."""
    rid = str(report_id).upper()
    row = db.get("SELECT COUNT(*) c, AVG(stars) a FROM ratings WHERE report_id = ?", (rid,))
    count = row["c"] or 0
    avg = round(row["a"], 2) if row["a"] is not None else 0
    mine = None
    if resident_id is not None:
        m = db.get("SELECT stars FROM ratings WHERE report_id = ? AND resident_id = ?", (rid, resident_id))
        mine = m["stars"] if m else None
    return {"avg": avg, "count": count, "mine": mine}


def summaries_for(report_ids):
    """Bulk map of report_id -> {avg, count} for listing views."""
    if not report_ids:
        return {}
    placeholders = ",".join("?" * len(report_ids))
    rows = db.all(
        f"SELECT report_id, COUNT(*) c, AVG(stars) a FROM ratings "
        f"WHERE report_id IN ({placeholders}) GROUP BY report_id", report_ids)
    out = {}
    for r in rows:
        out[r["report_id"]] = {"avg": round(r["a"], 2) if r["a"] is not None else 0, "count": r["c"]}
    return out