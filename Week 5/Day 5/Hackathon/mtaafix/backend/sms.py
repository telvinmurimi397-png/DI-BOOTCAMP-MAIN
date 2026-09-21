"""SMS gateway abstraction + notification fan-out.

Offline default is a console/mock gateway that records every message in the
``sms_outbox`` table (and prints it) so the project runs with no credentials.
To go live, set SMS_PROVIDER=twilio (or africastalking) and wire real creds in
``_send_via_provider`` — the calling code does not change.
"""

import os
from datetime import datetime, timezone

import db
import ai_sms
import residents as residents_mod


def _now():
    return datetime.now(timezone.utc).isoformat()


def _send_via_provider(phone, body):
    """Return (status, ok). Only the mock provider is active offline."""
    provider = os.environ.get("SMS_PROVIDER", "mock").lower()
    if provider == "mock":
        print(f"  [SMS->{phone}] {body}")
        return "sent", True
    # Placeholder for real integrations (Twilio / Africa's Talking). Wire the
    # SDK/HTTP call here using env-configured credentials, then return status.
    print(f"  [SMS provider '{provider}' not configured; message NOT delivered] -> {phone}")
    return "failed", False


def notify_new_report(report):
    """Compose an AI SMS per subscribed resident and 'send' it. Returns count."""
    recipients = residents_mod.list_residents(area=report["area"])
    sent = 0
    for r in recipients:
        body = ai_sms.compose(report, r)
        status, ok = _send_via_provider(r["phone"], body)
        db.run(
            """INSERT INTO sms_outbox (report_id, resident_id, phone, body, ai_generated, status, confirmed, created)
               VALUES (?, ?, ?, ?, 1, ?, 0, ?)""",
            (report["id"], r["id"], r["phone"], body, status, _now()))
        if ok:
            sent += 1
    return sent