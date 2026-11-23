#!/usr/bin/env bash
# Ativa uma release já extraída em releases/<sha>. Uso: release.sh <sha>
set -euo pipefail

source "$(dirname "$(readlink -f "$0")")/lib.sh"

SHA="${1:-}"
validar_sha "$SHA"
RELEASE="$RELEASES_DIR/$SHA"
DB="$SHARED_DIR/data/production.sqlite"
BACKUPS="$SHARED_DIR/backups"
MANTER_RELEASES=5
MANTER_BACKUPS=7

[ -d "$RELEASE" ] || { log "Release não encontrada: $RELEASE"; exit 1; }
[ -f "$SHARED_DIR/.env" ] || { log "Falta $SHARED_DIR/.env"; exit 1; }
grep -qx "DATABASE_URL=$DB" "$SHARED_DIR/.env" || { log "DATABASE_URL precisa ser $DB"; exit 1; }

exec 9>"$BASE_DIR/.deploy.lock"
flock -n 9 || { log "Outro deploy está em andamento."; exit 1; }

log "Instalando dependências de produção"
ln -sfn "$SHARED_DIR/.env" "$RELEASE/apps/backend/.env"
(cd "$RELEASE" && CI=true pnpm install --frozen-lockfile --prod)

if [ -f "$DB" ]; then
  mkdir -p "$BACKUPS"
  BACKUP="$BACKUPS/production-$(date +%Y%m%d-%H%M%S)-$SHA.sqlite"
  log "Backup do banco: $BACKUP"
  sqlite3 "$DB" ".backup '$BACKUP'"
  [ "$(sqlite3 "$BACKUP" 'PRAGMA integrity_check;')" = "ok" ] || { log "Backup inválido."; exit 1; }
  gzip "$BACKUP"
fi

log "Aplicando migrações"
(cd "$RELEASE/apps/backend" && NODE_ENV=production node dist/database/migrate.js)

log "Ativando $SHA"
ativar_release "$RELEASE"

log "Limpando versões antigas"
CURRENT="$(readlink -f "$BASE_DIR/current")"
PREVIOUS="$(readlink -f "$BASE_DIR/previous" 2>/dev/null || true)"
mapfile -t ANTIGAS < <(ls -1dt "$RELEASES_DIR"/*/ | sed 's:/$::' | tail -n +$((MANTER_RELEASES + 1)))
for dir in "${ANTIGAS[@]}"; do
  if [ "$dir" != "$CURRENT" ] && [ "$dir" != "$PREVIOUS" ]; then
    rm -rf -- "$dir"
  fi
done
mapfile -t BACKUPS_ANTIGOS < <(
  { ls -1t "$BACKUPS"/production-*.sqlite.gz 2>/dev/null || true; } | tail -n +$((MANTER_BACKUPS + 1))
)
if [ "${#BACKUPS_ANTIGOS[@]}" -gt 0 ]; then
  rm -f -- "${BACKUPS_ANTIGOS[@]}"
fi

log "Deploy concluído: $SHA"
