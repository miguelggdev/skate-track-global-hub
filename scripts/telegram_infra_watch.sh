#!/usr/bin/env bash
# telegram_infra_watch.sh — chequea el estado de los contenedores de este
# proyecto (filtrados por nombre "skatetrack", no toca contenedores de otros
# proyectos que comparten el VPS) y avisa por Telegram si alguno está
# unhealthy, reiniciando en loop, o caído.
#
# Pensado para correr por cron en el HOST del VPS (no dentro de un
# contenedor) cada hora:
#   0 * * * * /srv/skatetrack/scripts/telegram_infra_watch.sh >> /var/log/skatetrack-watch.log 2>&1

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PROBLEMS=$(docker ps -a --filter "name=skatetrack" --format '{{.Names}}\t{{.Status}}' \
  | grep -iE "unhealthy|restarting|Exited" || true)

if [[ -n "$PROBLEMS" ]]; then
  echo "$(date -Is) — problema detectado:"
  echo "$PROBLEMS"
  bash "$SCRIPT_DIR/telegram_notify.sh" "🔴 SpeedSkateTrack — problema en el VPS:
$PROBLEMS"
else
  echo "$(date -Is) — todo healthy"
fi
