"""Authentication for both account types.

* Rulers  - salted+hashed passwords (scrypt) + opaque session tokens.
* Residents - passwordless phone login (a session is opened when the phone is
  registered/recognised). NOTE: for production this should be OTP-verified over
  SMS; here we keep it simple per the project brief and flag the trade-off.

Both account types share one ``sessions`` table keyed by (subject_type, id).
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import db

SESSION_TTL = timedelta(hours=8)
_SCRYPT = dict(n=16384, r=8, p=1, dklen=64, maxmem=64 * 1024 * 1024)


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# --- password hashing -------------------------------------------------------
def hash_password(pw):
    salt = secrets.token_hex(16)
    key = hashlib.scrypt(str(pw).encode(), salt=salt.encode(), **_SCRYPT).hex()
    return salt + ":" + key


def verify_password(pw, stored):
    try:
        salt, key = str(stored).split(":", 1)
    except ValueError:
        return False
    if not salt or not key:
        return False
    k = hashlib.scrypt(str(pw).encode(), salt=salt.encode(), **_SCRYPT).hex()
    return hmac.compare_digest(k, key)


# --- sessions ---------------------------------------------------------------
def _open_session(subject_type, subject_id):
    token = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    db.run("INSERT INTO sessions (token, subject_type, subject_id, created, expires) VALUES (?, ?, ?, ?, ?)",
           (token, subject_type, subject_id, now.isoformat(), (now + SESSION_TTL).isoformat()))
    return token, (now + SESSION_TTL).isoformat()


def logout(token):
    if token:
        db.run("DELETE FROM sessions WHERE token = ?", (token,))


def _session_row(token):
    if not token:
        return None
    s = db.get("SELECT * FROM sessions WHERE token = ?", (token,))
    if not s:
        return None
    if datetime.fromisoformat(s["expires"]) < datetime.now(timezone.utc):
        logout(token)
        return None
    return s


def ruler_from_token(token):
    s = _session_row(token)
    if not s or s["subject_type"] != "ruler":
        return None
    r = db.get("SELECT id, username, name, role, area FROM rulers WHERE id = ?", (s["subject_id"],))
    return dict(r) if r else None


def resident_from_token(token):
    s = _session_row(token)
    if not s or s["subject_type"] != "resident":
        return None
    r = db.get("SELECT id, phone, name, area, verified FROM residents WHERE id = ?", (s["subject_id"],))
    return dict(r) if r else None


# --- ruler accounts ---------------------------------------------------------
def create_ruler(username, password, name, role="ruler", area=None):
    db.run("INSERT INTO rulers (username, password, name, role, area, created) VALUES (?, ?, ?, ?, ?, ?)",
           (username, hash_password(password), name, role, area, _now_iso()))
    return db.get("SELECT id, username, name, role, area, created FROM rulers WHERE username = ?", (username,))


def find_ruler(username):
    return db.get("SELECT * FROM rulers WHERE username = ?", (username,))


def list_rulers():
    return db.all("SELECT id, username, name, role, area, created FROM rulers ORDER BY id ASC")


def count_rulers():
    return db.get("SELECT COUNT(*) c FROM rulers")["c"]


def ruler_login(username, password):
    acc = find_ruler(username)
    if not acc or not verify_password(password, acc["password"]):
        return None
    token, expires = _open_session("ruler", acc["id"])
    return {"token": token, "expires": expires,
            "user": {"id": acc["id"], "username": acc["username"], "name": acc["name"],
                     "role": acc["role"], "area": acc["area"]}}