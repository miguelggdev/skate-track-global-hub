# Smoke Tests Post-Deploy — SpeedSkateTrack Hub

Ejecutar manualmente después de cada deploy a producción.
Marcar cada ítem con ✅ o ❌ + nota.

**Hosts (arkanatech.tech):**
| Subdominio | Servicio |
|------------|----------|
| `speedskatetrack.` | Landing (GitHub Pages) |
| `track.` | App / plataforma (todas las rutas `/login`, `/athletes`, … van aquí) |
| `stride.` | Backend / API + webhooks |
| `split.` | Monitor Celery (Flower, basic-auth) |

> Las secciones 1-10 (UI) se ejecutan en el navegador sobre `https://track.arkanatech.tech`.
> Las secciones 0 y 0b se ejecutan por `curl`/terminal contra el VPS.

---

## 0. Infraestructura y SSL (curl — primero)

> **Atajo:** `bash scripts/smoke.sh` ejecuta las secciones 0 y 0b automáticamente y
> devuelve un resumen ✅/❌ (las pruebas con efectos —webhook con escritura y email—
> son opt-in: `RUN_WEBHOOK_WRITE=1`, `RUN_EMAIL=1 SMOKE_EMAIL=tu@correo`).

```bash
# Contenedores arriba (6 servicios)
./deploy.sh status

# SSL + respuesta de cada host
curl -sI https://track.arkanatech.tech         | head -1   # → HTTP/2 200
curl -s  https://track.arkanatech.tech/api/health           # → {"status":"ok"} (proxy)
curl -s  https://stride.arkanatech.tech/health              # → {"status":"ok"} (directo)
curl -sI https://split.arkanatech.tech/flower  | head -1    # → 401 (basic-auth, correcto)
curl -sI https://speedskatetrack.arkanatech.tech | head -1  # → 200/301 (landing)

# Certificado emitido por Let's Encrypt (no self-signed)
echo | openssl s_client -connect track.arkanatech.tech:443 \
  -servername track.arkanatech.tech 2>/dev/null | openssl x509 -noout -issuer -dates
```

- [ ] `./deploy.sh status` → 6 contenedores `Up` (frontend, backend, celery_worker, celery_beat, flower, redis)
- [ ] `track.` responde 200 y sirve la app
- [ ] Health directo (`stride./health`) y vía proxy (`track./api/health`) → `{"status":"ok"}`
- [ ] `split./flower` pide usuario/clave (401 sin credenciales)
- [ ] Certificados SSL válidos (issuer Let's Encrypt) en `track.`, `stride.`, `split.`
- [ ] Landing (`speedskatetrack.`) carga

## 0b. Backend, agentes e integraciones

```bash
# Webhook SIN secreto → 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://stride.arkanatech.tech/api/webhooks/new-athlete \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"athletes","record":{"id":"test"}}'   # → 401

# Webhook CON secreto → {"queued":true}
curl -s -X POST https://stride.arkanatech.tech/api/webhooks/new-athlete \
  -H "Content-Type: application/json" -H "X-Webhook-Secret: <TU_WEBHOOK_SECRET>" \
  -d '{"type":"INSERT","table":"athletes","record":{"id":"00000000-0000-0000-0000-000000000001"}}'

# Email (Resend) — debe llegar el correo (revisa spam)
docker compose --env-file .env.production exec backend \
  python -c "from tasks.helpers import send_email; send_email('TU_CORREO','Smoke test','<p>OK</p>')"
```

- [ ] Webhook sin `X-Webhook-Secret` → **401**; con el secreto correcto → **`{"queued":true}`**
- [ ] En **Flower** (`split./flower`): al menos un worker `celery@…` **Online** y `celery_beat` programando (aparece la tarea periódica `health_check`)
- [ ] Webhook end-to-end: insertar un atleta de prueba en Supabase → en Flower se encola **AUTO-20** (`new_athlete_documents`); confirmar con `./deploy.sh logs backend | grep AUTO-`
- [ ] Email de prueba (Resend) llega a la bandeja
- [ ] **Chat de agente IA** (desde la UI, sección 2): responde en streaming — valida `ANTHROPIC_API_KEY` y la conexión FastAPI↔Anthropic
- [ ] **RAG**: en `/knowledge-base` (admin) subir un PDF pequeño → `chunks_indexed > 0`; luego preguntar al widget RAG y que cite el documento
- [ ] **Panel de automatizaciones** `/automatizaciones` (admin/leader): lista las 37, y al alternar `enabled` el cambio persiste al recargar

---

## 1. Autenticación

- [ ] `/login` carga sin errores de consola
- [ ] Login con credencial admin exitoso → redirecciona a `/admin-dashboard`
- [ ] Login con credencial coach → redirecciona a `/coach-dashboard`
- [ ] Login con credencial parent → redirecciona a `/parent-dashboard`
- [ ] Login con credencial incorrecta → muestra error (no 500)
- [ ] Logout limpia la sesión y redirecciona a `/login`
- [ ] Ruta protegida sin sesión `/admin-dashboard` → redirecciona a `/login`

## 2. Admin Dashboard

- [ ] Cards de estadísticas cargan (atletas, asistencia, finanzas)
- [ ] Panel del agente IA admin es visible
- [ ] No hay errores en consola del navegador

## 3. Gestión de Atletas

- [ ] `/athletes` carga lista de atletas
- [ ] Buscador filtra resultados en tiempo real
- [ ] Botón médico abre diálogo con 5 tabs
- [ ] Tab Vacunas muestra registros o estado vacío
- [ ] Tab Tests Físicos carga sin error

## 4. Entrenamientos

- [ ] `/training` carga calendario del mes actual
- [ ] Botones Mes/Semana/Día cambian la vista
- [ ] Botón "Exportar .ics" descarga archivo `.ics`
- [ ] Filtro por tipo de entrenamiento funciona

## 5. Módulo Médico

- [ ] Abrir diálogo médico → 5 tabs visibles
- [ ] Tab Vacunas: botón "+" abre formulario inline
- [ ] Tab Tests Físicos: muestra grupos de métricas
- [ ] Cerrar diálogo sin errores

## 6. Documentos y Firma Digital

- [ ] `/documents` carga con 4 tabs
- [ ] Tab Firma Digital muestra 5 documentos firmables
- [ ] Botón "Firmar" → dialog con canvas visible
- [ ] Canvas acepta dibujo con mouse
- [ ] Botón "Borrar" limpia el canvas

## 7. Mensajería

- [ ] `/mensajes` carga bandeja de entrada
- [ ] Badge de mensajes no leídos actualiza en tiempo real (Realtime)
- [ ] Abrir hilo de mensajes funciona

## 8. Portal de Padres

- [ ] `/parent-dashboard` muestra datos del atleta hijo
- [ ] Card "Estado médico" visible (con o sin restricciones)
- [ ] Link a mensajes funciona
- [ ] Parent NO puede acceder a `/admin-dashboard`

## 9. Competencias

- [ ] `/competitions` carga lista de competencias
- [ ] Ranking/resultados son visibles

## 10. Configuración y Seguridad

- [ ] Supabase Logs → 0 errores PGRST301 (RLS blocked) en flujos normales
- [ ] Network tab: ninguna request falla con 401/403 en flujos de usuario válido
- [ ] `athlete_cv_summary` no expone datos de otros atletas (test manual con usuario athlete)

---

**Fecha de última verificación:** ___________  
**Verificado por:** ___________  
**Build/commit:** ___________  
**Resultado:** ✅ PASS / ❌ FAIL
