"""AI-powered SMS composition.

When an area ruler posts a report, we compose a short, natural SMS for each
subscribed resident asking them to confirm they've seen it.

Design: pluggable AI backend.
  * If SMS_AI_ENDPOINT + SMS_AI_API_KEY are set, we call an OpenAI-compatible
    chat-completions endpoint to draft the message.
  * Otherwise we fall back to a built-in local composer that produces varied,
    human-sounding text with zero network calls (so the project always runs).

Either way the result is flagged ``ai_generated=True`` and stored in sms_outbox.
"""

import json
import os
import random
import urllib.request

from constants import area_name

_CATEGORY_WORDS = {
    "roads": "a road/pothole issue", "water": "a water issue",
    "power": "a power/electricity issue", "garbage": "a garbage collection issue",
    "lights": "a streetlight issue", "drainage": "a drainage/flooding issue",
    "security": "a security issue", "other": "a community issue",
}

_OPENERS = [
    "Hi {name}, your area ruler just posted an update.",
    "Hello {name}, a new community report is live in {area}.",
    "{name}, heads up — a new report was posted for {area}.",
    "Hi {name}, there's a fresh update from your area ruler.",
]
_CLOSERS = [
    "Reply CONFIRM or tap confirm in the app to acknowledge.",
    "Please open Mtaafix to confirm you've seen it.",
    "Confirm receipt in the Mtaafix app. Thank you.",
    "Log in to Mtaafix to confirm and rate it.",
]


def _local_compose(report, resident):
    """Offline composer — deterministic-ish natural language, lightly randomized."""
    name = (resident.get("name") or "neighbour").split(" ")[0]
    area = area_name(report["area"])
    thing = _CATEGORY_WORDS.get(report["cat"], "a community issue")
    opener = random.choice(_OPENERS).format(name=name, area=area)
    closer = random.choice(_CLOSERS)
    snippet = report["desc"].strip()
    if len(snippet) > 90:
        snippet = snippet[:87].rstrip() + "..."
    body = f"{opener} It concerns {thing} near {report['ward']}: \"{snippet}\" (Ref {report['id']}). {closer}"
    return body


def _remote_compose(report, resident, endpoint, api_key):
    name = resident.get("name") or "resident"
    prompt = (
        "Write a concise, friendly SMS (max 320 chars) to a resident named "
        f"{name} in {area_name(report['area'])}. Their area ruler posted a civic "
        f"report: category={report['cat']}, ward={report['ward']}, "
        f"reference={report['id']}, details=\"{report['desc']}\". Ask them to "
        "confirm they've seen it in the Mtaafix app. No markdown, plain text only."
    )
    payload = {
        "model": os.environ.get("SMS_AI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": "You draft short civic notification SMS messages."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }
    req = urllib.request.Request(
        endpoint, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    return data["choices"][0]["message"]["content"].strip()


def compose(report, resident):
    """Return the SMS body for one resident about one report."""
    endpoint = os.environ.get("SMS_AI_ENDPOINT")
    api_key = os.environ.get("SMS_AI_API_KEY")
    if endpoint and api_key:
        try:
            return _remote_compose(report, resident, endpoint, api_key)
        except Exception as e:  # network/API problems -> graceful fallback
            print(f"  [ai_sms] remote compose failed ({e}); using local composer")
    return _local_compose(report, resident)