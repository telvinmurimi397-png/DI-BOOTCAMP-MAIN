import re
from urllib.parse import urlparse


def is_valid_phone(phone: str) -> bool:
    if not phone:
        return False
    return bool(re.fullmatch(r"\+?[0-9]{7,15}", phone.strip()))


def is_valid_name(value: str) -> bool:
    if not value:
        return False
    text = value.strip()
    return len(text) >= 2 and len(text) <= 80


def is_valid_text(value: str, minimum: int = 5, maximum: int = 500) -> bool:
    if value is None:
        return False
    text = value.strip()
    return minimum <= len(text) <= maximum


def is_valid_rating(value) -> bool:
    try:
        score = int(value)
    except (TypeError, ValueError):
        return False
    return 1 <= score <= 5


def is_valid_url(value: str) -> bool:
    if not value:
        return True
    try:
        parsed = urlparse(value)
        return bool(parsed.scheme and parsed.netloc)
    except Exception:
        return False
