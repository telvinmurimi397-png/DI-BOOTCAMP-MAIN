# JWT Authentication with Express

A small TypeScript and Express learning project covering registration, login, protected routes, HTTP-only cookies, and rotating JWT refresh tokens.

## JWT and authentication flow

A JWT has three base64url-encoded parts: a header describing the token/signing algorithm, a payload containing claims, and a signature used to detect tampering. JWT payloads are signed, not encrypted, so do not put passwords or other secrets in them.

This app issues short-lived access tokens (15 minutes) and longer-lived refresh tokens (7 days), signed with separate secrets. The access token authenticates protected requests. The refresh token is checked against a server-side session entry, revoked during rotation, and replaced with a new token pair. Passwords are hashed with bcryptjs before storage. The database in this exercise is an in-memory map, not persistent storage.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set two different, random secrets of at least 32 characters in `.env`. For example, generate each with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
4. Start the development server with `npm run dev`.

The API listens on `http://localhost:3000` by default. Build with `npm run build`, then start the compiled server with `npm start`.

## API routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create an account and set authentication cookies |
| POST | `/api/auth/login` | Verify credentials and set authentication cookies |
| POST | `/api/auth/refresh` | Rotate refresh token and issue a new access token |
| POST | `/api/auth/logout` | Revoke the refresh token and clear cookies |
| GET | `/api/auth/me` | Example route protected by the access token |
| PATCH | `/api/auth/profile` | Update the authenticated user's display name |

Registration and login accept JSON. For example:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "ExamplePassword123"
}
```

Passwords must be 12–128 characters and include lowercase, uppercase, and numeric characters. Login and registration are rate-limited. Access and refresh tokens are stored in HTTP-only, same-site cookies; cookies use the `Secure` flag when `NODE_ENV=production`.

## Learning-project limitations

Users and refresh-token revocations are kept in memory, so they reset when the server restarts and do not work across multiple server instances. Use a database and shared session/revocation storage in a production design. This cookie-based example also assumes a same-site frontend; deployments with cross-site frontends need an explicit CSRF strategy and carefully configured cookie/CORS policies. Never reuse development secrets in production.
