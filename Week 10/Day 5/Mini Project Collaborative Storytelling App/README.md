# Collaborative Storytelling App

A TypeScript monorepo for shared story writing. The React client uses Redux Toolkit; the Express API uses PostgreSQL, bcrypt, short-lived JWT access tokens, and an HTTP-only refresh cookie. Socket.IO powers authenticated live story edits, collaborator presence, and cursor positions.

## Requirements

- Node.js 20+
- PostgreSQL

## Local setup

1. Create a PostgreSQL database, such as `storytelling`.
2. Copy `backend/.env.example` to `backend/.env`, update `DATABASE_URL`, and generate separate random `JWT_SECRET` and `REFRESH_SECRET` values.
3. In separate terminals, run `npm install` from the project root, `backend`, and `frontend`.
4. Initialize tables with `npm run db:init --prefix backend`.
5. Start the API and client with `npm run dev` from the project root.

The API listens on port 3001; the Vite app listens on port 5173. Set `VITE_API_URL` in `frontend/.env.local` to override the API URL.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- `GET/POST /api/stories`, `GET/PATCH/DELETE /api/stories/:id`
- `GET /api/stories/:id/versions`, `POST /api/stories/:id/versions/:versionId/restore`
- `PATCH /api/stories/:id/comments/settings`
- `POST/DELETE /api/stories/:id/share`; public reads use `GET /api/public/stories/:token`
- `POST /api/stories/:id/contributors`, `GET /api/stories/:id/contributors`
- `POST/GET/DELETE /api/contributors` (story-scoped listing uses `GET /api/contributors/:storyId`)
- `GET/POST /api/stories/:id/comments`; comment owners can `PATCH`/`DELETE`, and signed-in users can toggle a like reaction.
- `GET/PATCH /api/users/me`, `GET /api/users/:userId` for profile details and authored stories.
- `GET /api/users?email=...` looks up a collaborator account by its exact email.

All story and contributor endpoints require a bearer access token. The refresh route uses the HTTP-only cookie; the frontend retries a failed authenticated request once after refreshing.

Story edit sockets authenticate with the access token sent in the Socket.IO handshake. Only the story author and contributors can join/edit; cursors and presence are shared only in that story's room. Comments can be disabled by the story author. Version snapshots are retained in PostgreSQL and can be restored by story collaborators. Share tokens are random, revocable links; anyone with an active link can read that story.

Profile avatars currently accept secure image URLs. Cloudinary file uploads are disabled until Cloudinary credentials are configured; do not put credentials in frontend code.

## Scripts

- `npm run dev` — start frontend and API together.
- `npm run build` — type-check and build both applications.
- `npm run db:init --prefix backend` — create the PostgreSQL tables.
- `npm test --prefix frontend` — run Vitest and Testing Library tests.
- `npm run storybook --prefix frontend` — preview components in Storybook.
- `npm run build-storybook --prefix frontend` — build the component catalog.

Access tokens stay in Redux memory; the refresh token is an HTTP-only cookie. For production, serve over HTTPS, set `FRONTEND_ORIGIN`, and configure `DATABASE_URL`, `JWT_SECRET`, and `REFRESH_SECRET` in the hosting provider. The API uses parameterized SQL and checks story ownership/contributor access.

## Render deployment

Deploy the backend as a Web Service from `backend` with build command `npm install && npm run build` and start command `npm start`. Add the PostgreSQL connection URL, two distinct random secrets (at least 32 characters each), and the deployed frontend origin as environment variables. Run the database initializer once against the production database.

Deploy `frontend` as a Static Site with build command `npm install && npm run build` and publish directory `dist`. Set `VITE_API_URL` to the deployed backend API URL (ending in `/api`) before building.

The backend migration is safe to rerun and adds the profile, comments, share-link, and story-version fields/tables. Run `npm run db:init --prefix backend` once after deploying schema changes. Render supports WebSockets for Socket.IO; keep the frontend origin and API URL pointed at the deployed services.
