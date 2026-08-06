# Guía de despliegue — VPS Ubuntu + Traefik

Stack: React (Vite multi-stage Docker) + FastAPI + Celery + Redis + Traefik (SSL automático)

---

## Arquitectura de red

```
Internet (443/80)
    │
    ▼
Traefik (ya corre en el VPS, red: supabase2_net)
    ├── skatetrack.tudominio.com ──► frontend:80 (nginx, SPA + proxy /api/)
    └── flower.skatetrack.tudominio.com ──► flower:5555 (Celery monitor)

frontend:80 → http://backend:8000/api/ (red interna app_net)
backend:8000 → redis:6379 (app_net)
celery_worker → redis:6379 (app_net)
celery_beat ──► redis:6379 (app_net)
```

**Importante:** Traefik gestiona los certificados SSL automáticamente con Let's Encrypt (`leresolver`). No se necesita certbot.

---

## Prerrequisitos

| Requisito | Detalle |
|-----------|---------|
| VPS | Ubuntu 22.04/24.04 — mínimo 2 GB RAM, 20 GB disco |
| Docker + Compose v2 | `docker compose version` debe funcionar |
| Traefik corriendo | Con red externa `supabase2_net` y resolver `leresolver` |
| DNS | Registro `A` de `skatetrack.tudominio.com` → IP del VPS |
| Dominio en Resend | `noreply@tudominio.com` verificado (para emails) |

Para verificar que Traefik y la red existen:
```bash
docker network inspect supabase2_net   # debe devolver info de la red
docker ps | grep traefik               # debe mostrar traefik corriendo
```

---

## Paso 1 — Clonar el repositorio

```bash
mkdir -p /opt/skatetrack
cd /opt/skatetrack
git clone https://github.com/miguelggdev/skate-track-global-hub.git .
chmod +x deploy.sh
```

---

## Paso 2 — Configurar variables de entorno

```bash
cp .env.production.example .env.production
nano .env.production
```

Rellena **todos** los valores. Los críticos:

| Variable | Dónde obtenerla |
|----------|-----------------|
| `DOMAIN` | Tu dominio sin `https://` — ej: `skatetrack.tudominio.com` |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → `service_role` key |
| `SUPABASE_JWT_SECRET` | Supabase → Project Settings → API → JWT Secret |
| `VITE_SUPABASE_URL` | Igual que `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` key |
| `REDIS_PASSWORD` | Genera una clave fuerte: `openssl rand -base64 24` |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Dirección verificada en Resend |
| `FLOWER_USER` / `FLOWER_PASSWORD` | Credenciales para el panel Celery |

> `VITE_BACKEND_URL` se deja **vacío** — el frontend usa URLs relativas `/api/...` y nginx hace el proxy interno.  
> **NUNCA** hagas `git add .env.production`. Ya está en `.gitignore`.

---

## Paso 3 — Verificar DNS

El dominio debe apuntar al VPS **antes** de levantar (Traefik solicitará el certificado al arrancar):

```bash
dig +short skatetrack.tudominio.com
# Debe responder con la IP del VPS
```

Si el DNS aún no propaga, espera 30-60 minutos y vuelve.

---

## Paso 4 — Aplicar migraciones de Supabase

Las migraciones se aplican **una sola vez** desde tu máquina local (no en el VPS):

```bash
# Desde tu PC (con supabase CLI instalado)
supabase link --project-ref <project-ref>
supabase db push
```

O directamente en el **SQL Editor** del dashboard de Supabase, ejecutando los archivos de `supabase/migrations/` en orden cronológico.

Verifica que todas las migraciones están aplicadas antes de continuar.

---

## Paso 5 — Primer despliegue

```bash
cd /opt/skatetrack
./deploy.sh init
```

Esto hace:
1. Verifica que Docker, `.env.production` y la red `supabase2_net` existen
2. Construye las imágenes Docker (frontend multi-stage + backend Python)
3. Levanta todos los servicios (`frontend`, `backend`, `celery_worker`, `celery_beat`, `flower`, `redis`)
4. Espera hasta 90s a que el backend responda en `/health`

Traefik detecta los labels del contenedor y genera el certificado SSL automáticamente (1-2 min después de que arranque).

---

## Paso 6 — Verificar que todo funciona

```bash
./deploy.sh status
```

Debes ver todos los contenedores `Up`:
```
NAME                       STATUS    PORTS
skatetrack-frontend-1      Up        80/tcp
skatetrack-backend-1       Up        8000/tcp
skatetrack-celery_worker-1 Up
skatetrack-celery_beat-1   Up
skatetrack-flower-1        Up        5555/tcp
skatetrack-redis-1         Up        6379/tcp
```

Pruebas manuales:
```bash
# Frontend (espera 2 min para el certificado)
curl -I https://skatetrack.tudominio.com
# → HTTP/2 200

# Backend health check
curl https://skatetrack.tudominio.com/api/health
# → {"status":"ok"}

# Panel Celery (si configuraste Flower)
# Abre en el navegador: https://flower.skatetrack.tudominio.com/flower
```

---

## Actualizaciones futuras

Cada vez que hay nuevos commits en `master`:

```bash
cd /opt/skatetrack
./deploy.sh update
```

El script hace:
1. `git pull origin master`
2. Reconstruye las imágenes Docker
3. Reinicia todos los servicios
4. Verifica health check del backend (90s)
5. Si algo falla, **rollback automático** al commit anterior

