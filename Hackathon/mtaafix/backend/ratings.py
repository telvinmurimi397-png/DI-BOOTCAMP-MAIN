from backend.db import get_connection


def compute_average(report_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COALESCE(AVG(score), 0) AS avg_rating, COUNT(id) AS rating_count FROM ratings WHERE report_id = ?",
            (report_id,),
        ).fetchone()
    return {"avg_rating": float(row["avg_rating"]), "rating_count": row["rating_count"]}
