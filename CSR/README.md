# GreenFuture

GreenFuture is a starter platform for connecting companies, environmental organizations, and volunteers around environmental projects. This version includes user registration and login, JWT authentication, role-specific dashboard entry pages, and the initial PostgreSQL schema.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer

## Windows setup (PowerShell)

Run these commands from the `CSR` project root, which contains `database` and `backend`:

```powershell
createdb greenfuture_db
psql -d greenfuture_db -f .\database\schema.sql
Copy-Item .\backend\.env.example .\backend\.env
```

Edit `backend/.env` with your PostgreSQL username and password, and replace `JWT_SECRET` with a long random value. Then install and start the server:

```powershell
Set-Location .\backend
npm.cmd install
npm.cmd start
```

Open <http://localhost:5000>. In Windows PowerShell 5.1, run commands on separate lines; `&&` is not supported there. If `createdb` or `psql` is not recognized, install PostgreSQL and add its `bin` folder (for example, `C:\Program Files\PostgreSQL\16\bin`) to `PATH`, or run those executables by their full paths. `createdb` creates the database; `schema.sql` creates tables inside that database.

If the PostgreSQL role has no password, set `DB_PASSWORD=` in `.env`. Never commit `.env` or share its secrets.

## Admin account

Create an account through the registration page, then promote it using a trusted PostgreSQL session:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Admin is intentionally unavailable in public registration.

## Current scope

The public frontend is a single scrollable page with Home, Explore Projects, Our Impact, About Us, News & Updates, and Contact sections, accessible through the responsive navigation menu. Project browsing and its search and filters run on static sample listings; the displayed project and impact figures are illustrative, not verified platform results. The contact form is a frontend preview and does not send or store submissions.

Authentication and role-specific dashboard entry pages are implemented. The projects and volunteer-registration tables are ready for the next feature slice; project creation, moderation, and volunteer sign-up APIs are not implemented yet.