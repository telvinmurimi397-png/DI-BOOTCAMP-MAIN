"""Mtaafix backend (stdlib-only Python: http.server + sqlite3).

Roles:
  * Resident  - logs in with a phone number; can VIEW and RATE reports and
    receive AI-composed SMS alerts. Residents can NEVER post.
  * Area ruler - the only accounts allowed to POST reports. 'admin' rulers see
    every area and manage ruler accounts; 'ruler' accounts are scoped to one area.

When a ruler posts a report, an AI-composed SMS is sent to every subscribed
resident asking them to confirm they've seen it.
"""

import json
import mimetypes
import os
import re
import urllib.parse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

_HERE = os.path.dirname(os.path.abspath(__file__))


def _load_env():
    env_path = os.path.join(_HERE, "..", ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            m = re.match(r"^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$", line, re.I)
            if m and m.group(1) not in os.environ:
                os.environ[m.group(1)] = m.group(2).strip("'\"")


_load_env()

import db
import auth
import residents as residents_mod
import reports
import ratings
import sms
import seed
from constants import CATEGORIES, STATUSES, AREAS
from validate import validate_report, validate_status, validate_stars

PORT = int(os.environ.get("PORT", "4000"))
FRONTEND_DIR = os.path.join(_HERE, "..", "frontend")


class ApiError(Exception):
    def __init__(self, status, payload):
        self.status = status
        self.payload = payload


def _now():
    return datetime.now(timezone.utc).isoformat()


class Req:
    def __init__(self, handler, method, path, query, body_bytes, headers):
        self.h = handler
        self.method = method
        self.path = path
        self.query = query
        self.body_bytes = body_bytes
        self.headers = headers
        self._json = None

    @property
    def json(self):
        if self._json is None:
            self._json = {}
            ctype = self.headers.get("Content-Type", "")
            if self.body_bytes:
                if "application/json" in ctype:
                    try:
                        self._json = json.loads(self.body_bytes.decode("utf-8"))
                    except Exception:
                        self._json = {}
                elif "application/x-www-form-urlencoded" in ctype:
                    parsed = urllib.parse.parse_qs(self.body_bytes.decode("utf-8"))
                    self._json = {k: v[0] for k, v in parsed.items()}
        return self._json

    def q(self, name, default=None):
        v = self.query.get(name)
        return v[0] if v else default

    def header(self, name, default=""):
        return self.headers.get(name, default)

    @property
    def token(self):
        bearer = re.sub(r"^Bearer\s+", "", self.header("Authorization", ""), flags=re.I)
        return bearer or self.header("X-Auth-Token", "")


def require_resident(req):
    u = auth.resident_from_token(req.token)
    if not u:
        raise ApiError(401, {"error": "Unauthorized: resident login required"})
    return u


def require_ruler(req):
    u = auth.ruler_from_token(req.token)
    if not u:
        raise ApiError(401, {"error": "Unauthorized: ruler login required"})
    return u


def require_admin(user):
    if user["role"] != "admin":
        raise ApiError(403, {"error": "Forbidden: super-admin ruler access required"})


# ---------------------------------------------------------------------------
# Public + resident API (/api/...)
# ---------------------------------------------------------------------------
def api_routes(req):
    p, m = req.path, req.method

    # --- reference data ----------------------------------------------------
    if p == "/api/health" and m == "GET":
        return 200, {"ok": True, "time": _now()}
    if p == "/api/categories" and m == "GET":
        return 200, CATEGORIES
    if p == "/api/statuses" and m == "GET":
        return 200, STATUSES
    if p == "/api/areas" and m == "GET":
        return 200, AREAS
    if p == "/api/stats" and m == "GET":
        return 200, reports.stats()

    # --- resident session --------------------------------------------------
    if p == "/api/residents/login" and m == "POST":
        body = req.json
        session, err = residents_mod.register_or_login(
            body.get("phone"), body.get("name"), body.get("area"))
        if err:
            return 400, {"error": err}
        return 200, session
    if p == "/api/residents/logout" and m == "POST":
        require_resident(req)
        auth.logout(req.token)
        return 200, {"ok": True}
    if p == "/api/residents/me" and m == "GET":
        return 200, {"user": require_resident(req)}
    if p == "/api/residents/notifications" and m == "GET":
        u = require_resident(req)
        return 200, residents_mod.notifications_for(u["id"])
    mn = re.match(r"^/api/residents/notifications/(\d+)/confirm$", p)
    if mn and m == "POST":
        u = require_resident(req)
        if not residents_mod.confirm_notification(u["id"], int(mn.group(1))):
            return 404, {"error": "Notification not found"}
        return 200, {"ok": True}

    # --- reports (public read) --------------------------------------------
    if p == "/api/reports" and m == "GET":
        return 200, reports.list(category=req.q("category"), area=req.q("area"),
                                 status=req.q("status"))
    mr = re.match(r"^/api/reports/([^/]+)$", p)
    if mr and m == "GET":
        # include the caller's own rating if they are a logged-in resident
        resident = auth.resident_from_token(req.token)
        r = reports.get_by_id(mr.group(1), resident["id"] if resident else None)
        if not r:
            return 404, {"error": "No report found with that ID"}
        return 200, r

    # --- rating (residents only) ------------------------------------------
    mrate = re.match(r"^/api/reports/([^/]+)/rate$", p)
    if mrate and m == "POST":
        u = require_resident(req)
        stars, errors = validate_stars(req.json.get("stars"))
        if errors:
            return 400, {"errors": errors}
        summary = ratings.rate(mrate.group(1), u["id"], stars)
        if summary is None:
            return 404, {"error": "No report found with that ID"}
        return 200, {"rating": summary}

    # Residents attempting to post are explicitly rejected here.
    if p == "/api/reports" and m == "POST":
        return 403, {"error": "Residents cannot post reports. Only area rulers may post."}

    return 404, {"error": "Not found"}


def _scope_area(user):
    """Area a ruler is limited to, or None for super-admins."""
    return user["area"] if user["role"] == "ruler" else None


# ---------------------------------------------------------------------------
# Ruler / management API (/api/ruler/...) — the only way to POST reports.
# ---------------------------------------------------------------------------
def ruler_routes(req):
    p, m = req.path, req.method

    if p == "/api/ruler/login" and m == "POST":
        body = req.json
        if not body.get("username") or not body.get("password"):
            return 400, {"error": "username and password are required"}
        session = auth.ruler_login(str(body["username"]), str(body["password"]))
        if not session:
            return 401, {"error": "Invalid username or password"}
        return 200, session
    if p == "/api/ruler/logout" and m == "POST":
        require_ruler(req)
        auth.logout(req.token)
        return 200, {"ok": True}
    if p == "/api/ruler/me" and m == "GET":
        return 200, {"user": require_ruler(req)}

    # --- post a report (RULERS ONLY) + fan out AI SMS ---------------------
    if p == "/api/ruler/reports" and m == "POST":
        user = require_ruler(req)
        value, errors = validate_report(req.json)
        if errors:
            return 400, {"errors": errors}
        area_scope = _scope_area(user)
        if area_scope and value["area"] != area_scope:
            return 403, {"error": "Forbidden: you can only post in your own area"}
        if req.json.get("photo"):
            # base64 data URL support is optional; ignored offline for simplicity
            value["photo"] = None
        created = reports.create(value, {"id": user["id"], "name": user["name"]})
        sent = sms.notify_new_report(created)
        created["smsSent"] = sent
        return 201, created

    if p == "/api/ruler/reports" and m == "GET":
        user = require_ruler(req)
        return 200, reports.list(category=req.q("category"),
                                 area=_scope_area(user) or req.q("area"),
                                 status=req.q("status"))

    mr = re.match(r"^/api/ruler/reports/([^/]+)$", p)
    if mr and m == "GET":
        user = require_ruler(req)
        r = reports.get_by_id(mr.group(1))
        if not r:
            return 404, {"error": "No report found with that ID"}
        area_scope = _scope_area(user)
        if area_scope and r["area"] != area_scope:
            return 403, {"error": "Forbidden: report outside your area"}
        return 200, r
    if mr and m == "DELETE":
        user = require_ruler(req)
        r = reports.get_by_id(mr.group(1))
        if not r:
            return 404, {"error": "No report found with that ID"}
        area_scope = _scope_area(user)
        if area_scope and r["area"] != area_scope:
            return 403, {"error": "Forbidden: report outside your area"}
        reports.remove(mr.group(1))
        return 200, {"ok": True}

    ms = re.match(r"^/api/ruler/reports/([^/]+)/status$", p)
    if ms and m == "PATCH":
        user = require_ruler(req)
        r = reports.get_by_id(ms.group(1))
        if not r:
            return 404, {"error": "No report found with that ID"}
        area_scope = _scope_area(user)
        if area_scope and r["area"] != area_scope:
            return 403, {"error": "Forbidden: report outside your area"}
        value, errors = validate_status(req.json.get("status"))
        if errors:
            return 400, {"errors": errors}
        note = req.json.get("note") or f"Status updated by {user['name']}"
        return 200, reports.set_status(ms.group(1), value, note)

    if p == "/api/ruler/stats" and m == "GET":
        require_ruler(req)
        return 200, reports.stats_breakdown()

    # --- ruler account management (super-admin only) -----------------------
    if p == "/api/ruler/rulers" and m == "GET":
        user = require_ruler(req)
        require_admin(user)
        return 200, auth.list_rulers()
    if p == "/api/ruler/rulers" and m == "POST":
        user = require_ruler(req)
        require_admin(user)
        body = req.json
        if not body.get("username") or not body.get("password") or not body.get("name"):
            return 400, {"error": "username, password and name are required"}
        role = "admin" if body.get("role") == "admin" else "ruler"
        area = body.get("area")
        from constants import is_valid_area
        if role == "ruler" and not is_valid_area(area):
            return 400, {"error": "a ruler requires a valid area id"}
        if auth.find_ruler(str(body["username"])):
            return 409, {"error": "That username is already taken"}
        acc = auth.create_ruler(str(body["username"]), str(body["password"]),
                                str(body["name"]), role, area if role == "ruler" else None)
        return 201, acc

    return 404, {"error": "Not found"}


# ---------------------------------------------------------------------------
# HTTP handler + static frontend serving
# ---------------------------------------------------------------------------
def _safe_join(base, rel):
    rel = rel.lstrip("/")
    target = os.path.normpath(os.path.join(base, rel))
    if not target.startswith(os.path.abspath(base)):
        return None
    return target


class Handler(BaseHTTPRequestHandler):
    server_version = "MtaafixPy/2.0"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass

    def _cors(self):
        origin = os.environ.get("CORS_ORIGIN", "*")
        self.send_header("Access-Control-Allow-Origin", "*" if origin == "*" else origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers",
                         "Content-Type, Authorization, X-Auth-Token")

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        return self.rfile.read(length) if length else b""

    def _build_req(self, method):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        body = self._read_body() if method in ("POST", "PATCH", "PUT", "DELETE") else b""
        return Req(self, method, parsed.path, query, body, self.headers)

    def _dispatch(self, method):
        req = self._build_req(method)
        path = req.path
        try:
            if path.startswith("/api/ruler"):
                return self._send_json(*ruler_routes(req))
            if path.startswith("/api"):
                return self._send_json(*api_routes(req))
            if method in ("GET", "HEAD"):
                return self._serve_static(path)
            return self._send_json(404, {"error": "Not found"})
        except ApiError as e:
            return self._send_json(e.status, e.payload)
        except Exception as e:  # pragma: no cover
            return self._send_json(500, {"error": "Internal server error", "detail": str(e)})

    def _serve_static(self, path):
        if not os.path.isdir(FRONTEND_DIR):
            return self._send_json(404, {"error": "Not found"})
        rel = "index.html" if path in ("/", "") else path
        target = _safe_join(FRONTEND_DIR, rel)
        if target and os.path.isdir(target):
            target = os.path.join(target, "index.html")
        if not target or not os.path.isfile(target):
            return self._send_json(404, {"error": "Not found"})
        ctype = mimetypes.guess_type(target)[0] or "application/octet-stream"
        with open(target, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        self._dispatch("GET")

    def do_HEAD(self):
        self._dispatch("HEAD")

    def do_POST(self):
        self._dispatch("POST")

    def do_PATCH(self):
        self._dispatch("PATCH")

    def do_DELETE(self):
        self._dispatch("DELETE")


def create_server(port=PORT, host="127.0.0.1"):
    db.init()
    seed.ensure_seed()
    return ThreadingHTTPServer((host, port), Handler)


def main():
    httpd = create_server()
    host, port = httpd.server_address
    print(f"Mtaafix API running at http://{host}:{port}")
    print(f"  Resident app: http://{host}:{port}/")
    print(f"  Ruler console: http://{host}:{port}/ruler.html")
    print(f"  Health check:  http://{host}:{port}/api/health")
    print(f"  SMS provider:  {os.environ.get('SMS_PROVIDER', 'mock')} "
          f"(AI: {'remote' if os.environ.get('SMS_AI_ENDPOINT') else 'local composer'})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


if __name__ == "__main__":
    main()