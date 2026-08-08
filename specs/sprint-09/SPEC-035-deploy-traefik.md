# SPEC-035 — Sprint 9: Configuración de Deploy VPS + Traefik

**Sprint:** 09  
**Agente:** AG-CLAUDE-BACKEND + AG-CLAUDE-FRONTEND  
**Status:** `done`
**Fecha:** 2026-08-05  

---

## 1. Propósito

Configurar el deploy de producción en VPS Ubuntu con Traefik (ya corriendo como proxy inverso para otras apps del mismo servidor). Reemplaza la arquitectura anterior de Nginx directo + Certbot.

---

## 2. Decisiones de Arquitectura

| Decisión | Justificación |
|----------|---------------|
| **Traefik** como proxy inverso | Ya corre en el VPS y gestiona otros dominios; comparte certificados Let's Encrypt |
| **Red externa `supabase2_net`** | Red que usa Traefik para descubrir contenedores; se comparte con Supabase self-hosted |
| **Red interna `app_net`** | Aísla backend, Redis y workers del acceso externo |
| **Multi-stage Docker** para frontend | Node 20 build → nginx:1.27-alpine serve; imagen final ~50MB |
| **`VITE_BACKEND_URL=""`** | Frontend usa URLs relativas `/api/...`; nginx proxy `/api/` → `http://backend:8000/api/`; evita hardcodear el dominio en el bundle JS |
| **`proxy_buffering off`** en nginx | SSE (Server-Sent Events) de agentes IA llega token a token al browser sin esperar buffers |
| **`leresolver`** para SSL | Resolver de Traefik ya configurado en el VPS; no se necesita certbot |

---

## 3. Archivos Creados

### `Dockerfile` (raíz del proyecto)

```dockerfile
# Stage 1 — Build (Node 20)
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_BACKEND_URL=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_BACKEND_URL=$VITE_BACKEND_URL
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build
RUN echo "ok" > /app/dist/health.txt

# Stage 2 — Serve (nginx)
FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### `nginx/default.conf`

Configuraciones clave:
- `gzip` en assets JS/CSS/SVG/WASM
- Cache `1y immutable` en assets con hash (Vite)
- `/api/` → `http://backend:8000/api/` con `proxy_buffering off` para SSE
- `client_max_body_size 50M` para upload de documentos RAG
- SPA fallback: `try_files $uri $uri/ /index.html`

### `docker-compose.yml`

Servicios:
| Servicio | Red(es) | Imagen |
|----------|---------|--------|
| `frontend` | `supabase2_net` + `app_net` | Multi-stage build |
| `redis` | `app_net` | `redis:7-alpine` con `requirepass` |
| `backend` | `app_net` | `skatetrack-backend:latest` (build desde `./backend/`) |
| `celery_worker` | `app_net` | `skatetrack-backend:latest` (reutiliza imagen) |
| `celery_beat` | `app_net` | `skatetrack-backend:latest` (schedule persistido en volumen) |
| `flower` | `supabase2_net` + `app_net` | `skatetrack-backend:latest` con `--url_prefix=flower` |

Labels Traefik en `frontend`:
```yaml
traefik.http.routers.skatetrack.rule=Host(`${DOMAIN}`)
traefik.http.routers.skatetrack.entrypoints=websecure
traefik.http.routers.skatetrack.tls.certresolver=leresolver
```

### `deploy.sh`

Script Bash con comandos:
- `init` — primer deploy; verifica red Traefik, build Docker, health check 90s
- `update` — git pull + rebuild + rollback automático si health check falla
- `logs [servicio]` — `docker compose logs -f`
- `status` — `docker compose ps` + health check
- `migrations` — instrucciones para aplicar migraciones Supabase
- `restart <servicio>` — reiniciar un contenedor

### `.env.production.example`

Plantilla completa con todas las variables requeridas y comentarios sobre dónde obtener cada una.

### `docs/DEPLOY_VPS.md`

Guía paso a paso para el operador humano:
1. Prerrequisitos (Docker, Traefik, DNS)
2. Clonar repo
3. Configurar `.env.production`
4. Verificar DNS
5. Aplicar migraciones Supabase
6. `./deploy.sh init`
7. Post-deploy checklist
8. Comandos útiles
9. Troubleshooting
10. Variables de entorno — referencia completa

---

## 4. Flujo de request en producción

```
Usuario (browser)
    → HTTPS skatetrack.tudominio.com
    → Traefik (supabase2_net) [TLS termination]
    → frontend:80 (nginx)
        ├── /                   → /usr/share/nginx/html/index.html (SPA)
        ├── /assets/*           → archivos estáticos con cache 1y
        └── /api/*              → http://backend:8000/api/* (proxy)
                                    → FastAPI (agentes IA, automatizaciones)
                                    → Supabase (PostgreSQL)
                                    → Redis (Celery broker)
```

---

## 5. Smoke Tests post-deploy

```bash
# 1. Frontend carga
curl -sI https://skatetrack.tudominio.com | grep "HTTP/2 200"

# 2. Backend responde
curl -s https://skatetrack.tudominio.com/api/health
# → {"status":"ok"}

# 3. SPA routing funciona
curl -sI https://skatetrack.tudominio.com/athletes | grep "HTTP/2 200"

# 4. Celery workers están procesando
curl https://flower.skatetrack.tudominio.com/flower/api/workers

# 5. Sin errores de RLS en Supabase
# Supabase Dashboard → Logs → buscar PGRST301
```
