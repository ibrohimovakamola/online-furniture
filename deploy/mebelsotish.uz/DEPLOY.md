# Production Deploy — mebelsotish.uz

React (Vite) frontend + Express API + MongoDB Atlas.

**Architecture:** Apache or **Nginx** serves `dist/` (SPA). `/api` and `/uploads` proxy to Node on `127.0.0.1:5000`.

| Stack | SSL guide |
|-------|-----------|
| **Nginx VPS** | [nginx/mebelsotish.conf](./nginx/mebelsotish.conf) + [SSL-SETUP.md § Option A](./SSL-SETUP.md) |
| **Apache/cPanel** | [.htaccess](./.htaccess) + [SSL-SETUP.md § Option B](./SSL-SETUP.md) |

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Node.js 20+ | On server (SSH or cPanel Node.js Selector) |
| PM2 | `npm i -g pm2` |
| MongoDB Atlas | M0 free cluster, IP whitelist `0.0.0.0/0` (or server IP) |
| Apache | `mod_rewrite`, `mod_proxy`, `mod_headers` enabled |
| Nginx | Ubuntu/Debian VPS — see [nginx/mebelsotish.conf](./nginx/mebelsotish.conf) |
| SSL | See [SSL-SETUP.md](./SSL-SETUP.md) |

---

## 1. Build frontend (local or CI)

```bash
# From project root
cp .env.example .env.production   # edit if API on separate host
npm ci
npm run build
```

Output: `dist/` folder.

**Same-origin deploy (recommended):** leave `VITE_API_BASE_URL` unset — the app uses `/api` and Apache proxies it.

---

## 2. Upload to server

### Option A — cPanel (shared hosting)

```
public_html/          ← contents of dist/ (index.html, assets/)
public_html/.htaccess ← copy from deploy/mebelsotish.uz/.htaccess
~/exclusive/server/   ← backend code + server/.env (NOT in public_html)
~/exclusive/server/uploads/  ← writable (chmod 755)
```

### Option B — VPS (Apache or manual upload)

```bash
/var/www/mebelsotish.uz/html/   # dist/
/var/www/exclusive/server/      # API
```

### Option C — VPS (Nginx + Let's Encrypt)

```bash
# 1. Build & upload frontend
npm run build
sudo rsync -avz dist/ user@server:/var/www/mebelsotish.uz/html/

# 2. SSL + Nginx (on server)
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo cp deploy/mebelsotish.uz/nginx/mebelsotish.conf /etc/nginx/sites-available/mebelsotish.uz
sudo ln -sf /etc/nginx/sites-available/mebelsotish.uz /etc/nginx/sites-enabled/
sudo certbot certonly --nginx -d mebelsotish.uz -d www.mebelsotish.uz
sudo nginx -t && sudo systemctl reload nginx

# 3. PM2 API (same as below)
```

Full walkthrough: [SSL-SETUP.md](./SSL-SETUP.md).

---

## 3. Backend setup (SSH)

See **[server/PRODUCTION.md](../../server/PRODUCTION.md)** for the full production checklist.

```bash
cd ~/exclusive
git pull   # or upload via SFTP

cd server
cp .env.production.example .env
nano .env    # Atlas URI, JWT secrets, Payme/Click, SMTP

npm ci --omit=dev
node scripts/preflight.js
node scripts/ensureIndexes.js
mkdir -p uploads logs
```

**Required `.env` values:**

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<64-char-random>
CLIENT_URL=https://mebelsotish.uz
SEED_SUPER_ADMIN=true          # first boot only
SEED_ADMIN_DATA=false
SEED_CATEGORIES=false
```

After first login, set `SEED_SUPER_ADMIN=false` and change admin password in admin panel.

---

## 4. Start API with PM2

```bash
cd ~/exclusive
npm install -g pm2
mkdir -p logs
pm2 start pm2.config.cjs --env production
pm2 save
pm2 startup   # follow printed command for auto-start on reboot
pm2 logs mebel-api   # optional: verify startup
```

Verify:

```bash
curl -s http://127.0.0.1:5000/api/health | jq
# → success: true, database: connected

