# Guía de despliegue — VPS Ubuntu + Traefik

Stack: React (Vite multi-stage Docker) + FastAPI + Celery + Redis + Traefik (SSL automático)

---

## Arquitectura de red

```
Internet (443/80)
    │
    ▼
Traefik (ya corre en el VPS, red: supabase2_net)
    ├── skate.arkanatech.tech   ──► frontend:80  (nginx SPA + proxy /api/)
    ├── api.arkanatech.tech     ──► backend:8000 (FastAPI, recibe webhooks Supabase)
    └── flower.arkanatech.tech  ──► flower:5555  (Celery monitor)

frontend:80 → http://backend:8000/api/ (red interna app_net)
backend:8000 → redis:6379 (app_net)
celery_worker + celery_beat → redis:6379 (app_net)
```

**Importante:** Traefik gestiona los certificados SSL automáticamente con Let's Encrypt (`leresolver`). No se necesita certbot.

---

## Prerrequisitos

| Requisito | Detalle |
|-----------|---------|
| VPS | Ubuntu 22.04/24.04 — mínimo 2 GB RAM, 20 GB disco |
| Docker + Compose v2 | `docker compose version` debe funcionar |
| Traefik corriendo | Con red externa `supabase2_net` y resolver `leresolver` |
| DNS en Hostinger | Registros `A` creados (ver Paso 0) |
| Dominio verificado en Resend | `noreply@arkanatech.tech` verificado para emails |

---

## Paso 0 — Crear registros DNS en Hostinger ⚠️ MANUAL

Entra a Hostinger → Domains → arkanatech.tech → DNS / Nameservers → Manage DNS.

Crea estos registros **tipo A** apuntando a la IP de tu VPS:

| Nombre (Host) | Tipo | Valor | TTL |
|---------------|------|-------|-----|
| `skate` | A | `<IP_DEL_VPS>` | 3600 |
| `api` | A | `<IP_DEL_VPS>` | 3600 |
| `flower` | A | `<IP_DEL_VPS>` | 3600 |

Resultado esperado:
- `skate.arkanatech.tech` → frontend React (login, dashboards)
- `api.arkanatech.tech` → FastAPI (agentes IA + webhooks Supabase)
- `flower.arkanatech.tech` → Monitor Celery (protegido con usuario/clave)

Verifica propagación (puede tardar 10–60 min) antes de continuar:
```bash
dig +short skate.arkanatech.tech
dig +short api.arkanatech.tech
# Ambos deben devolver la IP del VPS
```

---

## Paso 1 — Clonar el repositorio en el VPS

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
| `DOMAIN` | `skate.arkanatech.tech` |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → `service_role` key |
| `SUPABASE_JWT_SECRET` | Supabase → Project Settings → API → JWT Settings |
| `VITE_SUPABASE_URL` | Igual que `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` key |
| `REDIS_PASSWORD` | Genera: `openssl rand -base64 24` |
| `WEBHOOK_SECRET` | Genera: `openssl rand -hex 32` (guárdalo, lo usarás en Supabase) |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Dirección verificada en Resend |
| `FLOWER_USER` / `FLOWER_PASSWORD` | Credenciales para el panel Celery |

> `VITE_BACKEND_URL` se deja **vacío** — el frontend usa rutas relativas `/api/...` y nginx hace el proxy.  
> `TWILIO_*` puede dejarse vacío si no tienes cuenta aún — el worker no crashea, solo omite AUTO-36.  
> **NUNCA** hagas `git add .env.production`. Ya está en `.gitignore`.

---

## Paso 3 — Verificar DNS antes de levantar

Traefik solicitará el certificado SSL al arrancar. Si el DNS no resuelve, el certificado no se genera.

```bash
dig +short skate.arkanatech.tech   # → IP del VPS
dig +short api.arkanatech.tech     # → IP del VPS
dig +short flower.arkanatech.tech  # → IP del VPS
```

Si alguno no responde, espera la propagación del DNS y vuelve.

---

## Paso 4 — Aplicar migraciones de Supabase ⚠️ MANUAL (una sola vez)

Las migraciones se aplican **desde tu PC local**, no desde el VPS:

```bash
# Desde tu PC (con Supabase CLI instalado)
supabase link --project-ref <project-ref>
supabase db push
```

