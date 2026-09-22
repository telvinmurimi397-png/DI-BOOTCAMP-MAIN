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
    area plus those subscribed to all areas (area is NULL).

    Only residents who opted in to SMS alerts (``subscribed = 1``) are
    returned, so residents who signed in without ticking "receive messages"
    are never texted."""
    if area:
        return db.all(
            "SELECT * FROM residents WHERE subscribed = 1 AND (area = ? OR area IS NULL) "
            "ORDER BY id ASC", (area,))
    return db.all("SELECT * FROM residents WHERE subscribed = 1 ORDER BY id ASC")


def count():
    return db.get("SELECT COUNT(*) c FROM residents")["c"]


def register_or_login(phone_raw, name=None, area=None, subscribe=True):
    """Register the phone if new, then open a resident session.

    ``subscribe`` reflects the "receive messages" opt-in on the sign-in page.
    When True the resident is added to the SMS alert list; when False they can
    still view and rate reports but will not be texted.

    Returns ``(session_dict, None)`` or ``(None, error_message)``.
    """
    phone = normalize_phone(phone_raw)
    if not phone:
        return None, "A valid phone number is required"
    if area and not is_valid_area(area):
        return None, "Unknown area"
    sub = 1 if subscribe else 0
    row = find_by_phone(phone)
    if not row:
        db.run("INSERT INTO residents (phone, name, area, verified, subscribed, created) "
               "VALUES (?, ?, ?, 1, ?, ?)",
               (phone, (name or None), area or None, sub, _now()))
        row = find_by_phone(phone)
    else:
        # Update optional profile fields and the subscription choice on re-login.
        db.run("UPDATE residents SET name = COALESCE(?, name), area = COALESCE(?, area), "
               "subscribed = ? WHERE id = ?",
               (name or None, area or None, sub, row["id"]))
        row = find_by_phone(phone)
    token, expires = auth._open_session("resident", row["id"])
    return {"token": token, "expires": expires,
            "user": {"id": row["id"], "phone": row["phone"], "name": row["name"],
                     "area": row["area"], "verified": bool(row["verified"]),
                     "subscribed": bool(row["subscribed"])}}, None


def set_subscription(resident_id, subscribe):
    """Toggle a signed-in resident's SMS opt-in. Returns the new state."""
    db.run("UPDATE residents SET subscribed = ? WHERE id = ?",
           (1 if subscribe else 0, resident_id))
    return bool(subscribe)


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