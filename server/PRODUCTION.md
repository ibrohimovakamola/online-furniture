# Production readiness — mebelsotish.uz backend

Complete checklist for deploying the Express API to production. For Apache/Nginx/PM2 steps see [deploy/mebelsotish.uz/DEPLOY.md](../deploy/mebelsotish.uz/DEPLOY.md).

---

## Server requirements

| Requirement | Value |
|-------------|-------|
| Node.js | **20+** (see `.nvmrc`) |
| RAM | Min **512 MB** per PM2 worker |
| Storage | MongoDB Atlas (data) + `server/uploads/` (product images) |
| Process manager | PM2 cluster (`pm2.config.cjs`) |
| Database | MongoDB Atlas M0+ (not local/memory) |

Install production dependencies only:

```bash
cd server
npm ci --omit=dev
```

---

## 1. Environment configuration

```bash
cp .env.production.example .env
# Edit with real Atlas URI, JWT secrets, Payme/Click, SMTP, Cloudinary
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # REFRESH_SECRET (must differ)
```

Run preflight before first deploy:

```bash
node scripts/preflight.js
```

Sync indexes after schema changes:

```bash
node scripts/ensureIndexes.js
```

---

## 2. Security checklist

| Item | Status |
|------|--------|
| All secrets in `server/.env` (never in git) | Required |
| `JWT_SECRET` / `REFRESH_SECRET` ≥ 32 chars | Required |
| `MONGODB_URI` = Atlas SRV (not `memory`) | Required |
| `CORS_ORIGIN` = `https://mebelsotish.uz` only | Required |
| `FORCE_HTTPS=true` + Apache/Nginx SSL | Required |
| Rate limiting (`API_RATE_LIMIT_MAX`, auth limits) | Enabled |
| Joi / express-validator on inputs | Enabled |
| Helmet security headers | Enabled |
| CSRF on file uploads (`CSRF_ENABLED=true`) | Enabled |
| `SEED_*` flags = `false` | Required |
| Swagger UI disabled (`SWAGGER_ENABLED=false`) | Recommended |
| No stack traces in API JSON responses | Production default |

---

## 3. Database indexes

Indexes are defined on models and synced via `scripts/ensureIndexes.js`:

| Model | Indexes |
|-------|---------|
| **User** | `email` (unique), `role + isActive` |
| **Product** | `category + isPublished`, text search, `sku`, `slug`, `rating`, price |
| **Order** | `customer + createdAt`, `customer + status`, `status + createdAt`, `paymentStatus` |
| **Review** | `{ product, user }` unique, `{ product, status, createdAt }` |

Atlas backups: enable **Cloud Backup** (M10+) or scheduled `mongodump` on M0.

Monitor slow queries in Atlas → Performance Advisor.

---

## 4. API performance

| Feature | Implementation |
|---------|----------------|
| Pagination max | 100 items (`parsePagination`, Joi schemas) |
| Field filtering | `GET /api/products?fields=name,price,rating` |
| Lean queries | Category lookups, list filters |
| Settings cache | 60s in-memory (`SETTINGS_CACHE_MS`) |
| Winston log rotation | `server/logs/` daily rotate |

---

## 5. Logging (no console.log in production)

Runtime code uses `appLogger` / Winston → `server/logs/`:

- `error-YYYY-MM-DD.log` — 5xx and tracked errors
- `combined-YYYY-MM-DD.log` — general info
- PM2 logs: `logs/error.log`, `logs/out.log` (from project root via `pm2.config.cjs`)

Admin error dashboard: `GET /api/admin/errors`

---

## 6. Deployment checklist

- [ ] Copy `server/.env.production.example` → `server/.env` with real values
- [ ] `node scripts/preflight.js` passes
- [ ] `node scripts/ensureIndexes.js` completed
- [ ] MongoDB Atlas IP whitelist includes server IP (or `0.0.0.0/0` temporarily)
- [ ] Payme webhook: `https://mebelsotish.uz/api/payments/payme-callback`
- [ ] Click callback registered in merchant panel
- [ ] SMTP test email sent (order confirmation)
- [ ] `npm ci --omit=dev` in `server/`
- [ ] `npm run build` frontend → upload `dist/`
- [ ] PM2: `pm2 start pm2.config.cjs --env production && pm2 save`
- [ ] SSL certificate valid ([SSL-SETUP.md](../deploy/mebelsotish.uz/SSL-SETUP.md))
- [ ] CORS tested from `https://mebelsotish.uz`
- [ ] Postman collection smoke test (`server/postman/`)
- [ ] `/api/health` returns 200
- [ ] Atlas backup policy enabled

Optional docs in production: set `SWAGGER_ENABLED=true` → https://mebelsotish.uz/api-docs

---

## 7. PM2 production setup

From project root:

```bash
mkdir -p logs server/logs
npm ci --omit=dev --prefix server
pm2 start pm2.config.cjs --env production
pm2 save
pm2 startup    # run printed sudo command once
pm2 logs mebel-api
```

Config highlights (`pm2.config.cjs`):

- 2 cluster workers
- Auto-restart on crash
- `max_memory_restart: 512M`

---

## 8. Post-deployment monitoring

Daily:

- Review `server/logs/error-*.log` and `/api/admin/errors`
- Check PM2: `pm2 status`, `pm2 monit`
- Atlas metrics: connections, slow queries

Weekly:

- Verify Atlas backup snapshots
- Review rate-limit / 401 spikes in logs

---

## 9. Rollback plan

1. **Before deploy:** Atlas snapshot or `mongodump`
2. **Keep previous build:** `dist/` and git tag (e.g. `v1.2.0`)
3. **Rollback API:**
   ```bash
   git checkout <previous-tag>
   cd server && npm ci --omit=dev
   pm2 restart mebel-api
   ```
4. **Rollback frontend:** restore previous `dist/` to `public_html`
5. **Database:** restore Atlas snapshot only if migration broke data

---

## 10. Production URLs

| Service | URL |
|---------|-----|
| Storefront | https://mebelsotish.uz |
| API health | https://mebelsotish.uz/api/health |
| API docs (optional) | https://mebelsotish.uz/api-docs |
| Payme webhook | https://mebelsotish.uz/api/payments/payme-callback |
| Click callback | https://mebelsotish.uz/api/payments/click-callback |
| Admin panel | https://mebelsotish.uz/admin |

---

## 11. API documentation

| Resource | Path |
|----------|------|
| Swagger UI | `/api-docs` (dev or `SWAGGER_ENABLED=true`) |
| OpenAPI JSON | `/api-docs.json` |
| Backend guide | [BACKEND.md](./BACKEND.md) |
| Postman | [postman/mebelsotish.uz.postman_collection.json](./postman/mebelsotish.uz.postman_collection.json) |

Example authenticated request:

```bash
curl https://mebelsotish.uz/api/products?limit=10&fields=name,price,rating \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Error format:

```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errorId": "ERR-A1B2C3"
}
```

Rate limits: 100 req/hr general API, 5 login attempts / 15 min.
