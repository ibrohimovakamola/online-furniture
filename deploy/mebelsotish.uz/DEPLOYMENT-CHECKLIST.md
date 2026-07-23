# Kresla — Deployment Readiness Checklist

Print or copy this list before going live on **mebelsotish.uz**.

## Backend

- [ ] `server/.env` completed (from `server/.env.production.example`)
- [ ] `MONGODB_URI` tested (Atlas `kresla` database)
- [ ] All API endpoints smoke-tested (GET, POST, PUT, DELETE)
- [ ] `GET /api/health` returns `mongodb: connected`
- [ ] Error handling middleware active (`errorHandler` in `app.js`)
- [ ] CORS origins set (`CORS_ORIGIN`, `CLIENT_URL`)
- [ ] Rate limiting configured (`API_RATE_LIMIT_MAX`)
- [ ] Payment gateway credentials (Payme / Click / Uzum Bank)
- [ ] Email SMTP credentials
- [ ] Cloudinary (or local uploads) configured
- [ ] `npm run seed` tested (test products)
- [ ] Atlas backups enabled

## Frontend

- [ ] Admin product create tested (`/admin/products`)
- [ ] Admin product list / edit / delete working
- [ ] Responsive layout (mobile)
- [ ] i18n (uz / ru / en)
- [ ] Payment flow (sandbox)
- [ ] Cart and checkout
- [ ] User registration / login
- [ ] Protected admin routes
- [ ] Error boundaries / toast errors
- [ ] Loading states on async actions

## Database

- [ ] MongoDB Atlas cluster active
- [ ] Network access whitelist (server IP)
- [ ] Backup schedule configured
- [ ] Indexes synced (`npm run ensure-indexes`)
- [ ] Seed / categories present
- [ ] Roles: super_admin, admin, customer
- [ ] Product categories seeded

## Security

- [ ] JWT secrets 32+ characters
- [ ] Passwords hashed (bcrypt)
- [ ] Secrets only in `.env` (not in git)
- [ ] HTTPS / SSL on domain
- [ ] CORS locked to production domains
- [ ] Rate limiting enabled
- [ ] Input validation (Joi / express-validator)
- [ ] Mongo sanitize + XSS middleware

## Render + Vercel (recommended)

- [ ] Render Web Service created (`server/`, `npm start`)
- [ ] `render.yaml` or manual Root Directory = `server`
- [ ] Render env vars from `server/.env.production.example`
- [ ] Render custom domain: `api.mebelsotish.uz`
- [ ] Vercel project imported (repo root, Vite)
- [ ] Vercel env: `VITE_API_BASE_URL`, `VITE_SERVER_URL`
- [ ] Vercel domains: `mebelsotish.uz`, `www.mebelsotish.uz`
- [ ] GitHub Secrets: `RENDER_DEPLOY_HOOK`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] `curl https://api.mebelsotish.uz/api/health` → 200

## Next deployment steps

1. **Render** — backend API at `api.mebelsotish.uz`
2. **Vercel** — frontend at `mebelsotish.uz`
3. **Atlas** — `kresla` DB, IP whitelist for Render
4. **DNS** — CNAME `api` → Render, `@`/`www` → Vercel
5. **CI/CD** — push `main` → GitHub Actions
6. **Monitoring** — Render logs, Vercel analytics, Atlas alerts

Alternative: VPS + PM2 — see [DEPLOY.md](./DEPLOY.md).

See also: [PRODUCTION-READY.md](../../PRODUCTION-READY.md), [server/PRODUCTION.md](../../server/PRODUCTION.md).
