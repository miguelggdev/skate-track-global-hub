# Guía de despliegue en VPS Ubuntu

Stack desplegado: React (Vite) + FastAPI + Celery + Redis + Nginx + Let's Encrypt

---

## Requisitos previos

- VPS con Ubuntu 22.04 o 24.04 (mínimo 2 GB RAM, 20 GB disco)
- Dominio apuntando a la IP del VPS (registros A para `tudominio.com` y `www.tudominio.com`)
- Acceso SSH con usuario `root` o con `sudo`

---

## Paso 1 — Preparar el VPS (una sola vez)

Conéctate por SSH y ejecuta:

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias base
apt install -y git curl ufw

# Configurar firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Instalar Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Instalar Node.js 20 (para compilar el frontend en el VPS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalaciones
docker --version        # Docker 26.x
docker compose version  # Docker Compose v2.x
node --version          # v20.x
npm --version           # 10.x
```

---

## Paso 2 — Clonar el repositorio

```bash
# En el VPS, elige un directorio (recomendado: /opt/skatetrack)
mkdir -p /opt/skatetrack
cd /opt/skatetrack

git clone https://github.com/miguelggdev/skate-track-global-hub.git .

# Dar permisos al script de deploy
chmod +x deploy.sh
```

---

## Paso 3 — Configurar variables de entorno

```bash
# Copiar la plantilla
cp .env.production.example .env.production

# Editar con tus valores reales
nano .env.production
```

Rellena **todos** los valores del archivo. Los críticos son:

| Variable | Dónde obtenerla |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → service_role key |
| `SUPABASE_JWT_SECRET` | Supabase → Project Settings → API → JWT Secret |
| `VITE_SUPABASE_URL` | Mismo que SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key |
| `DOMAIN` | Tu dominio sin `https://` (ej: `skatetrack.com`) |

> **NUNCA** hagas `git add .env.production`. El archivo ya está en `.gitignore`.

---

## Paso 4 — Verificar DNS antes de continuar

Certbot necesita que el dominio apunte al VPS **antes** de solicitar el certificado:

```bash
# Desde cualquier terminal (también la de tu PC)
nslookup tudominio.com
# Debe responder con la IP de tu VPS

# O con dig:
dig +short tudominio.com
```

Si el DNS no propaga aún, espera y vuelve después. Los cambios de DNS pueden tardar hasta 24 h (normalmente 30-60 min).

---

## Paso 5 — Primer despliegue

```bash
cd /opt/skatetrack
./deploy.sh init
```

Este comando hace todo automáticamente:
1. Instala dependencias npm y compila el frontend (`npm run build`)
2. Sustituye `tudominio.com` por tu dominio real en las configs de Nginx
3. Levanta los contenedores con configuración HTTP temporal
4. Solicita el certificado SSL a Let's Encrypt
5. Activa la configuración HTTPS y reinicia Nginx

Al terminar verás:
```
[INFO] La app está disponible en: https://tudominio.com
```

---

## Paso 6 — Verificar que todo funciona

```bash
./deploy.sh status
```

Debes ver todos los contenedores en estado `Up`:

```
NAME                STATUS          PORTS
skatetrack-nginx-1          Up      0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
skatetrack-backend-1        Up      8000/tcp
skatetrack-celery_worker-1  Up
skatetrack-celery_beat-1    Up
skatetrack-redis-1          Up      6379/tcp
skatetrack-certbot-1        Up
```

Prueba manual:
```bash
# Frontend
curl -I https://tudominio.com
# Debe responder: HTTP/2 200

# Backend API
curl https://tudominio.com/api/health
# Debe responder: {"status":"ok"}
```

---

## Actualizaciones futuras

Cada vez que hay cambios en el repositorio:

```bash
cd /opt/skatetrack
./deploy.sh update
```

Esto hace:
1. `git pull origin master`
2. Recompila el frontend
3. Reconstruye las imágenes Docker del backend
4. Reinicia todos los servicios

---

## Comandos útiles

```bash
# Ver logs en tiempo real
./deploy.sh logs              # todos los servicios
./deploy.sh logs backend      # solo FastAPI
./deploy.sh logs celery_worker
./deploy.sh logs nginx

# Estado de contenedores
./deploy.sh status

# Renovar certificado manualmente (se hace automático cada 12h)
./deploy.sh ssl

# Entrar al contenedor del backend
docker compose exec backend bash

# Reiniciar un servicio específico
docker compose restart nginx
docker compose restart backend

# Ver uso de recursos
docker stats
```

---

## Estructura de contenedores

```
Internet (443/80)
    │
    ▼
nginx:1.27-alpine
    ├── Sirve /dist (frontend React estático)
    ├── Proxy /api/ ──────► backend:8000 (FastAPI/uvicorn)
    └── TLS/SSL (Let's Encrypt)

backend:8000 ──► redis:6379
celery_worker ──► redis:6379
celery_beat ────► redis:6379
certbot (renovación automática SSL cada 12h)
```

---

## Solución de problemas

### Certbot falla con "Connection refused"

El dominio no apunta al VPS todavía. Verifica el DNS:
```bash
dig +short tudominio.com
```
Espera a que propague y vuelve a ejecutar `./deploy.sh ssl`.

### El backend no arranca ("startup crash")

