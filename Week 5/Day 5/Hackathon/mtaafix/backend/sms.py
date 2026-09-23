"""SMS gateway abstraction + notification fan-out.

Offline default is a console/mock gateway that records every message in the
``sms_outbox`` table (and prints it) so the project runs with no credentials.
To go live, set SMS_PROVIDER=twilio (or africastalking) and wire real creds in
``_send_via_provider`` — the calling code does not change.
"""

import os
import base64
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import db
import ai_sms
import residents as residents_mod


def _now():
    return datetime.now(timezone.utc).isoformat()


def _send_via_provider(phone, body):
    """Send one SMS through the configured provider and return (status, ok)."""
    provider = os.environ.get("SMS_PROVIDER", "mock").lower()
    if provider == "mock":
        print(f"  [SMS->{phone}] {body}")
        return "sent", True
    try:
        if provider == "twilio":
            return _send_twilio(phone, body)
        if provider in ("africastalking", "africa_talking"):
            return _send_africas_talking(phone, body)
        print(f"  [SMS provider '{provider}' is not supported; message NOT delivered] -> {phone}")
    except (KeyError, urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
        print(f"  [SMS provider '{provider}' failed; message NOT delivered] -> {phone}: {error}")
    return "failed", False


def _post_form(url, values, headers=None):
    request = urllib.request.Request(
        url,
        data=urllib.parse.urlencode(values).encode("utf-8"),
        headers=headers or {},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.read().decode("utf-8")


def _send_twilio(phone, body):
    account_sid = os.environ["SMS_TWILIO_ACCOUNT_SID"]
    auth_token = os.environ["SMS_TWILIO_AUTH_TOKEN"]
    sender = os.environ["SMS_TWILIO_FROM"]
    credentials = base64.b64encode(f"{account_sid}:{auth_token}".encode()).decode()
    _post_form(
        f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
        {"To": phone, "From": sender, "Body": body},
        {"Authorization": f"Basic {credentials}"},
    )
    return "sent", True


def _send_africas_talking(phone, body):
    username = os.environ["SMS_AT_USERNAME"]
    api_key = os.environ["SMS_AT_API_KEY"]
    sender = os.environ.get("SMS_SENDER_ID", "")
    values = {"username": username, "to": phone, "message": body}
    if sender:
        values["from"] = sender
    _post_form(
        "https://api.africastalking.com/version1/messaging",
        values,
        {"apiKey": api_key, "Accept": "application/json"},
    )
    return "sent", True


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


def notify_resident_login(resident):
    """Send and record a sign-in confirmation for the resident."""
    name = (resident.get("name") or "Resident").split()[0]
    body = f"Hi {name}, you have signed in to MtaaFix. Your residents dashboard is ready."
    status, ok = _send_via_provider(resident["phone"], body)
    db.run(
        """INSERT INTO sms_outbox (report_id, resident_id, phone, body, ai_generated, status, confirmed, created)
           VALUES (NULL, ?, ?, ?, 0, ?, 1, ?)""",
        (resident["id"], resident["phone"], body, status, _now()))
    return ok