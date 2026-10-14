import hashlib
import secrets

from backend.db import get_connection


def _hash_with_scrypt(password: str, salt: str) -> str:
    return hashlib.scrypt(password.encode("utf-8"), salt=salt.encode("utf-8"), n=16384, r=8, p=1, dklen=64).hex()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = _hash_with_scrypt(password, salt)
    return f"scrypt${salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False

    if stored_hash.startswith("scrypt$"):
        try:
            _, salt, digest_hex = stored_hash.split("$", 2)
        except ValueError:
            return False
        candidate = _hash_with_scrypt(password, salt)
        return candidate == digest_hex

    if stored_hash.startswith("pbkdf2_sha256$"):
        try:
            _, salt, digest_hex = stored_hash.split("$", 2)
        except ValueError:
            return False
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 200000)
        return candidate.hex() == digest_hex

    return False


def create_session_for_ruler(ruler_id: int) -> str:
    token = secrets.token_urlsafe(32)
    with get_connection() as conn:
        conn.execute("INSERT INTO sessions (token, ruler_id) VALUES (?, ?)", (token, ruler_id))
        conn.commit()
    return token


def create_session_for_resident(resident_id: int) -> str:
    token = secrets.token_urlsafe(32)
    with get_connection() as conn:
        conn.execute("INSERT INTO sessions (token, resident_id) VALUES (?, ?)", (token, resident_id))
        conn.commit()
    return token


def get_session_user(token: str):
    if not token:
        return None
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE token = ?",
            (token,),
        ).fetchone()
        if not row:
            return None
        if row["ruler_id"]:
            return conn.execute("SELECT * FROM rulers WHERE id = ?", (row["ruler_id"],)).fetchone()
        if row["resident_id"]:
            return conn.execute("SELECT * FROM residents WHERE id = ?", (row["resident_id"],)).fetchone()
    return None
