# KRESLA — Production Deployment (Render + Vercel)

Architecture for **mebelsotish.uz**:

| Layer | Platform | URL |
|-------|----------|-----|
| Frontend (React/Vite) | Vercel | `https://mebelsotish.uz` |
| Backend (Express) | Render Web Service | `https://api.mebelsotish.uz` |
| Database | MongoDB Atlas | `kresla` database |

> **Note:** This repo is a monorepo — frontend at `/`, backend at `/server` (not `frontend/`).

---

## Quick start

### 1. MongoDB Atlas

1. Cluster running, database name: `kresla`
2. Network Access: allow Render IPs or `0.0.0.0/0` (tighten later)
3. Copy connection string into Render env: `MONGODB_URI`

### 2. Render (backend)

1. [render.com](https://render.com) → **New Web Service** → connect GitHub repo
2. **Root Directory:** `server`
3. **Build:** `npm install`
4. **Start:** `npm start`
5. **Health check path:** `/api/health`
6. Environment variables from `server/.env.production.example`
7. **Custom domain:** `api.mebelsotish.uz` → add CNAME in DNS
8. Copy **Deploy Hook** URL → GitHub secret `RENDER_DEPLOY_HOOK`

Or use Blueprint: repo root `render.yaml` (auto-configures `rootDir: server`).

### 3. Vercel (frontend)

1. [vercel.com](https://vercel.com) → **Import** GitHub repo
2. **Framework:** Vite (auto-detected)
3. **Root Directory:** `.` (repo root)
4. **Build:** `npm run build`
5. **Output:** `dist`
6. Environment variables (Production):

   ```
   VITE_API_BASE_URL=https://api.mebelsotish.uz/api
   VITE_SERVER_URL=https://api.mebelsotish.uz
   ```

7. **Domains:** `mebelsotish.uz`, `www.mebelsotish.uz`
8. GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

`vercel.json` at repo root handles SPA rewrites and `/api` proxy to Render.

### 4. GitHub Actions

Push to `main` runs `.github/workflows/deploy.yml`:

- Lint + build test
- Trigger Render deploy hook
- Deploy frontend to Vercel (if secrets set)
- Optional legacy SSH/rsync if `DEPLOY_*` secrets exist

---

## Environment files

| File | Purpose |
|------|---------|
| `server/.env.production.example` | Render backend template |
| `.env.production.example` | Vercel / local production build |
| `server/.env` | **Never commit** — real Render secrets |

Generate JWT secrets:

```bash
openssl rand -hex 32
```

---

## DNS records

| Host | Type | Target |
|------|------|--------|
| `@` | CNAME or A | Vercel (see Vercel dashboard) |
| `www` | CNAME | Vercel |
| `api` | CNAME | Render service hostname |

SSL: automatic on Render and Vercel.

---

## Post-deploy checks

```bash
# Backend health
curl https://api.mebelsotish.uz/api/health

# Expected: status ok, mongodb connected
```

Frontend: open `https://mebelsotish.uz`, login admin, add product.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Render build fails | Check `Root Directory = server`, Node 20 |
| Health check 503 | `MONGODB_URI` wrong or Atlas IP blocked |
| CORS errors | `CORS_ORIGIN` must include `https://mebelsotish.uz` |
| API 404 on Vercel | Set `VITE_API_BASE_URL` to full `https://api.mebelsotish.uz/api` |
| Uploads broken | Use `VITE_SERVER_URL=https://api.mebelsotish.uz` |

Logs:

- Render → Dashboard → Logs
- Vercel → Deployments → Function/Build logs
- GitHub → Actions tab

---

## Timeline

| Day | Task |
|-----|------|
| 1 | Render + Vercel accounts, env vars, first deploy |
| 2 | Custom domains + DNS |
| 3 | Atlas IP whitelist, health checks |
| 4 | Admin + catalog smoke tests |
| 5+ | Payme, Click, SMTP, Cloudinary |

See also: [deploy/mebelsotish.uz/DEPLOYMENT-CHECKLIST.md](deploy/mebelsotish.uz/DEPLOYMENT-CHECKLIST.md)
