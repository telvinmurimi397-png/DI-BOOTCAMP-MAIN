# LinguaQuest

A responsive language-learning game prototype. It includes account registration and login, language and level selection, daily goals, lessons, five mini-game formats, audio pronunciation, XP and lives, streaks, achievements, progress, leaderboard views, and a learner profile.

## Run locally

From this folder:

```powershell
cd backend
npm start
```

Open [http://localhost:5174](http://localhost:5174). The server uses Node's built-in modules, so no dependency installation is needed. Visit `/api/health` to check the server.

## Prototype storage

Accounts and learning progress are stored in the browser's local storage for this hackathon prototype. The leaderboard is demo data. `database/schema.sql` sketches a relational schema for a future persistent backend; do not use the prototype's local-storage authentication for production accounts.

## Structure

- `frontend/index.html`: single-page app entry point; views are rendered by the JS files.
- `css/`: responsive shared styles.
- `js/`: feature logic for accounts, lessons, games, scoring, streaks, achievements, progress, and leaderboard.
- `backend/`: dependency-free static server and health route.
- `database/schema.sql`: starter relational schema.
