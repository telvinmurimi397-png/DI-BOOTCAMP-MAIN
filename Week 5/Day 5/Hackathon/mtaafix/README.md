# MtaaFix

MtaaFix is a small neighborhood issue-reporting platform for residents and local rulers.

## Roles

- Resident: register with phone number, submit issue reports, view updates, rate outcomes.
- Ruler: review reports, assign status, reply with official updates, trigger SMS/AI assisted messaging.

## API overview

Base URL: http://localhost:8000

### Resident endpoints
- POST /api/residents/register
- POST /api/residents/login
- GET /api/residents/me
- GET /api/reports
- POST /api/reports
- PATCH /api/reports/:id
- DELETE /api/reports/:id
- POST /api/reports/:id/rate

### Ruler endpoints
- POST /api/rulers/login
- GET /api/rulers/dashboard
- POST /api/rulers/reports/:id/status
- POST /api/rulers/reports/:id/message

### System endpoints
- GET /health
- GET /api/statuses
- GET /api/areas
- GET /api/categories

## Run locally

```bash
cd mtaafix
cp .env.example .env
python backend/server.py
```

The server serves the frontend from `frontend/` and uses SQLite in `data/mtaafix.db`.

## Tests

```bash
cd mtaafix/backend
python -m unittest test_smoke.py
```

## Demo credentials

- Ruler admin:
  - username: admin
  - password: admin123
- Resident demo:
  - phone: +254700000001

## Security notes

- Passwords are hashed with scrypt.
- Session tokens are random 32-byte values stored server-side.
- No hardcoded secrets are required for local demo mode.
- Live SMS and AI providers are optional; the default configuration uses a mock provider.
