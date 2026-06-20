#!/usr/bin/env bash
# Let's Encrypt + Nginx for mebelsotish.uz (Ubuntu/Debian VPS)
# Run on the server as root or with sudo:
#   chmod +x deploy/mebelsotish.uz/nginx/setup-ssl.sh
#   sudo ./deploy/mebelsotish.uz/nginx/setup-ssl.sh

set -euo pipefail

DOMAIN=mebelsotish.uz
WWW=www.mebelsotish.uz
WEBROOT=/var/www/mebelsotish.uz/html
CERTBOT_WEBROOT=/var/www/certbot
NGINX_SITE=/etc/nginx/sites-available/mebelsotish.uz

echo "==> Installing packages..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

echo "==> Creating directories..."
mkdir -p "$WEBROOT" "$CERTBOT_WEBROOT/.well-known/acme-challenge"
chown -R www-data:www-data /var/www/mebelsotish.uz /var/www/certbot

echo "==> Installing Nginx site config..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/mebelsotish.conf" "$NGINX_SITE"
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/mebelsotish.uz
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

echo "==> Generating DH params (first run only, may take a minute)..."
if [[ ! -f /etc/letsencrypt/ssl-dhparams.pem ]]; then
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

echo "==> Testing Nginx (pre-cert — expect SSL file warnings until cert exists)..."
nginx -t || true

echo "==> Obtaining certificate..."
certbot certonly --nginx \
  -d "$DOMAIN" \
  -d "$WWW" \
  --non-interactive --agree-tos \
  --email "admin@${DOMAIN}" \
  --redirect \
  || certbot certonly --webroot -w "$CERTBOT_WEBROOT" \
       -d "$DOMAIN" -d "$WWW" \
       --non-interactive --agree-tos \
       --email "admin@${DOMAIN}"

echo "==> Certbot recommended SSL options..."
if [[ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]]; then
  curl -sS https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o /etc/letsencrypt/options-ssl-nginx.conf
fi

echo "==> Final Nginx test + reload..."
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "==> Renewal timer (systemd — installed by certbot package)..."
systemctl enable certbot.timer 2>/dev/null || true
systemctl start certbot.timer 2>/dev/null || true

echo ""
echo "Done. Verify:"
echo "  curl -I http://${DOMAIN}          # → 301 https"
echo "  curl -I https://${DOMAIN}/api/health"
echo "  https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
