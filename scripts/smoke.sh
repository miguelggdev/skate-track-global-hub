#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# smoke.sh — Smoke tests de infraestructura y backend (Secciones 0 y 0b de
# docs/SMOKE_TESTS.md). Ejecuta chequeos por curl y da un resumen ✅/❌.
#
# Producción (por defecto, https + subdominios):
#   bash scripts/smoke.sh
#
# Entorno LOCAL de pentest (http + localhost, ver docs/PENTEST_ENV.md):
#   SCHEME=http DOMAIN=localhost:8080 API_DOMAIN=localhost:8000 \
#     FLOWER_DOMAIN=localhost:5555 WEBHOOK_SECRET=pentest-webhook-secret-change-me \
#     bash scripts/smoke.sh
#
# Config: toma DOMAIN/API_DOMAIN/FLOWER_DOMAIN/WEBHOOK_SECRET del entorno o, si
# existe, de ./.env.production. Se pueden sobreescribir por variable de entorno.
#
# Pruebas con EFECTOS (opt-in, desactivadas por defecto):
#   RUN_WEBHOOK_WRITE=1   → envía un webhook válido (encola una tarea Celery)
#   RUN_EMAIL=1 SMOKE_EMAIL=tu@correo  → envía un email real vía Resend
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

getenv() {
  [ -f .env.production ] || return 0
  grep -E "^$1=" .env.production 2>/dev/null | head -1 \
    | sed -E "s/^$1=//; s/[[:space:]]*#.*$//; s/^\"//; s/\"$//; s/[[:space:]]*$//"
}

SCHEME="${SCHEME:-https}"
DOMAIN="${DOMAIN:-$(getenv DOMAIN)}";                DOMAIN="${DOMAIN:-track.arkanatech.tech}"
API_DOMAIN="${API_DOMAIN:-$(getenv API_DOMAIN)}";    API_DOMAIN="${API_DOMAIN:-stride.arkanatech.tech}"
FLOWER_DOMAIN="${FLOWER_DOMAIN:-$(getenv FLOWER_DOMAIN)}"; FLOWER_DOMAIN="${FLOWER_DOMAIN:-split.arkanatech.tech}"
LANDING_DOMAIN="${LANDING_DOMAIN:-speedskatetrack.arkanatech.tech}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-$(getenv WEBHOOK_SECRET)}"

PASS=0; FAIL=0; SKIP=0
G="\033[32m"; R="\033[31m"; Y="\033[33m"; B="\033[36m"; N="\033[0m"
ok(){ printf "  ${G}✅ PASS${N} %s\n" "$1"; PASS=$((PASS+1)); }
no(){ printf "  ${R}❌ FAIL${N} %s\n" "$1"; FAIL=$((FAIL+1)); }
sk(){ printf "  ${Y}⏭  SKIP${N} %s\n" "$1"; SKIP=$((SKIP+1)); }
hdr(){ printf "\n${B}== %s ==${N}\n" "$1"; }

CURL="curl -sS --max-time 15"
code(){ curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$@" 2>/dev/null; }

printf "${B}SpeedSkateTrack — smoke.sh${N}  (scheme=%s)\n" "$SCHEME"
printf "app=%s  api=%s  flower=%s\n" "$DOMAIN" "$API_DOMAIN" "$FLOWER_DOMAIN"

# ── 0. Infraestructura y SSL ─────────────────────────────────────────────────
hdr "0. Infraestructura"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  up=$(docker compose ps --status running 2>/dev/null | grep -cE 'frontend|backend|celery|flower|redis' || true)
  if [ "${up:-0}" -ge 6 ]; then ok "Contenedores running: $up/6"
  else sk "Contenedores running: ${up:-0}/6 (usa el -f del compose correcto para contarlos)"; fi
else
  sk "Chequeo de contenedores (docker no disponible en este host)"
fi

# Frontend 200
c=$(code "$SCHEME://$DOMAIN"); [ "$c" = "200" ] && ok "Frontend $SCHEME://$DOMAIN → 200" || no "Frontend $SCHEME://$DOMAIN → ${c:-sin respuesta}"

# Frontend health estático (nginx sirve /health.txt)
body=$($CURL "$SCHEME://$DOMAIN/health.txt" 2>/dev/null || true)
echo "$body" | grep -q 'ok' && ok "Frontend /health.txt → $body" || no "Frontend /health.txt → ${body:-sin respuesta}"

# Backend health directo (health vive en /health, NO en /api/health)
body=$($CURL "$SCHEME://$API_DOMAIN/health" 2>/dev/null || true)
echo "$body" | grep -q 'ok' && ok "Backend /health (directo) → $body" || no "Backend /health (directo) → ${body:-sin respuesta}"

# Flower protegido con basic-auth → 401 sin credenciales
# (con --url_prefix=flower, la ruta SIN "/" final da 404 — el prefix
# real es "/flower/")
c=$(code "$SCHEME://$FLOWER_DOMAIN/flower/")
case "$c" in
  401) ok "Flower $SCHEME://$FLOWER_DOMAIN/flower/ → 401 (basic-auth activo)";;
  200) no "Flower → 200 SIN auth (¡debería pedir usuario/clave!)";;
  *)   no "Flower → ${c:-sin respuesta} (esperado 401)";;
