"""Resident accounts: phone-based registration/login and SMS subscription.

Residents can view + rate reports and receive SMS alerts. They can NEVER post.
"""

import re
from datetime import datetime, timezone

import db
import auth
from constants import is_valid_area

_PHONE = re.compile(r"^\+?\d[\d\s-]{6,18}$")


def _now():
    return datetime.now(timezone.utc).isoformat()


def normalize_phone(raw):
    """Trim spaces/dashes; keep a leading +. Returns None if it doesn't look valid."""
    if not isinstance(raw, str):
        return None
    v = raw.strip()
    if not _PHONE.match(v):
        return None
    plus = v.startswith("+")
    digits = re.sub(r"\D", "", v)
    if len(digits) < 7:
        return None
    return ("+" if plus else "") + digits


def find_by_phone(phone):
    return db.get("SELECT * FROM residents WHERE phone = ?", (phone,))


def list_residents(area=None):
    """Residents to notify for a report in ``area``: those subscribed to that
    area plus those subscribed to all areas (area is NULL)."""
    if area:
        return db.all("SELECT * FROM residents WHERE area = ? OR area IS NULL ORDER BY id ASC", (area,))
    return db.all("SELECT * FROM residents ORDER BY id ASC")


def count():
    return db.get("SELECT COUNT(*) c FROM residents")["c"]


def register_or_login(phone_raw, name=None, area=None):
    """Register the phone if new, then open a resident session.

    Returns ``(session_dict, None)`` or ``(None, error_message)``.
    """
    phone = normalize_phone(phone_raw)
    if not phone:
        return None, "A valid phone number is required"
    if area and not is_valid_area(area):
        return None, "Unknown area"
    row = find_by_phone(phone)
    if not row:
        db.run("INSERT INTO residents (phone, name, area, verified, created) VALUES (?, ?, ?, 1, ?)",
               (phone, (name or None), area or None, _now()))
        row = find_by_phone(phone)
    else:
        # update optional profile fields on re-login
        if name or area:
            db.run("UPDATE residents SET name = COALESCE(?, name), area = COALESCE(?, area) WHERE id = ?",
                   (name or None, area or None, row["id"]))
            row = find_by_phone(phone)
    token, expires = auth._open_session("resident", row["id"])
    return {"token": token, "expires": expires,
            "user": {"id": row["id"], "phone": row["phone"], "name": row["name"],
                     "area": row["area"], "verified": bool(row["verified"])}}, None


def notifications_for(resident_id):
    return db.all(
        "SELECT id, report_id, body, status, confirmed, created FROM sms_outbox "
        "WHERE resident_id = ? ORDER BY created DESC", (resident_id,))


def confirm_notification(resident_id, sms_id):
    row = db.get("SELECT id FROM sms_outbox WHERE id = ? AND resident_id = ?", (sms_id, resident_id))
    if not row:
        return False
    db.run("UPDATE sms_outbox SET confirmed = 1 WHERE id = ?", (sms_id,))
    return True