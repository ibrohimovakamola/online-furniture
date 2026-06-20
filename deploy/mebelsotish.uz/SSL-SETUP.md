# SSL / HTTPS — mebelsotish.uz

Guides for **Let's Encrypt** on **Nginx (VPS)**, **Apache/cPanel**, and verification.

---

## Option A — Nginx + Certbot (VPS, recommended for A+)

### 1. Prerequisites

- Ubuntu 22.04+ or Debian 12+
- DNS **A records** for `mebelsotish.uz` and `www.mebelsotish.uz` → server IP
- Ports **80** and **443** open in firewall
- Node API running on `127.0.0.1:5000` (PM2)

### 2. Install Certbot

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 3. Deploy Nginx config

From the repo on the server:

```bash
sudo mkdir -p /var/www/mebelsotish.uz/html
sudo mkdir -p /var/www/certbot

# Upload dist/ contents to /var/www/mebelsotish.uz/html
sudo cp deploy/mebelsotish.uz/nginx/mebelsotish.conf /etc/nginx/sites-available/mebelsotish.uz
sudo ln -sf /etc/nginx/sites-available/mebelsotish.uz /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Or run the automated script:

```bash
sudo chmod +x deploy/mebelsotish.uz/nginx/setup-ssl.sh
sudo ./deploy/mebelsotish.uz/nginx/setup-ssl.sh
```

### 4. Obtain certificate

```bash
sudo certbot certonly --nginx \
  -d mebelsotish.uz \
  -d www.mebelsotish.uz
```

Interactive first run (replace email):

```bash
sudo certbot --nginx -d mebelsotish.uz -d www.mebelsotish.uz \
  --agree-tos -m you@example.com --redirect
```

Cert paths (used in nginx config):

| File | Path |
|------|------|
| Full chain | `/etc/letsencrypt/live/mebelsotish.uz/fullchain.pem` |
| Private key | `/etc/letsencrypt/live/mebelsotish.uz/privkey.pem` |

### 5. Nginx site summary

Config file: [`deploy/mebelsotish.uz/nginx/mebelsotish.conf`](./nginx/mebelsotish.conf)

| Traffic | Handling |
|---------|----------|
| `http://` | 301 → `https://mebelsotish.uz` |
| `https://www.` | 301 → apex |
| `/api/*` | Proxy → `127.0.0.1:5000` |
| `/uploads/*` | Proxy → Node |
| `/` | SPA `try_files` → `index.html` |

**Server `.env` for proxy:**

```env
TRUST_PROXY=true
TRUST_PROXY_HOPS=1
CLIENT_URL=https://mebelsotish.uz
```

### 6. Auto-renewal

Certbot installs a **systemd timer** on most distros:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

Cron fallback (reload Nginx after renew):

```cron
0 3,15 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

### 7. SSL Labs A+ checklist

The bundled Nginx config includes:

- TLS 1.2+ only (via Certbot `options-ssl-nginx.conf`)
- Strong ciphers + forward secrecy
- OCSP stapling
- HSTS with `preload` (31536000 s)
- Security headers (nosniff, frame options, referrer policy)

After deploy, test: [SSL Labs — mebelsotish.uz](https://www.ssllabs.com/ssltest/analyze.html?d=mebelsotish.uz)

Target: **A or A+**. If grade is A not A+:

```bash
# Ensure DH params exist
sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
sudo nginx -t && sudo systemctl reload nginx
```

---

## Option B — cPanel / Apache (shared hosting)

### 1. cPanel AutoSSL (recommended)

1. cPanel → **SSL/TLS Status**
2. Select `mebelsotish.uz` and `www.mebelsotish.uz`
3. **Run AutoSSL**
4. Wait 5–15 minutes

### 2. Manual Certbot (SSH + webroot)

```bash
sudo certbot certonly --webroot -w /home/user/public_html \
  -d mebelsotish.uz -d www.mebelsotish.uz
```

Renewal:

```cron
0 3,15 * * * certbot renew --quiet --deploy-hook "systemctl reload httpd"
```

### 3. Force HTTPS (Apache)

Copy [`deploy/mebelsotish.uz/.htaccess`](./.htaccess) to document root after `npm run build`.

---

## Verification

```bash
# Valid HTTPS response
curl -I https://mebelsotish.uz

# API through TLS
curl -s https://mebelsotish.uz/api/health

# HSTS header
curl -sI https://mebelsotish.uz | grep -i strict-transport

# HTTP → HTTPS redirect
curl -I http://mebelsotish.uz
# → Location: https://mebelsotish.uz/...
```

Browser checklist:

- [ ] Padlock — valid certificate (Let's Encrypt)
- [ ] No mixed content (DevTools → Console)
- [ ] SSL Labs grade **A or A+**
- [ ] Payme/Click webhooks use `https://` URLs

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `certbot` fails — connection refused | Open port 80; DNS must point to this server |
| Nginx `ssl_certificate` not found | Run certbot first; check paths under `/etc/letsencrypt/live/` |
| Redirect loop | Only one HTTPS redirect layer (Nginx **or** app, not both) |
| `/api` 502 | `pm2 status` — start API; confirm `127.0.0.1:5000` |
| Mixed content | Build with `VITE_API_BASE_URL=https://mebelsotish.uz/api` or same-origin `/api` |
| Certificate mismatch | Cert must include both apex and `www` |
| Renewal fails | `certbot renew --dry-run`; check port 80 free for HTTP-01 |

---

## Security headers

Included in Nginx config and Apache `.htaccess`:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```