esac

# Landing + SSL: solo en producción (https)
if [ "$SCHEME" = "https" ]; then
  c=$(code "https://$LANDING_DOMAIN")
  case "$c" in 200|301|302) ok "Landing https://$LANDING_DOMAIN → $c";; *) no "Landing → ${c:-sin respuesta}";; esac
  if $CURL -o /dev/null "https://$DOMAIN" 2>/dev/null; then
    issuer=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -issuer 2>/dev/null)
    ok "SSL válido en $DOMAIN ${issuer:+($issuer)}"
  else
    no "SSL en $DOMAIN — certificado no confiable o sin respuesta"
  fi
else
  sk "Landing y SSL (SCHEME=http — entorno local)"
fi

# ── 0b. Backend, agentes e integraciones ─────────────────────────────────────
hdr "0b. Backend e integraciones"

# Webhook SIN secreto → 401 (o 503 si el server no tiene WEBHOOK_SECRET)
c=$(code -X POST "$SCHEME://$API_DOMAIN/api/webhooks/new-athlete" \
    -H "Content-Type: application/json" \
    -d '{"type":"INSERT","table":"athletes","record":{"id":"test"}}')
case "$c" in
  401) ok "Webhook sin secreto → 401 (protegido)";;
  503) no "Webhook → 503: WEBHOOK_SECRET no configurado en el servidor";;
  *)   no "Webhook sin secreto → ${c:-sin respuesta} (esperado 401)";;
esac

# Webhook CON secreto (opt-in: encola una tarea Celery real)
if [ "${RUN_WEBHOOK_WRITE:-0}" = "1" ] && [ -n "$WEBHOOK_SECRET" ]; then
  body=$($CURL -X POST "$SCHEME://$API_DOMAIN/api/webhooks/new-athlete" \
    -H "Content-Type: application/json" -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
    -d '{"type":"INSERT","table":"athletes","record":{"id":"00000000-0000-0000-0000-000000000001"}}' 2>/dev/null || true)
  echo "$body" | grep -q queued && ok "Webhook con secreto → $body (AUTO-20 encolada)" || no "Webhook con secreto → ${body:-sin respuesta}"
else
  sk "Webhook con secreto (RUN_WEBHOOK_WRITE=1 + WEBHOOK_SECRET para probar; encola una tarea)"
fi

# Email real (opt-in)
if [ "${RUN_EMAIL:-0}" = "1" ] && [ -n "${SMOKE_EMAIL:-}" ]; then
  if command -v docker >/dev/null 2>&1; then
    if docker compose exec -T backend \
         python -c "from tasks.helpers import send_email; send_email('$SMOKE_EMAIL','Smoke test','<p>OK</p>')" >/dev/null 2>&1; then
      ok "Email de prueba enviado a $SMOKE_EMAIL (revisa bandeja/spam)"
    else no "Envío de email falló — revisa RESEND_API_KEY y logs del backend"; fi
  else sk "Email (docker no disponible aquí)"; fi
else
  sk "Email de prueba (RUN_EMAIL=1 SMOKE_EMAIL=tu@correo para probar)"
fi

printf "\n${Y}Manual (ver docs/SMOKE_TESTS.md):${N} Flower workers/beat online · chat de agente (streaming) · RAG upload+cita · panel /automatizaciones\n"

# ── Resumen ──────────────────────────────────────────────────────────────────
printf "\n${B}Resumen:${N} ${G}%s ✅${N}  ${R}%s ❌${N}  ${Y}%s ⏭${N}\n" "$PASS" "$FAIL" "$SKIP"
[ "$FAIL" -eq 0 ] && { printf "${G}Smoke OK${N}\n"; exit 0; } || { printf "${R}Hay fallos — revisa arriba${N}\n"; exit 1; }
