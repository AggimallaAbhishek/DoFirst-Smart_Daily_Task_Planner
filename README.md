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
Backend runs on `http://localhost:4301`.
The local Dockerized PostgreSQL instance is exposed on `localhost:5433` to avoid conflicts with an existing host database.

## Vercel deployment

Deploy as two Vercel projects from the same repo:

1. Backend API project (`Root Directory: backend`)
2. Frontend web project (`Root Directory: frontend`)

### 1) Deploy backend to Vercel

Run from repo root:

```bash
cd backend
vercel
vercel --prod
```

Set backend environment variables in Vercel:

- `NODE_ENV=production`
- `DATABASE_URL=<your-managed-postgres-url>`
- `JWT_SECRET=<strong-random-secret>`
- `JWT_EXPIRES_IN=24h`
- `FRONTEND_ORIGIN=https://<your-frontend-domain>`
- `ALLOWED_ORIGINS=https://<your-frontend-domain>`
- `AUTH_RATE_LIMIT_MAX=5`
- `API_RATE_LIMIT_MAX=100`
- `RATE_LIMIT_WINDOW_MS=900000`
- `GOOGLE_OAUTH_CLIENT_ID=<google-client-id>`
- `GOOGLE_OAUTH_ADDITIONAL_CLIENT_IDS=<comma-separated-android-or-extra-client-ids>` (optional, recommended when APK/native client differs)
- `GOOGLE_OAUTH_CLIENT_SECRET=<google-client-secret>`
- Optional: `SENTRY_DSN`, `AWS_REGION`, `AWS_SECRETS_MANAGER_SECRET_ID`

After backend env setup, run migrations against production DB:

```bash
NODE_ENV=production DATABASE_URL=<your-managed-postgres-url> JWT_SECRET=<strong-random-secret> npm run db:migrate --workspace backend
```

### 2) Deploy frontend to Vercel

Run from repo root:

```bash
cd frontend
vercel
vercel --prod
```

Set frontend environment variables in Vercel:

- `VITE_API_URL=https://<your-backend-vercel-domain>`
- `VITE_GOOGLE_CLIENT_ID=<default-google-client-id>`
- `VITE_GOOGLE_WEB_CLIENT_ID=<web-client-id>` (optional override)
- `VITE_GOOGLE_NATIVE_CLIENT_ID=<native-client-id>` (optional override for APK/native runtime)

### 3) Google OAuth production setup

In Google Cloud Console for your OAuth client:

- Add authorized JavaScript origin: `https://<your-frontend-domain>`
- Add local dev origin if needed: `http://localhost:5173`

### Notes

- Backend uses `backend/vercel.json` and serves all routes through `backend/api/index.js`.
- Frontend uses `frontend/vercel.json` with SPA rewrite and security headers.

## PWA support

The frontend is configured as an installable PWA with:

- Web app manifest: `frontend/public/manifest.webmanifest`
- Service worker: `frontend/public/sw.js`
- Offline fallback page: `frontend/public/offline.html`
- App icons: `frontend/public/icons/`

Install flow behavior:

- Android/Desktop Chromium browsers: `Install App` button triggers the native install prompt.
- iOS Safari: button shows `Add to Home Screen` guidance.
- After installation, the install button hides and a success state is shown.