O manualmente en **Supabase Dashboard → SQL Editor**, ejecutando los archivos de `supabase/migrations/` en orden cronológico (más antiguo primero).

Verifica que todas las migraciones aparecen en Supabase → Database → Migrations antes de continuar.

---

## Paso 5 — Primer despliegue

```bash
cd /opt/skatetrack
./deploy.sh init
```

Esto:
1. Verifica Docker, `.env.production` y la red `supabase2_net`
2. Construye las imágenes (frontend multi-stage + backend Python)
3. Levanta: `frontend`, `backend`, `celery_worker`, `celery_beat`, `flower`, `redis`
4. Espera hasta 90 s a que el backend responda en `/health`

Traefik detecta los labels y genera los certificados SSL (1–2 min tras arrancar).

---

## Paso 6 — Configurar Supabase Database Webhooks ⚠️ MANUAL (una sola vez)

Los webhooks conectan eventos de la base de datos con las automatizaciones Celery event-driven.

**Dónde configurar:** Supabase Dashboard → Database → Webhooks → Create a new hook

Para cada fila de la tabla siguiente, crea un webhook:

| Nombre del hook | Tabla | Eventos | URL del endpoint |
|-----------------|-------|---------|-----------------|
| `hook_attendance_change` | `training_attendance` | INSERT, UPDATE | `https://api.arkanatech.tech/api/webhooks/attendance-change` |
| `hook_payment_received` | `financial_transactions` | INSERT | `https://api.arkanatech.tech/api/webhooks/payment-received` |
| `hook_competition_result` | `competition_results` | INSERT | `https://api.arkanatech.tech/api/webhooks/competition-result` |
| `hook_medical_session` | `medical_sessions` | INSERT | `https://api.arkanatech.tech/api/webhooks/medical-session` |
| `hook_new_athlete` | `athletes` | INSERT | `https://api.arkanatech.tech/api/webhooks/new-athlete` |

**En cada webhook, añadir el header HTTP:**

```
Header name:  X-Webhook-Secret
Header value: <el valor de WEBHOOK_SECRET que pusiste en .env.production>
```

### Qué automatización activa cada webhook

| Hook | Celery task | Descripción |
|------|-------------|-------------|
| `attendance-change` | AUTO-04 `handle_absence` | Notifica al coach cuando un atleta falta |
| `payment-received` | AUTO-07 `generate_payment_receipt` | Genera y envía recibo de pago |
| `competition-result` | AUTO-12 `post_competition_followup` | Seguimiento post-competencia |
| `competition-result` (pos ≤ 3) | AUTO-24 `request_testimonial` (+24 h) | Solicita testimonio al top-3 |
| `medical-session` (lesión) | AUTO-14 `injury_protocol` | Activa protocolo de lesión |
| `new-athlete` | AUTO-20 `new_athlete_documents` | Genera docs de bienvenida |

---

## Paso 7 — Verificar que todo funciona

```bash
./deploy.sh status
```

Todos los contenedores deben estar `Up`:
```
NAME                       STATUS
skatetrack-frontend-1      Up
skatetrack-backend-1       Up
skatetrack-celery_worker-1 Up
skatetrack-celery_beat-1   Up
skatetrack-flower-1        Up
skatetrack-redis-1         Up
```

Pruebas manuales:
```bash
# Frontend
curl -I https://skate.arkanatech.tech
# → HTTP/2 200

# Backend health
curl https://skate.arkanatech.tech/api/health
# → {"status":"ok"}

# Webhook (prueba rápida — debe dar 401 si el secreto falta)
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://api.arkanatech.tech/api/webhooks/new-athlete \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"athletes","record":{"id":"test"}}'
# → 401 (correcto — no llevó el header secreto)

# Webhook con secreto correcto
curl -s -X POST https://api.arkanatech.tech/api/webhooks/new-athlete \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: <TU_WEBHOOK_SECRET>" \
  -d '{"type":"INSERT","table":"athletes","record":{"id":"00000000-0000-0000-0000-000000000001"}}'
# → {"queued":true}

# Panel Celery
# Abre: https://flower.arkanatech.tech/flower
```

---

## Actualizaciones futuras

```bash
cd /opt/skatetrack
./deploy.sh update
```

