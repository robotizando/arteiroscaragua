#!/usr/bin/env bash
# Prepara um Ubuntu 24.04. Pode ser reexecutado.
# Uso (como root, a partir de uma cópia da pasta deploy/):
#   DEPLOY_PUBKEY="ssh-ed25519 AAAA... github-actions" bash bootstrap-server.sh
set -euo pipefail

APP_USER=deploy
BASE_DIR=/var/www/arteiroscaragua
NODE_MAJOR=22
PNPM_VERSION=10.33.0
PM2_VERSION=6
DEPLOY_DIR="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
# O usuário deploy não consegue executar comandos a partir de /root.
cd /

[ "$(id -u)" -eq 0 ] || { echo "Execute como root."; exit 1; }
. /etc/os-release
[ "${VERSION_ID:-}" = "24.04" ] || { echo "Esperado Ubuntu 24.04, encontrado ${PRETTY_NAME:-desconhecido}."; exit 1; }
[ -n "${DEPLOY_PUBKEY:-}" ] || { echo "Defina DEPLOY_PUBKEY."; exit 1; }

export DEBIAN_FRONTEND=noninteractive
APT_OPTS=(-y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold)

echo "==> Pacotes do sistema"
apt-get update
apt-get upgrade "${APT_OPTS[@]}"
apt-get install "${APT_OPTS[@]}" ca-certificates curl gnupg build-essential python3 sqlite3 \
  nginx certbot python3-certbot-nginx ufw fail2ban unattended-upgrades

echo "==> Node.js $NODE_MAJOR"
install -d -m 0755 /etc/apt/keyrings
if [ ! -s /etc/apt/keyrings/nodesource.gpg ]; then
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
fi
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
  > /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install "${APT_OPTS[@]}" nodejs
npm install -g "pnpm@$PNPM_VERSION" "pm2@$PM2_VERSION"

echo "==> Usuário $APP_USER"
id "$APP_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$APP_USER"
install -d -m 700 -o "$APP_USER" -g "$APP_USER" "/home/$APP_USER/.ssh"
AUTH="/home/$APP_USER/.ssh/authorized_keys"
touch "$AUTH"
grep -qxF "$DEPLOY_PUBKEY" "$AUTH" || echo "$DEPLOY_PUBKEY" >> "$AUTH"
chown "$APP_USER:$APP_USER" "$AUTH"
chmod 600 "$AUTH"

echo "==> Diretórios"
install -d -m 755 -o "$APP_USER" -g "$APP_USER" "$BASE_DIR" "$BASE_DIR/releases" "$BASE_DIR/incoming"
install -d -m 750 -o "$APP_USER" -g "$APP_USER" "$BASE_DIR/shared" "$BASE_DIR/shared/data" "$BASE_DIR/shared/backups"

ENV_FILE="$BASE_DIR/shared/.env"
if [ ! -f "$ENV_FILE" ]; then
  JWT="$(openssl rand -hex 48)"
  USER_JWT="$(openssl rand -hex 48)"
  ( umask 077; sed -e "s/__JWT_SECRET__/$JWT/" -e "s/__USER_JWT_SECRET__/$USER_JWT/" \
      "$DEPLOY_DIR/env.production.example" > "$ENV_FILE" )
  unset JWT USER_JWT
fi
chown "$APP_USER:$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo "==> PM2"
sudo -u "$APP_USER" -H pm2 ping >/dev/null
sudo -u "$APP_USER" -H pm2 describe pm2-logrotate >/dev/null 2>&1 \
  || sudo -u "$APP_USER" -H pm2 install pm2-logrotate
sudo -u "$APP_USER" -H pm2 set pm2-logrotate:max_size 20M >/dev/null
sudo -u "$APP_USER" -H pm2 set pm2-logrotate:retain 14 >/dev/null
sudo -u "$APP_USER" -H pm2 set pm2-logrotate:compress true >/dev/null
env PATH="$PATH" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null
sudo -u "$APP_USER" -H pm2 save --force >/dev/null
systemctl enable "pm2-$APP_USER" >/dev/null
# Passa o daemon para o systemd, que o mantém ativo e o inicia após um reboot.
if ! systemctl is-active --quiet "pm2-$APP_USER"; then
  sudo -u "$APP_USER" -H pm2 kill >/dev/null
  systemctl start "pm2-$APP_USER"
fi

echo "==> Nginx"
install -d -m 700 -o www-data -g www-data /var/cache/nginx/arteiros
install -m 644 "$DEPLOY_DIR/nginx/arteiros-proxy.conf" /etc/nginx/snippets/arteiros-proxy.conf
install -m 644 "$DEPLOY_DIR/nginx/arteiros-gzip.conf" /etc/nginx/snippets/arteiros-gzip.conf
# Depois do Certbot, o arquivo instalado contém o HTTPS e não pode ser sobrescrito.
if [ ! -f /etc/nginx/sites-available/arteiroscaragua.conf ]; then
  install -m 644 "$DEPLOY_DIR/nginx/arteiroscaragua.conf" /etc/nginx/sites-available/arteiroscaragua.conf
fi
ln -sfn /etc/nginx/sites-available/arteiroscaragua.conf /etc/nginx/sites-enabled/arteiroscaragua.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "==> Firewall"
mapfile -t SSH_PORTS < <(ss -H -tlnp | grep -F '"sshd"' | awk '{print $4}' | sed 's/.*://' | sort -u)
if [ "${#SSH_PORTS[@]}" -eq 0 ] && [ -n "${SSH_CONNECTION:-}" ]; then
  SSH_PORTS=("$(awk '{print $4}' <<<"$SSH_CONNECTION")")
fi
[ "${#SSH_PORTS[@]}" -gt 0 ] || { echo "Porta SSH não detectada. UFW não foi ativado."; exit 1; }
for port in "${SSH_PORTS[@]}"; do ufw allow "$port/tcp" comment 'SSH'; done
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw default deny incoming
ufw default allow outgoing
ufw --force enable

systemctl enable --now fail2ban
echo "==> Concluído: node $(node -v), pnpm $(pnpm -v), pm2 $(sudo -u "$APP_USER" -H pm2 -v | tail -1)"
