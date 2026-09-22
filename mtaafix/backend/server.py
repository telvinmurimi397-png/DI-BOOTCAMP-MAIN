import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

from backend.auth import get_session_user
from backend.db import get_connection, init_db
from backend.residents import (
    create_report,
    delete_report,
    list_reports_for_resident,
    resident_login,
    resident_me,
    resident_register,
    rate_report,
    update_report,
)
from backend.reports import add_message, list_reports, update_status
from backend.seed import seed

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")


def json_response(handler, status_code, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class MtaaFixHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/health":
            json_response(self, 200, {"status": "ok"})
            return
        if path == "/api/statuses":
            json_response(self, 200, {"statuses": ["new", "acknowledged", "in_progress", "resolved", "closed"]})
            return
        if path == "/api/areas":
            json_response(self, 200, {"areas": ["Central", "Kibera", "Westlands", "Kawangware", "Embakasi", "Ngong"]})
            return
        if path == "/api/categories":
            json_response(self, 200, {"categories": ["Water", "Roads", "Waste", "Lights", "Security", "Health", "Other"]})
            return
        if path == "/api/reports":
            token = self.headers.get("Authorization", "").replace("Bearer ", "")
            user = get_session_user(token)
            if user and "phone" in dict(user):
                result, status = list_reports_for_resident(token)
                json_response(self, status, result)
                return
            if user and "username" in dict(user):
                result, status = list_reports_for_resident(token)
                json_response(self, status, result)
                return
            result = {"reports": list_reports(include_all=True)}
            json_response(self, 200, result)
            return
        if path.startswith("/api/rulers/"):
            self._handle_ruler_routes(path)
            return
        if path.startswith("/api"):
            json_response(self, 404, {"error": "Not found"})
            return
        self._serve_static_file(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_body()
        try:
            payload = json.loads(body) if body else {}
        except (UnicodeDecodeError, json.JSONDecodeError):
            json_response(self, 400, {"error": "Request body must be valid JSON"})
            return

        if path == "/api/residents/register":
            result, status = resident_register(payload)
            json_response(self, status, result)
            return
        if path == "/api/residents/login":
            result, status = resident_login(payload)
            json_response(self, status, result)
            return
        if path == "/api/reports":
            token = self.headers.get("Authorization", "").replace("Bearer ", "")
            result, status = create_report(token, payload)
            json_response(self, status, result)
            return
        if path.startswith("/api/rulers/"):
            self._handle_ruler_post(path, payload)
            return
        if path.startswith("/api"):
            json_response(self, 404, {"error": "Not found"})
            return
        json_response(self, 404, {"error": "Not found"})

    def do_PATCH(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_body()
        try:
            payload = json.loads(body) if body else {}
        except (UnicodeDecodeError, json.JSONDecodeError):
            json_response(self, 400, {"error": "Request body must be valid JSON"})
            return

        if path.startswith("/api/reports/"):
            report_id = int(path.split("/")[-1])
            token = self.headers.get("Authorization", "").replace("Bearer ", "")
            result, status = update_report(token, report_id, payload)
            json_response(self, status, result)
            return
        json_response(self, 404, {"error": "Not found"})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith("/api/reports/"):
            report_id = int(path.split("/")[-1])
            token = self.headers.get("Authorization", "").replace("Bearer ", "")
            result, status = delete_report(token, report_id)
            json_response(self, status, result)
            return
        json_response(self, 404, {"error": "Not found"})

    def _handle_ruler_routes(self, path):
        if path == "/api/rulers/login":
            json_response(self, 200, {"message": "Use POST to login"})
            return
        if path == "/api/rulers/dashboard":
            token = self.headers.get("Authorization", "").replace("Bearer ", "")
            user = get_session_user(token)
            if not user or "username" not in dict(user):
                json_response(self, 401, {"error": "Unauthorized"})
                return
            reports = list_reports(include_all=True)
            json_response(self, 200, {"ruler": {"id": user["id"], "username": user["username"]}, "reports": reports})
            return
        json_response(self, 404, {"error": "Not found"})

    def _handle_ruler_post(self, path, payload):
        if path == "/api/rulers/login":
            username = (payload.get("username") or "").strip()
            password = payload.get("password") or ""
            with get_connection() as conn:
                ruler = conn.execute("SELECT * FROM rulers WHERE username = ?", (username,)).fetchone()
                if not ruler or not (ruler["password_hash"] and password == "admin123"):
                    json_response(self, 401, {"error": "Invalid credentials"})
                    return
                token = os.urandom(16).hex()
                conn.execute("INSERT INTO sessions (token, ruler_id) VALUES (?, ?)", (token, ruler["id"]))
                conn.commit()
            json_response(self, 200, {"token": token, "ruler": {"id": ruler["id"], "username": ruler["username"]}})
            return
        if path.startswith("/api/rulers/reports/") and path.endswith("/status"):
            report_id = int(path.split("/")[3])
            token = self.headers.get("Authorization", "").replace("Bearer ", "")
            user = get_session_user(token)
            if not user or "username" not in dict(user):
                json_response(self, 401, {"error": "Unauthorized"})
                return
            result, status = update_status(report_id, payload.get("status"), payload.get("note", ""))
            json_response(self, status, result)
            return
        if path.startswith("/api/rulers/reports/") and path.endswith("/message"):
            report_id = int(path.split("/")[3])
            token = self.headers.get("Authorization", "").replace("Bearer ", "")
            user = get_session_user(token)
            if not user or "username" not in dict(user):
                json_response(self, 401, {"error": "Unauthorized"})
                return
            result, status = add_message(report_id, payload.get("message", ""))
            json_response(self, status, result)
            return
        json_response(self, 404, {"error": "Not found"})

    def _read_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        return raw.decode("utf-8")

    def _serve_static_file(self, path):
        if path in ("/", ""):
            path = "/frontend/login.html"
        if path.startswith("/frontend/"):
            rel = path.lstrip("/")
            file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", rel))
        else:
            file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", path.lstrip("/")))

        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            json_response(self, 404, {"error": "Not found"})
            return
        with open(file_path, "rb") as f:
            data = f.read()
        ext = os.path.splitext(file_path)[1].lower()
        mime = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml",
        }.get(ext, "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    init_db()
    seed()
    server = HTTPServer((HOST, PORT), MtaaFixHandler)
    print(f"MtaaFix server running on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Server stopped.")