curl -sI https://mebelsotish.uz/api/health
# → HTTP/2 200
```

---

## 5. Web server config

### Apache (cPanel)

Copy `deploy/mebelsotish.uz/.htaccess` to document root (`public_html/`).

**cPanel:** enable proxy if 502 on `/api`:

- WHM/cPanel → **Apache Configuration** → ensure `mod_proxy` + `mod_proxy_http` loaded
- Or ask host to enable reverse proxy to `127.0.0.1:5000`

### Nginx (VPS)

Use `deploy/mebelsotish.uz/nginx/mebelsotish.conf`. Ensures:

- HTTP → HTTPS redirect
- `www` → apex redirect
- `/api` and `/uploads` → Node on `:5000`
- SPA fallback + gzip + HSTS (SSL Labs A+)

```bash
sudo certbot renew --dry-run   # test auto-renewal
```

---

## 6. Payme & Click webhooks

Register in merchant dashboards:

| Gateway | URL |
|---------|-----|
| Payme | `https://mebelsotish.uz/api/payment/payme/webhook` |
| Payme (legacy) | `https://mebelsotish.uz/api/payments/payme/webhook` |
| Click | `https://mebelsotish.uz/api/payments/click/callback` |

**`server/.env` Payme block:**

```env
PAYME_MERCHANT_ID=your_merchant_id
PAYME_MERCHANT_KEY=your_api_key
PAYME_SERVICE_ID=your_service_id
PAYME_WEBHOOK_URL=https://mebelsotish.uz/api/payment/payme/webhook
PAYME_TEST_MODE=false
PAYME_RETURN_URL=https://mebelsotish.uz/payment/result
```

Test flow: `docs/PAYMENT-TESTING.md`.

---

## 7. Post-deploy checklist

- [ ] `https://mebelsotish.uz` loads SPA
- [ ] `https://mebelsotish.uz/api/health` → database connected
- [ ] Login works (`/login` → `/admin`)
- [ ] Product images load (`/uploads/...`)
- [ ] HTTPS redirect (http → https)
- [ ] Admin password changed from default
- [ ] `SEED_*` flags disabled
- [ ] Payme/Click test payment (sandbox)
- [ ] SMTP configured (order emails)

---

## 8. Updates (re-deploy)

### One-command (on server)

```bash
cd ~/exclusive
chmod +x deploy.sh   # first time only
export FRONTEND_DIR=~/public_html   # optional: sync dist/ to docroot
./deploy.sh
```

Pulls `main`, installs deps, builds, syncs frontend (if `FRONTEND_DIR` set), restarts `mebel-api`.

### GitHub Actions (CI/CD)

Push to `main` runs `.github/workflows/deploy.yml`: lint → build → rsync `dist/` → SSH `git pull` + `pm2 restart`.

**Repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Example |
|--------|---------|
| `DEPLOY_SSH_KEY` | Private key (PEM) for deploy user |
| `DEPLOY_HOST` | `mebelsotish.uz` |
| `DEPLOY_USER` | `your_ssh_user` |
| `DEPLOY_FRONTEND_PATH` | `public_html` (relative to home) |
| `DEPLOY_APP_PATH` | `exclusive` (repo folder under home) |

If secrets are not set, the workflow still runs tests and build but skips the SSH deploy step.

### Manual

```bash
# Local
npm run build

# Upload new dist/ via SFTP or rsync
rsync -avz dist/ user@mebelsotish.uz:public_html/

# Backend update
ssh user@server
cd ~/exclusive && git pull
npm ci && npm ci --prefix server --omit=dev
pm2 restart mebel-api
```

---

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `/api/health` 502 | `pm2 status` — API down? `pm2 logs mebel-api` |
| `/api/health` 503 | MongoDB URI wrong or Atlas IP blocked |
| Blank page | Check `dist/index.html` in docroot; browser console for 404 assets |
| CORS error | Set `CLIENT_URL=https://mebelsotish.uz` in `server/.env` |
| Uploads 404 | `server/uploads` exists; proxy includes `/uploads` in `.htaccess` |
| Redirect loop | Only one HTTPS force rule (`.htaccess` OR cPanel, not both) |

---

## 10. Security hardening

1. `JWT_SECRET` — 64+ random chars (`openssl rand -hex 32`)
2. Never commit `server/.env`
3. Atlas: restrict IP to server IP when possible
4. API binds `127.0.0.1` only (`HOST=127.0.0.1`) — not exposed publicly
5. Disable demo seeds after launch
6. Hide fake card payment in Cart until real PSP integrated