Probablemente faltan variables de entorno:
```bash
./deploy.sh logs backend
```
Busca `ValidationError` o `Missing field`. Edita `.env.production` y reinicia:
```bash
docker compose restart backend celery_worker celery_beat
```

### Nginx devuelve 502 Bad Gateway

El backend no está listo todavía. Espera 15-30 segundos y recarga. Si persiste:
```bash
docker compose ps    # ¿está backend "Up"?
./deploy.sh logs backend
```

### El frontend muestra pantalla en blanco

Las variables `VITE_*` pueden estar mal configuradas. El build se hace con esas variables embebidas en el código. Si cambian, hay que hacer un nuevo build:
```bash
# En el VPS
source .env.production
VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
VITE_BACKEND_URL="https://${DOMAIN}" \
npm run build

docker compose restart nginx
```

### Renovación automática del certificado

Certbot renueva automáticamente cada 12 horas si el certificado expira en menos de 30 días. Para verificar:
```bash
docker compose exec certbot certbot certificates
```

---

## Renovación automática del certificado SSL

Certbot renueva el certificado automáticamente si quedan menos de 30 días de validez. Para garantizar que el proceso se ejecute, añade un cron en el VPS:

```bash
crontab -e

# Añade esta línea (verifica cada domingo a las 03:00):
0 3 * * 0 cd /opt/skatetrack && docker compose run --rm certbot renew --quiet && docker compose restart nginx
```

Para verificar el estado del certificado en cualquier momento:
```bash
docker compose exec certbot certbot certificates
```

---

## Rollback automático

El script `./deploy.sh update` incluye rollback automático: si el build falla o el health check post-deploy no pasa en 60 segundos, restaura automáticamente el commit anterior y reinicia los contenedores. No se requiere intervención manual.

Si necesitas hacer rollback manual a un commit específico:
```bash
git log --oneline -10        # Ver commits recientes
git checkout <SHA> -- .      # Restaurar archivos al commit SHA
docker compose up -d --build # Reiniciar con la versión anterior
```

---

## Cloudflare (opcional pero recomendado)

Poner Cloudflare en frente del VPS toma 30 minutos y añade CDN, protección DDoS y geoblocking sin tocar el servidor.

### Pasos

1. **Crear cuenta gratuita** en [cloudflare.com](https://cloudflare.com) y añadir tu dominio.

2. **Cambiar los nameservers** del dominio a los que Cloudflare te indique (en tu registrador: GoDaddy, Namecheap, etc.).

3. **Configurar registros DNS** en Cloudflare (igual que tenías, pero ahora gestionados desde el panel de CF):
   ```
   A    tudominio.com     → IP del VPS     Proxy: ON (nube naranja)
   A    www.tudominio.com → IP del VPS     Proxy: ON
   ```

4. **SSL/TLS → Full (Strict)** en el panel de Cloudflare (Cloudflare habla HTTPS con el VPS).

5. **Reglas recomendadas:**
   - Page Rule: `tudominio.com/assets/*` → Cache Level: Cache Everything, Edge Cache TTL: 1 month
   - Security → Bot Fight Mode: ON
   - Speed → Auto Minify: JS + CSS + HTML

> **Nota:** Con Cloudflare como proxy, el certificado de Let's Encrypt sigue siendo necesario en el VPS para la conexión Cloudflare ↔ VPS. Certbot sigue funcionando igual.

---

## Variables de entorno — referencia completa

### `.env.production` (backend + build)

| Variable | Requerida | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí | API key de Anthropic para los agentes IA |
| `SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Sí | service_role key (privilegios totales, solo backend) |
| `SUPABASE_JWT_SECRET` | Sí | JWT secret de Supabase (para verificar tokens) |
| `OPENAI_API_KEY` | No | Solo si usas el módulo RAG con embeddings de OpenAI |
| `FRONTEND_URL` | Sí | URL pública del frontend (para CORS) |
| `ENVIRONMENT` | Sí | `production` |
| `REDIS_URL` | Sí | `redis://redis:6379/0` (no cambiar) |
| `VITE_SUPABASE_URL` | Sí | Para el build del frontend |
| `VITE_SUPABASE_ANON_KEY` | Sí | anon key pública de Supabase |
| `VITE_BACKEND_URL` | Sí | `https://tudominio.com` (sin /api) |
| `DOMAIN` | Sí | Dominio sin protocolo (ej: `skatetrack.com`) |
| `CERTBOT_EMAIL` | Sí | Email para notificaciones de expiración Let's Encrypt |
| `RESEND_API_KEY` | Sí | API key de resend.com para envío de emails transaccionales |
| `RESEND_FROM_EMAIL` | No | Remitente de emails (ej: `noreply@tudominio.com`). Debe estar verificado en Resend |
| `SENTRY_DSN` | No | DSN de Sentry para error tracking del backend y Celery |
| `FLOWER_USER` | No | Usuario de acceso a Flower (default: admin) |
| `FLOWER_PASSWORD` | Sí (si usas Flower) | Contraseña de acceso a Flower |
| `TWILIO_ACCOUNT_SID` | No | SID de cuenta Twilio para WhatsApp (AUTO-36) |
| `TWILIO_AUTH_TOKEN` | No | Auth token Twilio |
| `TWILIO_WHATSAPP_FROM` | No | Número WhatsApp aprobado en Twilio (E.164) |
