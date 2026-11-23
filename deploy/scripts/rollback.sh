#!/usr/bin/env bash
# Volta o CÓDIGO para outra release. Uso: rollback.sh [sha]
# Sem SHA, usa a release anterior. O banco não é alterado.
set -euo pipefail

source "$(dirname "$(readlink -f "$0")")/lib.sh"

if [ -n "${1:-}" ]; then
  validar_sha "$1"
  ALVO="$RELEASES_DIR/$1"
else
  ALVO="$(readlink -f "$BASE_DIR/previous" 2>/dev/null || true)"
fi

[ -n "$ALVO" ] && [ -d "$ALVO" ] || { log "Release de destino não encontrada: ${ALVO:-nenhuma}"; exit 1; }
[ "$ALVO" != "$(readlink -f "$BASE_DIR/current")" ] || { log "Essa release já está ativa."; exit 1; }

exec 9>"$BASE_DIR/.deploy.lock"
flock -n 9 || { log "Outro deploy está em andamento."; exit 1; }

log "Rollback para $(basename "$ALVO")"
ativar_release "$ALVO"
log "Rollback concluído."
