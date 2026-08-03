#!/usr/bin/env bash
# deploy.sh — Script de despliegue en VPS Ubuntu con Docker Compose
# Uso: ./deploy.sh [init|update|ssl|logs|status]
set -euo pipefail

# ── Colores ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Verificar dependencias ─────────────────────────────────────────────────
check_deps() {
    command -v docker   >/dev/null 2>&1 || error "Docker no está instalado."
    command -v npm      >/dev/null 2>&1 || error "Node/npm no está instalado."
    [[ -f .env.production ]] || error "Archivo .env.production no encontrado. Crea uno a partir de .env.production.example"
}

# ── Cargar variables de entorno ────────────────────────────────────────────
load_env() {
    set -a
    # shellcheck disable=SC1091
    source .env.production
    set +a
    [[ -n "${DOMAIN:-}" ]]              || error "Variable DOMAIN no definida en .env.production"
    [[ -n "${VITE_SUPABASE_URL:-}" ]]   || error "Variable VITE_SUPABASE_URL no definida en .env.production"
    [[ -n "${VITE_SUPABASE_ANON_KEY:-}" ]] || error "Variable VITE_SUPABASE_ANON_KEY no definida en .env.production"
}

# ── Construir frontend ─────────────────────────────────────────────────────
build_frontend() {
    info "Instalando dependencias npm..."
    npm ci --legacy-peer-deps

    info "Construyendo frontend (Vite)..."
    VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
    VITE_BACKEND_URL="https://${DOMAIN}" \
    npm run build

    [[ -d dist ]] || error "El directorio dist/ no se generó. Revisa los errores de npm run build."
    info "Build completado en ./dist/"
}

# ── Generar configs de Nginx desde templates (idempotente) ────────────────
configure_nginx() {
    info "Generando configuración Nginx para dominio: $DOMAIN"
    [[ -f nginx/http.conf.template ]]    || error "nginx/http.conf.template no encontrado."
    [[ -f nginx/default.conf.template ]] || error "nginx/default.conf.template no encontrado."
    sed "s/tudominio\.com/${DOMAIN}/g" nginx/http.conf.template    > nginx/http.conf
    sed "s/tudominio\.com/${DOMAIN}/g" nginx/default.conf.template > nginx/default.conf
}

# ── Primer despliegue ──────────────────────────────────────────────────────
cmd_init() {
    info "=== DESPLIEGUE INICIAL ==="
    check_deps
    load_env

    # Paso 1: Build frontend
    build_frontend

    # Paso 2: Generar configs Nginx con el dominio real
    configure_nginx

    # Paso 3: Usar config HTTP temporal para obtener el certificado
    cp nginx/http.conf nginx/default.conf

    # Paso 4: Levantar contenedores con config HTTP
    info "Levantando contenedores (HTTP temporal)..."
    docker compose up -d --build

    # Paso 5: Esperar a que Nginx esté listo
    info "Esperando a que Nginx esté listo..."
    sleep 5

    # Paso 6: Obtener certificado SSL
    cmd_ssl

    # Paso 7: Restaurar config HTTPS y reiniciar Nginx
    info "Activando configuración HTTPS..."
    sed "s/tudominio\.com/${DOMAIN}/g" nginx/default.conf.template > nginx/default.conf
    docker compose restart nginx

    info "=== Despliegue inicial completado ==="
    info "La app está disponible en: https://${DOMAIN}"
}

# ── Actualización (git pull + rebuild) ────────────────────────────────────
cmd_update() {
    info "=== ACTUALIZACIÓN ==="
    check_deps
    load_env

    info "Actualizando código..."
    git pull origin master

    # Regenerar configs Nginx (necesario por si git pull restauró los templates)
    configure_nginx

    # Rebuild frontend
    build_frontend

    # Rebuild e imágenes Docker del backend
    info "Reconstruyendo imágenes Docker del backend..."
    docker compose build backend celery_worker celery_beat

    # Reiniciar todos los servicios
    info "Reiniciando servicios..."
    docker compose up -d

    info "=== Actualización completada ==="
    docker compose ps
}

# ── Obtener/renovar certificado SSL ───────────────────────────────────────
cmd_ssl() {
    load_env
    CERT_EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
    info "Obteniendo certificado SSL para ${DOMAIN} y www.${DOMAIN}..."
    docker compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "${CERT_EMAIL}" \
        --agree-tos \
        --no-eff-email \
        -d "${DOMAIN}" \
        -d "www.${DOMAIN}" \
        && info "Certificado obtenido correctamente." \
        || warn "No se pudo obtener el certificado. Verifica que el dominio apunte a este VPS."
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
    docker compose ps
    echo ""
    docker compose exec backend curl -s http://localhost:8000/health || warn "Backend no responde"
}

# ── Main ───────────────────────────────────────────────────────────────────
COMMAND="${1:-help}"
case "$COMMAND" in
    init)   cmd_init ;;
    update) cmd_update ;;
    ssl)    cmd_ssl ;;
    logs)   cmd_logs "$@" ;;
    status) cmd_status ;;
    *)
        echo "Uso: ./deploy.sh [init|update|ssl|logs [servicio]|status]"
        echo ""
        echo "  init    — Primer despliegue completo (build + SSL + Docker)"
        echo "  update  — Actualizar código y reiniciar"
        echo "  ssl     — Obtener/renovar certificado Let's Encrypt"
        echo "  logs    — Ver logs (./deploy.sh logs backend)"
        echo "  status  — Estado de los contenedores"
        ;;
esac
