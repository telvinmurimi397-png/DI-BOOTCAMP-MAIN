from backend.db import get_connection
from backend.validate import is_valid_text


def list_reports(include_all=False, resident_id=None):
    with get_connection() as conn:
        if include_all:
            rows = conn.execute(
                """
                SELECT r.*, res.name AS resident_name, res.phone AS resident_phone,
                       COALESCE(AVG(rt.score), 0) AS avg_rating, COUNT(rt.id) AS rating_count
                FROM reports r
                JOIN residents res ON res.id = r.resident_id
                LEFT JOIN ratings rt ON rt.report_id = r.id
                GROUP BY r.id
                ORDER BY r.created_at DESC
                """
            ).fetchall()
        elif resident_id is not None:
            rows = conn.execute(
                """
                SELECT r.*, res.name AS resident_name, res.phone AS resident_phone,
                       COALESCE(AVG(rt.score), 0) AS avg_rating, COUNT(rt.id) AS rating_count
                FROM reports r
                JOIN residents res ON res.id = r.resident_id
                LEFT JOIN ratings rt ON rt.report_id = r.id
                WHERE r.resident_id = ?
                GROUP BY r.id
                ORDER BY r.created_at DESC
                """,
                (resident_id,),
            ).fetchall()
        else:
            rows = []
    return [dict(row) for row in rows]


def get_report_by_id(report_id):
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT r.*, res.name AS resident_name, res.phone AS resident_phone,
                   COALESCE(AVG(rt.score), 0) AS avg_rating, COUNT(rt.id) AS rating_count
            FROM reports r
            JOIN residents res ON res.id = r.resident_id
            LEFT JOIN ratings rt ON rt.report_id = r.id
            WHERE r.id = ?
            GROUP BY r.id
            """,
            (report_id,),
        ).fetchone()
    return dict(row) if row else None


def update_status(report_id, status, note=""):
    if not status:
        return {"error": "Status is required"}, 400
    with get_connection() as conn:
        existing = conn.execute("SELECT id FROM reports WHERE id = ?", (report_id,)).fetchone()
        if not existing:
            return {"error": "Report not found"}, 404
        conn.execute(
            "UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (status, report_id),
        )
        conn.execute(
            "INSERT INTO status_history (report_id, status, note) VALUES (?, ?, ?)",
            (report_id, status, note or "Updated by ruler"),
        )
        conn.commit()
    return {"message": "Status updated"}, 200


def add_message(report_id, message):
    if not is_valid_text(message, minimum=3, maximum=500):
        return {"error": "Message is required"}, 400
    with get_connection() as conn:
        report = conn.execute("SELECT id, resident_id FROM reports WHERE id = ?", (report_id,)).fetchone()
        if not report:
            return {"error": "Report not found"}, 404
        resident = conn.execute("SELECT phone FROM residents WHERE id = ?", (report["resident_id"],)).fetchone()
        if resident:
            conn.execute(
                "INSERT INTO sms_outbox (report_id, recipient, content, status) VALUES (?, ?, ?, 'queued')",
                (report_id, resident["phone"], message),
            )
        conn.commit()
    return {"message": "Message queued"}, 200
