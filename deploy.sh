#!/usr/bin/env bash
# deploy.sh — SpeedSkateTrack Hub (VPS + Traefik)
# Uso: ./deploy.sh [init|update|logs [servicio]|status|migrations]
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Verificar dependencias ─────────────────────────────────────────────────
check_deps() {
    command -v docker >/dev/null 2>&1 || error "Docker no está instalado."
    docker compose version >/dev/null 2>&1 || error "Docker Compose v2 no está disponible."
    [[ -f .env.production ]] || error "Falta .env.production. Copia .env.production.example y rellénalo."
}

# ── Verificar que Traefik está corriendo ──────────────────────────────────
check_traefik() {
    docker network inspect supabase2_net >/dev/null 2>&1 \
        || error "Red 'supabase2_net' no existe. Asegúrate de que Traefik está levantado antes de continuar."
    info "Red supabase2_net encontrada."
}

# ── Health check del backend (espera hasta 90s) ───────────────────────────
wait_backend() {
    info "Esperando que el backend esté listo..."
    for i in $(seq 1 18); do
        docker compose exec -T backend curl -sf http://localhost:8000/health >/dev/null 2>&1 && return 0
        sleep 5
    done
    return 1
}

# ── Primer despliegue ──────────────────────────────────────────────────────
cmd_init() {
    info "=== PRIMER DEPLOY (Traefik + Docker Compose) ==="
    check_deps
    check_traefik

    info "Construyendo imágenes y levantando servicios..."
    docker compose --env-file .env.production up -d --build

    if wait_backend; then
        info "=== Deploy completado. ==="
        info "Traefik asignará el certificado SSL automáticamente (puede tardar 1-2 min)."
        docker compose --env-file .env.production ps
    else
        warn "El backend tardó más de 90s en responder. Revisa los logs:"
        warn "  docker compose logs backend"
    fi
}

# ── Actualización con rollback automático ─────────────────────────────────
cmd_update() {
    info "=== ACTUALIZACIÓN ==="
    check_deps
    check_traefik

    ROLLBACK_SHA=$(git rev-parse HEAD)
    info "SHA de rollback guardado: $ROLLBACK_SHA"

    info "Descargando cambios del repositorio..."
    git pull origin master

    info "Reconstruyendo imágenes..."
    if ! docker compose --env-file .env.production up -d --build; then
        warn "Build fallido — revertiendo a $ROLLBACK_SHA..."
        git checkout "$ROLLBACK_SHA" -- .
        docker compose --env-file .env.production up -d --build
        error "Deploy fallido. Rollback restaurado."
    fi

    if wait_backend; then
        info "=== Actualización completada ==="
        docker compose --env-file .env.production ps
    else
        warn "Health check fallido — revertiendo a $ROLLBACK_SHA..."
        git checkout "$ROLLBACK_SHA" -- .
        docker compose --env-file .env.production up -d --build
        error "Health check fallido post-deploy. Se restauró $ROLLBACK_SHA."
    fi
}

# ── Logs ───────────────────────────────────────────────────────────────────
cmd_logs() {
    SERVICE="${2:-}"
    if [[ -n "$SERVICE" ]]; then
        docker compose logs -f "$SERVICE"
    else
        docker compose logs -f
    fi
}

# ── Estado ─────────────────────────────────────────────────────────────────
cmd_status() {
    docker compose --env-file .env.production ps
    echo ""
    info "Health check del backend:"
    docker compose exec backend curl -s http://localhost:8000/health \
        && echo "" \
        || warn "Backend no responde en /health"
}

# ── Instrucciones de migraciones ──────────────────────────────────────────
cmd_migrations() {
    info "Para aplicar migraciones de Supabase, usa desde tu máquina local:"
    echo ""
    echo "  supabase db push --linked"
    echo ""
    info "O ve al Supabase Dashboard → SQL Editor y ejecuta los archivos de:"
    echo "  supabase/migrations/ (en orden cronológico)"
    echo ""
    info "Migraciones pendientes de aplicar en producción:"
    ls supabase/migrations/*.sql 2>/dev/null | sort | tail -10
}

# ── Reiniciar un servicio ─────────────────────────────────────────────────
cmd_restart() {
    SERVICE="${2:-}"
    [[ -n "$SERVICE" ]] || error "Especifica el servicio: ./deploy.sh restart backend"
    info "Reiniciando $SERVICE..."
    docker compose restart "$SERVICE"
}

# ── Main ───────────────────────────────────────────────────────────────────
COMMAND="${1:-help}"
case "$COMMAND" in
    init)       cmd_init ;;
    update)     cmd_update ;;
    logs)       cmd_logs "$@" ;;
    status)     cmd_status ;;
    migrations) cmd_migrations ;;
    restart)    cmd_restart "$@" ;;
    *)
        echo ""
        echo "  Uso: ./deploy.sh <comando>"
        echo ""
        echo "  init        — Primer deploy completo (build Docker + Traefik SSL automático)"
        echo "  update      — git pull + rebuild + restart con rollback automático"
        echo "  logs        — Logs en tiempo real (./deploy.sh logs backend)"
        echo "  status      — Estado de todos los contenedores"
        echo "  migrations  — Instrucciones para aplicar migraciones de Supabase"
        echo "  restart     — Reiniciar un servicio (./deploy.sh restart backend)"
        echo ""
        ;;
esac