---

## Comandos útiles

```bash
# Logs en tiempo real
./deploy.sh logs                  # todos los servicios
./deploy.sh logs backend          # solo FastAPI
./deploy.sh logs celery_worker    # solo worker Celery
./deploy.sh logs frontend         # solo nginx

# Estado de contenedores
./deploy.sh status

# Reiniciar un servicio específico
./deploy.sh restart backend
./deploy.sh restart celery_worker

# Ver migraciones pendientes
./deploy.sh migrations

# Entrar al contenedor del backend
docker compose exec backend bash

# Ver uso de recursos
docker stats

# Escalar workers Celery (si hay carga alta)
docker compose --env-file .env.production up -d --scale celery_worker=2
```

---

## Estructura de red y contenedores

```
supabase2_net (externa, Traefik)
├── frontend          — nginx, sirve SPA + proxy /api/ → backend
└── flower            — Celery monitor

app_net (interna, solo esta app)
├── backend           — FastAPI + LangGraph agentes IA
├── celery_worker     — Ejecuta las 37 automatizaciones
├── celery_beat       — Scheduler de tareas periódicas
└── redis             — Broker Celery + caché
```

---

## Variables de entorno — referencia completa

| Variable | Req | Descripción |
|----------|-----|-------------|
| `DOMAIN` | Sí | Dominio sin `https://` (ej: `skatetrack.tudominio.com`) |
| `ANTHROPIC_API_KEY` | Sí | Agentes IA (LangGraph) |
| `SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Sí | `service_role` key — solo backend, nunca frontend |
| `SUPABASE_JWT_SECRET` | Sí | Para verificar tokens JWT en FastAPI |
| `VITE_SUPABASE_URL` | Sí | URL Supabase bakeada en el bundle JS |
| `VITE_SUPABASE_ANON_KEY` | Sí | `anon` key bakeada en el bundle JS |
| `VITE_BACKEND_URL` | — | Dejar **vacío** — el docker-compose ya lo fuerza a `""` |
| `REDIS_PASSWORD` | Sí | Contraseña interna de Redis |
| `FRONTEND_URL` | Sí | `https://${DOMAIN}` — para CORS del backend |
| `ENVIRONMENT` | Sí | `production` |
| `RESEND_API_KEY` | Sí | Para facturas y recordatorios por email |
| `RESEND_FROM_EMAIL` | Sí | Remitente verificado en Resend |
| `OPENAI_API_KEY` | No | Solo si usas el módulo RAG con embeddings |
| `SENTRY_DSN` | No | Error tracking del backend |
| `FLOWER_USER` | No | Usuario Flower (default: `admin`) |
| `FLOWER_PASSWORD` | Sí* | Contraseña Flower (*si expones Flower públicamente) |
| `TWILIO_ACCOUNT_SID` | No | WhatsApp motivacional (AUTO-36) |
| `TWILIO_AUTH_TOKEN` | No | Auth token Twilio |
| `TWILIO_WHATSAPP_FROM` | No | Número WhatsApp aprobado (E.164) |

---

## Solución de problemas

### El frontend devuelve 502 Bad Gateway
El backend aún no está listo. Espera 30 segundos y recarga.
Si persiste: `./deploy.sh logs backend` — busca `ValidationError` o falta de variables.

### Traefik no asigna el certificado SSL
- Verifica que el DNS apunta al VPS: `dig +short skatetrack.tudominio.com`
- El dominio debe resolver antes de que arranquen los contenedores
- Revisa logs de Traefik: `docker logs traefik 2>&1 | grep -i "skatetrack\|acme\|error"`

### El backend no arranca (crash al inicio)
```bash
./deploy.sh logs backend
# Busca: "pydantic_settings ValidationError" → falta variable en .env.production
# Busca: "Connection refused" → Redis no está listo aún (espera 10s y reinicia)
```

### Celery worker no procesa tareas
```bash
./deploy.sh logs celery_worker
# Busca errores de importación de módulos o conexión a Redis
docker compose exec celery_worker celery -A tasks.celery_app inspect ping
```

### Frontend carga en blanco
Las variables `VITE_*` se bakearon incorrectamente en el build. Verifica que `.env.production` tiene los valores correctos y reconstruye:
```bash
./deploy.sh update
```

### Ver el certificado SSL actual
```bash
docker compose exec backend curl -sI https://skatetrack.tudominio.com | grep -i "server\|strict"
```

---

## Post-deploy checklist

- [ ] `https://skatetrack.tudominio.com` carga la pantalla de login
- [ ] Login con admin funciona, llega al dashboard
- [ ] `/api/health` responde `{"status":"ok"}`  
- [ ] Módulo Atletas muestra datos
- [ ] Tab Facturación en Finance aparece (si hay facturas generadas)
- [ ] Panel Flower: `https://flower.skatetrack.tudominio.com/flower`
- [ ] Supabase Dashboard → Logs → no hay errores PGRST301 (RLS)
- [ ] Enviar un email de prueba desde el backend (o esperar al 1° del mes para AUTO-36)

---

## Renovación automática del certificado

Traefik renueva el certificado automáticamente antes de su expiración. No se requiere ningún cron adicional.

Para verificar la fecha de expiración del certificado:
```bash
echo | openssl s_client -connect skatetrack.tudominio.com:443 -servername skatetrack.tudominio.com 2>/dev/null \
    | openssl x509 -noout -dates
```
