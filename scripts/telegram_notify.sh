#!/usr/bin/env bash
# telegram_notify.sh — avisa por Telegram a todos los Superadmins que tengan
# telegram_chat_id configurado (tabla platform_admins). Pensado para correr
# FUERA de los contenedores (host del VPS) — así avisa aunque el stack de
# Docker entero esté caído, que es justo el escenario que importa.
#
# Uso: ./telegram_notify.sh "mensaje"
# Requiere en .env.production: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY.
# Si falta cualquiera, no hace nada (silencioso) — no bloquea al caller.

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[[ -f "$SCRIPT_DIR/.env.production" ]] && source "$SCRIPT_DIR/.env.production"

MESSAGE="${1:-}"
[[ -n "$MESSAGE" ]] || { echo "Uso: $0 <mensaje>" >&2; exit 1; }
[[ -n "${TELEGRAM_BOT_TOKEN:-}" ]] || exit 0
[[ -n "${SUPABASE_URL:-}" && -n "${SUPABASE_SERVICE_KEY:-}" ]] || exit 0

CHAT_IDS=$(curl -sf \
  "$SUPABASE_URL/rest/v1/platform_admins?select=telegram_chat_id&telegram_chat_id=not.is.null" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  2>/dev/null | grep -oE '"telegram_chat_id":"[^"]*"' | sed -E 's/.*:"([^"]*)"/\1/')

if [[ -z "$CHAT_IDS" ]]; then
  exit 0
fi

for CHAT_ID in $CHAT_IDS; do
  curl -sf -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    --data-urlencode "text=${MESSAGE}" \
    >/dev/null 2>&1 || true
done
