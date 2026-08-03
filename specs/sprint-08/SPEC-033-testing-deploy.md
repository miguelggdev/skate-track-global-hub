# SPEC-033 — Sprint 8: Testing + Seguridad + Deploy

**Sprint:** 08  
**Agente:** AG-CLAUDE-SECURITY + AG-CLAUDE-FRONTEND  
**Estado:** done  
**Fecha:** 2026-08-02  

---

## 1. Propósito

Sprint final de la fase MVP: aplicar migraciones a producción, cerrar vulnerabilidades de seguridad identificadas en auditoría, escribir tests E2E para rutas críticas y preparar la configuración de deploy en Vercel.

---

## 2. Tasks Implementadas

### 2.1 Migración Sprint 7 → Producción
- Comando: `supabase db push --linked`
- Migración aplicada: `20260802210000_sprint7_medical_vaccines_signatures.sql`
- Tablas creadas en producción: `vaccine_records`, `physical_fitness_tests`, `document_signatures`

### 2.2 Auditoría de Seguridad — Hallazgos

**Scope:** 23 archivos de migración, 68 tablas, ~15 funciones

| Severidad | Issue |
|-----------|-------|
| CRITICAL | `security_audit_log` INSERT policy con `WITH CHECK (true)` — cualquier usuario autenticado podía forjar entradas de auditoría |
| HIGH | Coaches sin restricción de atleta asignado en `medical_sessions`, `vaccine_records`, `physical_fitness_tests` |
| HIGH | Vista `athlete_cv_summary` sin `security_invoker` — exponía datos personales de todos los atletas |
| MEDIUM | `handle_new_user` permitía auto-asignación de roles `coach`, `leader`, `delegate`, `finance` |
| MEDIUM | `audit_log` INSERT policy bloqueaba inserts de triggers no-admin (auditoría incompleta) |

### 2.3 Migración de Hardening

**Archivo:** `20260802220000_sprint8_security_hardening.sql`

Fixes aplicados:
1. `security_audit_log` INSERT cambiado a `WITH CHECK (false)` — solo service role (bypass RLS) escribe
2. `athlete_cv_summary` → `ALTER VIEW ... SET (security_invoker = on)` 
3. `medical_sessions`, `vaccine_records`, `physical_fitness_tests` — políticas de coach restringidas a atletas asignados (`WHERE coach_id = auth.uid()`)
4. `handle_new_user` — solo `athlete` y `parent` son auto-asignables; roles privilegiados requieren promoción por admin
5. `audit_log` INSERT cambiado a `WITH CHECK (false)` — triggers SECURITY DEFINER bypasan RLS y siempre pueden insertar

### 2.4 Tests E2E Playwright

**Archivos nuevos:**

| Archivo | Cobertura |
|---------|-----------|
| `tests/e2e/helpers/auth.ts` | Helpers de login compartidos (admin, coach, parent) |
| `tests/e2e/admin-athletes.spec.ts` | Dashboard admin, lista atletas, navegación módulos |
| `tests/e2e/medical.spec.ts` | Diálogo médico, tabs Vacunas y Tests Físicos |
| `tests/e2e/documents-signing.spec.ts` | 4 tabs documentos, dialog firma, canvas mouse |
| `tests/e2e/parent-dashboard.spec.ts` | Portal padres, estado médico, mensajes, RBAC |
| `tests/e2e/training-calendar.spec.ts` | Calendario, navegación, filtros, exportar ICS |

**Archivos previos (Sprint 7):**
- `auth.spec.ts`, `navigation.spec.ts`, `coach-flow.spec.ts`, `athlete-profile.spec.ts`, `finance-export.spec.ts`, `admin-search.spec.ts`

**Comando de ejecución:**
```bash
npm run test:e2e           # headless
npm run test:e2e:headed    # con navegador visible
npm run test:e2e:ui        # UI interactiva de Playwright
```

**Variables de entorno requeridas para E2E:**
```
E2E_ADMIN_EMAIL=admin@speedskate.co
E2E_ADMIN_PASS=TestAdmin123!
E2E_COACH_EMAIL=coach@test.speedskate.co
E2E_COACH_PASS=TestCoach123!
E2E_PARENT_EMAIL=parent@test.speedskate.co
E2E_PARENT_PASS=TestParent123!
```

### 2.5 Configuración Vercel

**Archivo:** `vercel.json`

- Build: `npm run build` → `dist/`
- SPA rewrite: `/(.*) → /index.html`
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- Cache: assets inmutables (1 año), `sw.js` sin caché
- Env secrets: `@vite_supabase_url`, `@vite_supabase_anon_key` (configurar en dashboard Vercel)

---

## 3. Archivos Nuevos

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/20260802220000_sprint8_security_hardening.sql` | 6 fixes de seguridad |
| `tests/e2e/helpers/auth.ts` | Helpers E2E compartidos |
| `tests/e2e/admin-athletes.spec.ts` | Tests admin/atletas |
| `tests/e2e/medical.spec.ts` | Tests módulo médico |
| `tests/e2e/documents-signing.spec.ts` | Tests firma digital |
| `tests/e2e/parent-dashboard.spec.ts` | Tests portal padres |
| `tests/e2e/training-calendar.spec.ts` | Tests calendario |
| `vercel.json` | Config deploy Vercel |
| `specs/sprint-08/SPEC-033-testing-deploy.md` | Este spec |

---

## 4. Deploy Frontend → Vercel

### Pasos para el operador

1. `npm run build` — verificar build limpio (0 warnings TypeScript)
2. Ir a [vercel.com](https://vercel.com) → New Project → Import desde GitHub
3. Seleccionar repo, branch `master`
4. Framework preset: **Vite** (auto-detectado)
5. Configurar env vars en Settings → Environment Variables:
   - `VITE_SUPABASE_URL` = `https://tvzebtbcrwnyszxiqvyw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (copiar de `.env.local`)
6. Deploy — Vercel aplicará `vercel.json` automáticamente

### Post-deploy checklist
- [ ] URL de producción carga login sin errores en consola
- [ ] Login con credencial admin funciona
- [ ] Dashboard muestra atletas de producción
- [ ] Módulo médico abre diálogo correctamente
- [ ] Tab Firma Digital muestra canvas
- [ ] Export .ics descarga archivo

---

## 5. Deploy Backend → Railway

> Requiere contratar servicio Railway antes de ejecutar.

### Variables de entorno necesarias
```
ANTHROPIC_API_KEY=...
SUPABASE_URL=https://tvzebtbcrwnyszxiqvyw.supabase.co
SUPABASE_SERVICE_KEY=...  (service_role key de Supabase)
REDIS_URL=redis://...     (provisioned by Railway Redis plugin)
```

### Servicios a deployar
1. **FastAPI app** — `uvicorn main:app --host 0.0.0.0 --port $PORT`
2. **Celery worker** — `celery -A tasks worker --loglevel=info`
3. **Celery Beat** — `celery -A tasks beat --loglevel=info`

---

## 6. Monitoreo Post-Deploy

### Supabase Dashboard
- Database → Queries más lentas (>500ms)
- Auth → Usuarios activos
- Logs → errores de RLS (código PGRST301)

### Vercel Analytics
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Error rate en Functions

### Smoke Tests (ejecutar manualmente tras deploy)
Ver: `docs/SMOKE_TESTS.md`
