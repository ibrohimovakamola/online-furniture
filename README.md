# Exclusive — O'zbek mebel e-commerce

React + Vite storefront, Express API, MongoDB.

## Local development

```bash
npm install          # installs root + server deps
cp server/.env.example server/.env
npm run dev          # Vite :5173 + API :5000
```

- Storefront: http://localhost:5173
- API health: http://localhost:5000/api/health
- Admin: `admin@exclusive.uz` / `ChangeMe123!` (dev seed)

## Production deploy

See **[deploy/mebelsotish.uz/DEPLOY.md](deploy/mebelsotish.uz/DEPLOY.md)** for the full runbook.

Quick steps:

```bash
npm run build                              # → dist/
# Upload dist/ + .htaccess to public_html
# server/.env from server/.env.production.example
npm install -g pm2
mkdir -p logs
pm2 start pm2.config.cjs --env production
pm2 save && pm2 startup   # auto-start on reboot (run printed sudo command once)
```

## Project structure

| Path | Purpose |
|------|---------|
| `src/` | React storefront + admin panel |
| `server/` | Express API — see [server/BACKEND.md](server/BACKEND.md) |
| `dist/` | Production frontend build output |
| `pm2.config.cjs` | PM2 cluster config (auto-restart, 2 workers) |
| `deploy/` | Apache `.htaccess`, SSL guide |
| `docs/` | Payment testing guide |
| `php-app/` | Optional PHP scaffold (not used by main app) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend + backend concurrently |
| `npm run build` | Production frontend build |
| `npm run start:server` | API only (production, no PM2) |
| `npm run pm2:start` | Start API with PM2 (cluster, auto-restart) |
| `npm run pm2:logs` | Tail PM2 logs for `mebel-api` |
| `npm test` | Lint (CI gate before deploy) |
| `npm run lint` | ESLint |
| `./deploy.sh` | Server-side pull, build, PM2 restart |

## Environment

- Frontend: `.env.example` → `.env.production` (build-time)
- Backend: `server/.env.production.example` → `server/.env` (runtime)
