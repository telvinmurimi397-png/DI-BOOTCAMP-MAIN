import hashlib
import os
import tempfile
import unittest

import auth
import db
import server


class FakeRequest:
    def __init__(self, path, method, payload=None, token=None, query=None):
        self.path = path
        self.method = method
        self.json = payload or {}
        self.token = token
        self.query = query or {}

    def q(self, name, default=None):
        values = self.query.get(name)
        return values[0] if values else default


class RulerLoginApprovalTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        db.init(os.path.join(self.temp_dir.name, "test.sqlite"))
        self.admin = auth.create_ruler("admin", "admin-pass", "Administrator", role="admin")
        self.ruler = auth.create_ruler("kasarani-ruler", "ruler-pass", "Kasarani Ruler", area="kasarani")
        self.admin_token, _ = auth._open_session("ruler", self.admin["id"])

    def tearDown(self):
        if db._conn:
            db._conn.close()
            db._conn = None
        self.temp_dir.cleanup()

    def request_login(self):
        return server.ruler_routes(FakeRequest(
            "/api/ruler/login",
            "POST",
            {"username": "kasarani-ruler", "password": "ruler-pass"},
        ))

    def test_area_ruler_gets_no_session_before_admin_approval(self):
        status, result = self.request_login()

        self.assertEqual(status, 202)
        self.assertTrue(result["approval_required"])
        self.assertNotIn("token", result)
        self.assertEqual(
            auth.ruler_login_request_status(result["request_id"])["status"],
            "pending",
        )

    def test_only_admin_can_approve_and_approval_issues_one_session(self):
        _, pending = self.request_login()
        request_id = db.get(
            "SELECT id FROM ruler_login_requests"
        )["id"]

        with self.assertRaises(server.ApiError) as error:
            server.ruler_routes(FakeRequest(
                "/api/ruler/login-requests/" + str(request_id),
                "PATCH",
                {"decision": "approved"},
                token=auth._open_session("ruler", self.ruler["id"])[0],
            ))
        self.assertEqual(error.exception.status, 403)

        status, requests = server.ruler_routes(FakeRequest(
            "/api/ruler/login-requests",
            "GET",
            token=self.admin_token,
        ))
        self.assertEqual(status, 200)
        self.assertEqual(requests[0]["username"], "kasarani-ruler")

        status, decision = server.ruler_routes(FakeRequest(
            "/api/ruler/login-requests/" + str(request_id),
            "PATCH",
            {"decision": "approved"},
            token=self.admin_token,
        ))
        self.assertEqual(status, 200)
        self.assertEqual(decision["status"], "approved")

        approved = auth.ruler_login_request_status(pending["request_id"])
        self.assertEqual(approved["status"], "approved")
        ruler_session = auth.ruler_from_token(approved["token"])
        self.assertEqual(ruler_session["username"], "kasarani-ruler")

        second_poll = auth.ruler_login_request_status(pending["request_id"])
        self.assertEqual(second_poll["status"], "consumed")
        self.assertNotIn("token", second_poll)

    def test_admin_login_is_immediate_and_denial_is_terminal(self):
        admin_session = auth.ruler_login("admin", "admin-pass")
        self.assertIn("token", admin_session)
        self.assertNotIn("approval_required", admin_session)

        _, pending = self.request_login()
        request_id = db.get("SELECT id FROM ruler_login_requests")["id"]
        server.ruler_routes(FakeRequest(
            "/api/ruler/login-requests/" + str(request_id),
            "PATCH",
            {"decision": "denied"},
            token=self.admin_token,
        ))
        denied = auth.ruler_login_request_status(pending["request_id"])
        self.assertEqual(denied["status"], "denied")

    def test_expired_request_never_creates_a_session(self):
        _, pending = self.request_login()
        request_hash = hashlib.sha256(pending["request_id"].encode()).hexdigest()
        db.run(
            "UPDATE ruler_login_requests SET expires = ? WHERE request_hash = ?",
            ("2000-01-01T00:00:00+00:00", request_hash),
        )

        result = auth.ruler_login_request_status(pending["request_id"])

        self.assertEqual(result["status"], "expired")
        self.assertNotIn("token", result)


if __name__ == "__main__":
    unittest.main()