El script hace:
1. `git pull origin master`
2. Reconstruye imágenes Docker
3. Reinicia servicios
4. Verifica health check (90 s)
5. Si algo falla → rollback automático al commit anterior

---

## Comandos útiles

```bash
# Logs en tiempo real
./deploy.sh logs                  # todos los servicios
./deploy.sh logs backend          # solo FastAPI
./deploy.sh logs celery_worker    # solo worker Celery
./deploy.sh logs celery_beat      # solo Beat (schedules)

# Reiniciar un servicio específico
./deploy.sh restart backend
./deploy.sh restart celery_worker

# Ver tareas Celery activas
docker compose exec celery_worker celery -A tasks.celery_app inspect active

# Forzar ejecución manual de una automatización
docker compose exec celery_worker celery -A tasks.celery_app call tasks.billing.generate_monthly_fees

# Entrar al contenedor del backend
docker compose exec backend bash

# Ver uso de recursos
docker stats

# Escalar workers si hay carga alta
docker compose --env-file .env.production up -d --scale celery_worker=2
```

---

## Variables de entorno — referencia completa

| Variable | Req | Descripción |
|----------|-----|-------------|
| `DOMAIN` | Sí | `skate.arkanatech.tech` (sin `https://`) |
| `ANTHROPIC_API_KEY` | Sí | Agentes IA (LangGraph) |
| `SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Sí | `service_role` key — solo backend |
| `SUPABASE_JWT_SECRET` | Sí | Para verificar tokens JWT |
| `VITE_SUPABASE_URL` | Sí | URL Supabase en el bundle JS |
| `VITE_SUPABASE_ANON_KEY` | Sí | `anon` key en el bundle JS |
| `VITE_BACKEND_URL` | — | Dejar **vacío** (proxy nginx interno) |
| `REDIS_PASSWORD` | Sí | Contraseña interna Redis |
| `FRONTEND_URL` | Sí | `https://skate.arkanatech.tech` (CORS) |
| `ENVIRONMENT` | Sí | `production` |
| `WEBHOOK_SECRET` | Sí | Secreto compartido con Supabase Webhooks |
| `RESEND_API_KEY` | Sí | Para emails de facturas y recordatorios |
| `RESEND_FROM_EMAIL` | Sí | Remitente verificado en Resend |
| `OPENAI_API_KEY` | No | Solo si usas el módulo RAG con embeddings |
| `SENTRY_DSN` | No | Error tracking (Sentry) |
| `FLOWER_USER` | No | Usuario panel Flower (default: `admin`) |
| `FLOWER_PASSWORD` | Sí* | *Requerido si expones Flower públicamente |
| `TWILIO_ACCOUNT_SID` | No | WhatsApp motivacional (AUTO-36) — omitir si no tienes aún |
| `TWILIO_AUTH_TOKEN` | No | Auth token Twilio |
| `TWILIO_WHATSAPP_FROM` | No | Número WhatsApp aprobado en E.164 |

---

## Estructura de red y contenedores

```
supabase2_net (externa — Traefik la gestiona)
├── frontend   — nginx: sirve SPA + proxy /api/ → backend
└── flower     — Monitor Celery

app_net (interna — solo esta app)
├── backend        — FastAPI + LangGraph + endpoints webhook
├── celery_worker  — Ejecuta las 37 automatizaciones
├── celery_beat    — Scheduler de tareas periódicas
└── redis          — Broker Celery (contraseña, volumen persistente)
```

---

## Solución de problemas

### El frontend devuelve 502 Bad Gateway
El backend aún no está listo. Espera 30 s y recarga.  
Si persiste: `./deploy.sh logs backend` — busca `ValidationError` (falta variable de entorno).

### Traefik no genera el certificado SSL
- DNS debe resolver antes de arrancar los contenedores
- Verifica: `dig +short skate.arkanatech.tech` → IP del VPS
- Logs: `docker logs traefik 2>&1 | grep -i "skate\|acme\|error"`

### Los webhooks Supabase devuelven 503
`WEBHOOK_SECRET` no está en el `.env.production`. Añádelo y reinicia:
```bash
./deploy.sh restart backend
```

