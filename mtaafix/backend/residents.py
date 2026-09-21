import json
import os
import sqlite3
from http.server import BaseHTTPRequestHandler

from backend.auth import create_session_for_resident, hash_password, verify_password, get_session_user
from backend.db import get_connection
from backend.validate import is_valid_name, is_valid_phone, is_valid_rating, is_valid_text


def resident_register(payload):
    name = (payload.get("name") or "").strip()
    phone = (payload.get("phone") or "").strip()
    password = payload.get("password") or ""

    if not is_valid_name(name):
        return {"error": "Valid name is required"}, 400
    if not is_valid_phone(phone):
        return {"error": "Valid phone number is required"}, 400
    if len(password) < 6:
        return {"error": "Password must be at least 6 characters"}, 400

    with get_connection() as conn:
        existing = conn.execute("SELECT id FROM residents WHERE phone = ?", (phone,)).fetchone()
        if existing:
            return {"error": "Resident already exists"}, 409
        password_hash = hash_password(password)
        cursor = conn.execute(
            "INSERT INTO residents (name, phone, password_hash) VALUES (?, ?, ?)",
            (name, phone, password_hash),
        )
        resident_id = cursor.lastrowid
        token = create_session_for_resident(resident_id)
        conn.commit()

    return {"token": token, "resident": {"id": resident_id, "name": name, "phone": phone}}, 201


def resident_login(payload):
    phone = (payload.get("phone") or "").strip()
    password = payload.get("password") or ""

    if not is_valid_phone(phone):
        return {"error": "Valid phone number is required"}, 400
    if not password:
        return {"error": "Password is required"}, 400

    with get_connection() as conn:
        resident = conn.execute("SELECT * FROM residents WHERE phone = ?", (phone,)).fetchone()
        if not resident or not verify_password(password, resident["password_hash"]):
            return {"error": "Invalid credentials"}, 401

        token = create_session_for_resident(resident["id"])
        conn.commit()

    return {"token": token, "resident": {"id": resident["id"], "name": resident["name"], "phone": resident["phone"]}}, 200


def resident_me(token):
    user = get_session_user(token)
    if not user or "phone" not in dict(user):
        return {"error": "Unauthorized"}, 401
    return {"resident": {"id": user["id"], "name": user["name"], "phone": user["phone"]}}, 200


def list_reports_for_resident(token):
    user = get_session_user(token)
    if not user or "phone" not in dict(user):
        return {"error": "Unauthorized"}, 401
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT r.*, COALESCE(AVG(rt.score), 0) AS avg_rating, COUNT(rt.id) AS rating_count
            FROM reports r
            LEFT JOIN ratings rt ON rt.report_id = r.id
            WHERE r.resident_id = ?
            GROUP BY r.id
            ORDER BY r.created_at DESC
            """,
            (user["id"],),
        ).fetchall()
    return {"reports": [dict(row) for row in rows]}, 200


def create_report(token, payload):
    user = get_session_user(token)
    if not user or "phone" not in dict(user):
        return {"error": "Unauthorized"}, 401

    title = (payload.get("title") or "").strip()
    description = (payload.get("description") or "").strip()
    area = (payload.get("area") or "").strip()
    category = (payload.get("category") or "").strip()

    if not is_valid_text(title, minimum=3, maximum=80):
        return {"error": "Title is required"}, 400
    if not is_valid_text(description, minimum=10, maximum=2000):
        return {"error": "Description must be at least 10 characters"}, 400
    if not area:
        return {"error": "Area is required"}, 400
    if not category:
        return {"error": "Category is required"}, 400

    latitude = payload.get("latitude")
    longitude = payload.get("longitude")
    image_url = (payload.get("image_url") or "").strip()

    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO reports (resident_id, title, description, area, category, status, latitude, longitude, image_url)
            VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?)
            """,
            (user["id"], title, description, area, category, latitude, longitude, image_url or None),
        )
        report_id = cursor.lastrowid
        conn.execute(
            "INSERT INTO status_history (report_id, status, note) VALUES (?, ?, ?)",
            (report_id, "new", "Submitted by resident"),
        )
        conn.commit()

    return {"report": {"id": report_id, "title": title, "description": description, "area": area, "category": category, "status": "new"}}, 201


def update_report(token, report_id, payload):
    user = get_session_user(token)
    if not user or "phone" not in dict(user):
        return {"error": "Unauthorized"}, 401

    with get_connection() as conn:
        report = conn.execute("SELECT * FROM reports WHERE id = ? AND resident_id = ?", (report_id, user["id"])).fetchone()
        if not report:
            return {"error": "Report not found"}, 404

        title = (payload.get("title") or report["title"]).strip()
        description = (payload.get("description") or report["description"]).strip()
        area = (payload.get("area") or report["area"]).strip()
        category = (payload.get("category") or report["category"]).strip()

        if not is_valid_text(title, minimum=3, maximum=80):
            return {"error": "Title is required"}, 400
        if not is_valid_text(description, minimum=10, maximum=2000):
            return {"error": "Description is too short"}, 400

        conn.execute(
            "UPDATE reports SET title = ?, description = ?, area = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (title, description, area, category, report_id),
        )
        conn.commit()

    return {"message": "Report updated"}, 200


def delete_report(token, report_id):
    user = get_session_user(token)
    if not user or "phone" not in dict(user):
        return {"error": "Unauthorized"}, 401

    with get_connection() as conn:
        result = conn.execute("DELETE FROM reports WHERE id = ? AND resident_id = ?", (report_id, user["id"]))
        conn.commit()
        if result.rowcount == 0:
            return {"error": "Report not found"}, 404
    return {"message": "Report deleted"}, 200


def rate_report(token, report_id, payload):
    user = get_session_user(token)
    if not user or "phone" not in dict(user):
        return {"error": "Unauthorized"}, 401

    score = payload.get("score")
    if not is_valid_rating(score):
        return {"error": "Rating must be between 1 and 5"}, 400

    with get_connection() as conn:
        report = conn.execute("SELECT id FROM reports WHERE id = ?", (report_id,)).fetchone()
        if not report:
            return {"error": "Report not found"}, 404
        conn.execute(
            "INSERT INTO ratings (report_id, resident_id, score) VALUES (?, ?, ?) ON CONFLICT(report_id, resident_id) DO UPDATE SET score = excluded.score",
            (report_id, user["id"], int(score)),
        )
        conn.commit()
    return {"message": "Rating submitted"}, 200
