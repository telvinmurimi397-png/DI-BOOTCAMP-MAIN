"""Request validation."""

from constants import CATEGORY_IDS, STATUSES, is_valid_area

MAX = {"ward": 120, "landmark": 160, "desc": 2000}


def _s(v):
    return v.strip() if isinstance(v, str) else ""


def validate_report(body):
    """Validate a ruler's create-report payload. Returns (value, None) or (None, errors)."""
    errors = []
    cat = _s(body.get("cat"))
    area = _s(body.get("area"))
    ward = _s(body.get("ward"))
    landmark = _s(body.get("landmark"))
    desc = _s(body.get("desc") or body.get("description"))

    if cat not in CATEGORY_IDS:
        errors.append("cat must be one of: " + ", ".join(CATEGORY_IDS))
    if not is_valid_area(area):
        errors.append("area is required and must be a known area")
    if not ward:
        errors.append("ward is required")
    if not desc:
        errors.append("desc is required")
    if len(ward) > MAX["ward"]:
        errors.append("ward too long")
    if len(landmark) > MAX["landmark"]:
        errors.append("landmark too long")
    if len(desc) > MAX["desc"]:
        errors.append("desc too long")

    if errors:
        return None, errors
    return {"cat": cat, "area": area, "ward": ward, "landmark": landmark, "desc": desc}, None


def validate_status(raw):
    try:
        n = int(raw)
    except (TypeError, ValueError):
        return None, [f"status must be an integer 0..{len(STATUSES) - 1}"]
    if n < 0 or n >= len(STATUSES):
        return None, [f"status must be an integer 0..{len(STATUSES) - 1}"]
    return n, None


def validate_stars(raw):
    try:
        n = int(raw)
    except (TypeError, ValueError):
        return None, ["stars must be an integer 1..5"]
    if n < 1 or n > 5:
        return None, ["stars must be an integer 1..5"]
    return n, None