### Los webhooks Supabase devuelven 401
El valor de `X-Webhook-Secret` en el Dashboard de Supabase no coincide con `WEBHOOK_SECRET` en `.env.production`. Corrige el header en Supabase → Database → Webhooks.

### El backend no arranca
```bash
./deploy.sh logs backend
# "pydantic_settings ValidationError" → falta variable en .env.production
# "Connection refused"               → Redis no listo, espera 10 s y reinicia backend
```

### Celery worker no procesa tareas
```bash
./deploy.sh logs celery_worker
docker compose exec celery_worker celery -A tasks.celery_app inspect ping
```

### Frontend carga en blanco
Las variables `VITE_*` se bakearon incorrectamente. Verifica `.env.production` y:
```bash
./deploy.sh update
```

---

## Post-deploy checklist

### Infraestructura
- [ ] DNS: `skate.arkanatech.tech`, `api.arkanatech.tech`, `flower.arkanatech.tech` → IP del VPS
- [ ] `https://skate.arkanatech.tech` carga la pantalla de login (SSL válido)
- [ ] `https://skate.arkanatech.tech/api/health` devuelve `{"status":"ok"}`
- [ ] Panel Flower: `https://flower.arkanatech.tech/flower` accesible con usuario/clave
- [ ] Todos los contenedores `Up`: `./deploy.sh status`

### Aplicación
- [ ] Login con admin funciona → llega al dashboard
- [ ] Módulo Atletas muestra datos (RLS activo)
- [ ] Tab Facturación en Finance aparece
- [ ] Chat con Agente IA responde (necesita `ANTHROPIC_API_KEY`)
- [ ] Supabase Dashboard → Logs → sin errores `PGRST301` (RLS bloqueando algo inesperado)

### Automatizaciones
- [ ] 5 webhooks creados en Supabase Dashboard → Database → Webhooks (ver Paso 6)
- [ ] Prueba de webhook con `curl` devuelve `{"queued":true}` (ver Paso 7)
- [ ] En Flower: la tarea `tasks.health_check` aparece en el historial (Beat funcionando)
- [ ] Esperar el día 1 del mes para verificar AUTO-36 (generación de facturas)

### Email
- [ ] Enviar email de prueba: `docker compose exec backend python -c "from tasks.helpers import send_email; send_email('tu@email.com', 'Test', '<p>OK</p>')"`

---

## Renovación automática del certificado

Traefik renueva automáticamente. Sin cron adicional. Para verificar expiración:
```bash
echo | openssl s_client -connect skate.arkanatech.tech:443 \
  -servername skate.arkanatech.tech 2>/dev/null \
  | openssl x509 -noout -dates
```

---

## Qué falta antes de considerar el proyecto completamente terminado

### Alta prioridad — acción manual requerida
| Tarea | Cómo hacerlo |
|-------|-------------|
| **Crear usuarios E2E** | Ejecutar `node scripts/seed-e2e-users.mjs` desde tu PC (necesita `SUPABASE_SERVICE_KEY` en `.env.local`). El script crea admin/coach/parent y te imprime las vars `E2E_*` para el CI. |
| **Verificar dominio en Resend** | Ir a resend.com → Domains → añadir `arkanatech.tech` y seguir los pasos DNS. Sin esto los emails de facturas van a spam o rebotan. |

### Implementado recientemente (Sprint 12)
| Tarea | Estado |
|-------|--------|
| PDF adjunto en facturas — `reportlab` genera PDF profesional y va adjunto en el email | ✅ |
| RAG UI — `/knowledge-base` para subir PDF/TXT y que los agentes los consulten | ✅ |
| RAG backend — `POST /api/rag/upload` + `DELETE /api/rag/documents/{id}` | ✅ |
| Twilio gracioso — el worker no crashea si no hay credenciales | ✅ |
| Webhooks event-driven — 5 endpoints Supabase → Celery | ✅ |

### Pendiente
| Tarea | Descripción |
|-------|-------------|
| 3 agentes IA | AG-08 Seguridad, AG-11 Operaciones, AG-12 Legal (10 de 13 implementados) |
| Twilio | Cuando tengas cuenta añadir `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` — el código ya está listo |
| `CreateTrainingDialog` → Zod | Único formulario sin validación Zod |
| Sentry | Opcional — tracking de errores en producción |
