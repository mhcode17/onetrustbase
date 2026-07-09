#!/usr/bin/env bash
# One-shot deploy for GetReport / One Trust Base on an Ubuntu droplet.
# Installs Docker + Nginx + Certbot, builds the stack, and enables HTTPS.
#
# Run from the repository root, AFTER creating a .env file (see DEPLOY.md):
#   sudo DOMAIN=trust.oneprimefleet.com EMAIL=you@example.com bash deploy/setup-droplet.sh
#
# Safe to re-run (idempotent).

set -euo pipefail

DOMAIN="${DOMAIN:-trust.oneprimefleet.com}"
EMAIL="${EMAIL:-admin@${DOMAIN#*.}}"

log() { echo -e "\n\033[1;36m==> $*\033[0m"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run with sudo/root." >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "ERROR: .env not found in $(pwd). Create it first (see DEPLOY.md)." >&2
  exit 1
fi

log "Installing Docker (if missing)"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

log "Installing Nginx, Certbot, firewall"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx ufw

log "Configuring firewall (SSH + HTTP/HTTPS)"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable || true

log "Building and starting containers (web + bot + postgres)"
docker compose up -d --build

log "Writing Nginx reverse-proxy for ${DOMAIN}"
cat > "/etc/nginx/sites-available/${DOMAIN}" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    # Evidence uploads can be up to 10 MB each.
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
nginx -t
systemctl reload nginx

log "Obtaining HTTPS certificate for ${DOMAIN}"
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect

log "Done! Your site should be live at https://${DOMAIN}"
echo "   - Check web logs:  docker compose logs -f web"
echo "   - Check bot logs:  docker compose logs -f bot"
echo "   - Seed demo data:  docker compose exec web npm run db:seed"
