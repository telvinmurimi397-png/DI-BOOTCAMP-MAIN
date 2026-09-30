# MtaaClean

MtaaClean is a community operations and CSR platform focused on illegal dumping and blocked drainage in Githogoro. Residents report issues and join cleanups; staff verify reports and record outcomes; sponsors fund projects and see their measured impact.

## Run locally

```sh
npm install
npm run seed
npm start
```

Open `http://localhost:3003`. Choose another `PORT` if 3003 is already in use. Demo data is stored in `database/db.json`; uploaded report photos are stored in `uploads/`.

`npm run seed` resets the local JSON database to the demo fixtures. Do not run it over data you want to keep.

## Demo accounts

- Resident: `resident@mtaaclean.test` / `Resident2026!`
- Admin: `admin@mtaaclean.test` / `CleanWater2026!`
- Collector: `collector@mtaaclean.test` / `CleanWater2026!`
- Sponsor: `sponsor@mtaaclean.test` / `Impact2026!`

New registrations are assigned the resident role. Demo role accounts are created by the seed script.

## Main API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/me`
- `GET /api/reports`, `POST /api/reports`, `GET /api/reports/:id`, `PATCH /api/reports/:id/status`
- `GET /api/cleanups`, `POST /api/cleanups`, `POST /api/cleanups/:id/join`, `PATCH /api/cleanups/:id/impact`
- `GET /api/csr/projects`, `POST /api/csr/projects`, `POST /api/csr/projects/:id/sponsor`, `PATCH /api/csr/projects/:id/impact`
- `GET /api/csr/sponsorships`, `GET /api/dashboard`, `GET /api/health`

Protected routes use `Authorization: Bearer <token>`. Report photos are optional images up to 5 MB.

## Storage note

This is a learning/demo project: records are persisted to one JSON file, passwords are bcrypt-hashed, and access tokens are signed with a local development secret. Set `JWT_SECRET` before exposing the app outside a trusted local environment. Use MongoDB, managed object storage, and a dedicated secret manager for a production deployment.