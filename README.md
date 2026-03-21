# Smart Daily Planner

Smart Daily Planner is a security-first daily task planner built as a monorepo with React, Express, and PostgreSQL.

## Workspace layout

- `frontend/`: React 18 + Vite + Tailwind CSS
- `backend/`: Express API with PostgreSQL, JWT auth, and security middleware
- `.github/workflows/`: CI automation
- `docs/`: runbooks and operational notes

## Local development

1. Install dependencies: `npm install`
2. Start PostgreSQL: `npm run db:up`
3. Copy env files:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
4. Run migrations: `npm run db:migrate`
5. Start both apps: `npm run dev`

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:3000`.
The local Dockerized PostgreSQL instance is exposed on `localhost:5433` to avoid conflicts with an existing host database.
