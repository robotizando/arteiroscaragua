#!/usr/bin/env bash
# Funções compartilhadas por release.sh e rollback.sh.

BASE_DIR="${BASE_DIR:-/var/www/arteiroscaragua}"
# shellcheck disable=SC2034  # usadas por release.sh e rollback.sh
RELEASES_DIR="$BASE_DIR/releases"
# shellcheck disable=SC2034
SHARED_DIR="$BASE_DIR/shared"
PM2_APPS=(arteiros-api arteiros-admin arteiros-site)
HEALTH_URLS=(
  "http://127.0.0.1:4001/api/health"
  "http://127.0.0.1:4002/"
  "http://127.0.0.1:4003/"
)

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }

validar_sha() {
  [[ "${1:-}" =~ ^[0-9a-f]{7,40}$ ]] || { log "SHA inválido: ${1:-vazio}"; return 1; }
}

trocar_link() {
  local alvo="$1" link="$2"
  ln -sfn "$alvo" "$link.tmp"
  mv -Tf "$link.tmp" "$link"
}

# Recria os processos, porque um reload do PM2 manteria o cwd da release anterior.
iniciar_release() {
  local release="$1"
  pm2 delete "${PM2_APPS[@]}" >/dev/null 2>&1 || true
  pm2 start "$release/deploy/ecosystem.config.cjs" --update-env
  pm2 save --force >/dev/null
}

aguardar_saude() {
  local url tentativa
  for url in "${HEALTH_URLS[@]}"; do
    for tentativa in $(seq 1 30); do
      curl -fsS -o /dev/null --max-time 3 "$url" && break
      if [ "$tentativa" -eq 30 ]; then
        log "Health check falhou: $url"
        return 1
      fi
      sleep 2
    done
    log "OK: $url"
  done
}

ativar_release() {
  local release="$1" atual
  atual="$(readlink -f "$BASE_DIR/current" 2>/dev/null || true)"

  trocar_link "$release" "$BASE_DIR/current"
  iniciar_release "$release"

  if aguardar_saude; then
    if [ -n "$atual" ] && [ "$atual" != "$release" ]; then
      trocar_link "$atual" "$BASE_DIR/previous"
    fi
    return 0
  fi

  pm2 logs --nostream --lines 40 "${PM2_APPS[0]}" || true
  if [ -n "$atual" ] && [ -d "$atual" ] && [ "$atual" != "$release" ]; then
    log "Voltando o código para $(basename "$atual"). O banco NÃO é restaurado automaticamente."
    trocar_link "$atual" "$BASE_DIR/current"
    iniciar_release "$atual"
    aguardar_saude || log "ATENÇÃO: a release anterior também não respondeu."
  fi
  return 1
}
