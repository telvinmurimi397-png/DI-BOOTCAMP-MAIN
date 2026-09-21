import json
import os
import urllib.request
from typing import Optional


def compose_message(report: dict, status: str, note: str = "") -> str:
    status_text = status.replace("_", " ").title()
    text = f"Update on #{report.get('id', '?')}: {report.get('title', 'Issue')} is now {status_text}."
    if note:
        text += f" Note: {note}"
    return text


def maybe_call_ai(report: dict, status: str, note: str = "") -> str:
    url = os.getenv("AI_API_URL")
    api_key = os.getenv("AI_API_KEY")
    if not url or not api_key:
        return compose_message(report, status, note)

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a concise municipal update assistant."},
            {"role": "user", "content": f"Write a brief SMS update for a resident about issue #{report.get('id')} with status {status}. Note: {note or 'No extra note.'}"},
        ],
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            choices = body.get("choices") or []
            if choices:
                message = choices[0].get("message", {}).get("content")
                if isinstance(message, str) and message.strip():
                    return message.strip()
    except Exception:
        pass

    return compose_message(report, status, note)
