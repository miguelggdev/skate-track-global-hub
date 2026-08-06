# WORK_PLAN.md — SpeedSkateTrack Hub
## Plan de Trabajo con Agentes Claude Code

**Metodología:** SDD (Spec-Driven Development)  
**Ritual diario:** Spec → Implementar → Build check → Commit → Push  
**Horizonte:** 16 semanas / 8 sprints

---

## Cómo Trabajamos Cada Día

```
MAÑANA
  └── "Claude, actúa como AG-CLAUDE-[DOMINIO], implementa SPEC-XXX"
  └── Claude lee el spec, implementa, verifica build

TARDE (si hay segunda sesión)
  └── Continuar spec actual o empezar siguiente

CIERRE DEL DÍA
  └── npx tsc --noEmit        → 0 errores
  └── npm run build            → build exitoso
  └── git add [archivos]
  └── git commit "[AGENT][SPEC] descripción"
  └── git push origin dev
```

---

## Grupo de Agentes

| Agente | Cuándo invocarlo | Qué hace |
|--------|-----------------|----------|
| **AG-CLAUDE-DB** | Schema, migraciones, RLS, Supabase setup | SQL, policies, triggers, índices |
| **AG-CLAUDE-BACKEND** | Python, FastAPI, LangGraph, Celery | Agentes IA, automatizaciones, RAG |
| **AG-CLAUDE-FRONTEND** | React, dashboards, hooks, UI | Componentes, páginas, estado |
| **AG-CLAUDE-SECURITY** | Auditorías, revisiones de seguridad | RLS review, vulnerabilidades, tests |
| **AG-CLAUDE-MARKETING** | Landing page, emails, contenido | Landing, templates de email/notificación |

---

## SPRINT 1 — Fundamentos y Base de Datos (Semanas 1-2)
**Objetivo:** App conectada al schema limpio, git funcionando, seguridad base

### Estado actual del Sprint 1 (julio 2026)

| Spec | Título | Agente | Status |
|------|--------|--------|--------|
| SPEC-001 | Git + GitHub setup | AG-CLAUDE-DB | ✅ done |
| SPEC-002 | Conectar frontend al schema nuevo | AG-CLAUDE-FRONTEND | ✅ done |
| SPEC-003 | Audit Log + pgvector | AG-CLAUDE-DB | ✅ done |
| SPEC-004 | Storage buckets y policies | AG-CLAUDE-DB | ✅ done |
| SPEC-005 | Perfil completo del deportista | AG-CLAUDE-FRONTEND | ✅ done |
| SPEC-006 | Generación de documentos (PDF/Excel) | AG-CLAUDE-FRONTEND | ✅ done |
| SPEC-007 | Registro de tiempos y pruebas | AG-CLAUDE-FRONTEND | ✅ done |
| SPEC-008 | Gestión de equipamiento del club | AG-CLAUDE-FRONTEND | ✅ done |

### Completados este sprint
- Schema completo: 40+ tablas, RLS, triggers, migraciones en `supabase/migrations/`
- Perfil atleta: 9 tabs (básico, personal, contacto, familia, médico, estudios, equipo, deportivo, historial)
- Módulo tiempos: TimeRecordForm, TimeHistoryChart, ClubRanking, página `/tiempos`
- Design system: dual-theme dark/light, dashboards animados para todos los roles
- Seguridad: review de 4 agentes aplicado (MIME validation, UUID paths, CHECK constraints, RLS)

### Pendiente Sprint 1
1. **SPEC-006** — Cartas de permiso PDF, carnets con QR, planilla Excel competencias
2. **SPEC-008** — Inventario equipamiento club, asignaciones, mantenimiento
3. **SPEC-002** — Auditar `profiles.role` vs `user_roles` en hooks del frontend

---

## SPRINT 2 — Frontend Onboarding + Backend Python + Agentes IA (Semanas 3-4)

### Specs de Onboarding y Features Frontend (completados)
| Spec | Título | Status |
|------|--------|--------|
| SPEC-009 | Registro primer administrador (`/register` + trigger seguro) | ✅ done |
| SPEC-010 | Wizard de onboarding del club (`/onboarding`, 4 pasos) | ✅ done |
| SPEC-011 | Guard de onboarding (redirect si club no configurado) | ✅ done |
| SPEC-012 | Portal de padres — rol `parent`, `parent_athletes`, dashboard | ✅ done |

---

**Objetivo backend:** FastAPI + LangGraph funcionando, AG-01 (Admin) y AG-02 (Coach) MVP

### Estructura a crear
```
backend/
├── main.py
├── requirements.txt
├── .env.example
├── agents/
│   ├── base_agent.py
│   ├── admin_agent.py     (AG-01)
│   └── skating_agent.py   (AG-02)
├── rag/
│   ├── embeddings.py
│   └── retriever.py
├── tasks/
│   ├── celery_app.py
│   └── schedules.py
└── database/
    └── supabase_client.py
```

### Días 6-8
| Tarea | Agente | Status | SPEC |
|-------|--------|--------|------|
| Setup FastAPI + estructura backend | AG-CLAUDE-BACKEND | ✅ done | SPEC-013 |
| Conexión Supabase desde Python | AG-CLAUDE-BACKEND | ✅ done | SPEC-013 |
| base_agent.py con DB access | AG-CLAUDE-BACKEND | ✅ done | SPEC-013 |
| admin_agent.py (AG-01) MVP | AG-CLAUDE-BACKEND | ✅ done | SPEC-013 |

### Días 9-10
| Tarea | Agente | Status | SPEC |
|-------|--------|--------|------|
| skating_agent.py (AG-02) MVP | AG-CLAUDE-BACKEND | ✅ done | SPEC-013 |
| Celery + Redis configuración | AG-CLAUDE-BACKEND | ✅ done | SPEC-014 |
| SSE streaming endpoint | AG-CLAUDE-BACKEND | ✅ done | SPEC-015 |
| RAG con pgvector (LangGraph) | AG-CLAUDE-BACKEND | ✅ done | SPEC-025 |

---

## SPRINT 3 — Agentes Especializados (Semanas 5-6)
**Objetivo:** Todos los agentes deportivos funcionando

| Agente IA | Archivo | Días |
|-----------|---------|------|
| AG-04 Nutricionista | `nutrition_agent.py` | 2 |
| AG-05 Gym/Fuerza | `gym_agent.py` | 2 |
| AG-06 Médico | `medical_agent.py` | 2 |
| AG-03 Ciclismo | `cycling_agent.py` | 1 |
| AG-13 Psicología | `psychology_agent.py` | 2 |
| Cargar knowledge base inicial | Manual | 1 |

---

## SPRINT 4 — Agentes de Negocio + Chat UI (Semanas 7-8)
**Objetivo:** Frontend conectado a agentes, widget de chat funcionando

| Tarea | Días |
|-------|------|
| AG-07 Financiero | 2 |
| AG-09 Marketing | 2 |
| AG-10 Resultados (CSV import) | 3 |
| Chat widget en React | 3 |
| Selección de agente por rol | 2 |

---

## SPRINT 5 — Automatizaciones Celery (Semanas 9-10)
**Objetivo:** Las 35 automatizaciones funcionando

| Grupo | Automatizaciones | Días |
|-------|-----------------|------|
| Calendario | AUTO-01 a AUTO-06 | 3 |
| Finanzas | AUTO-07 a AUTO-11 | 3 |
| Atletas | AUTO-12 a AUTO-15 | 2 |
| Administrativo | AUTO-16 a AUTO-20 | 3 |
| Marketing | AUTO-21 a AUTO-25 | 2 |
| Reportería | AUTO-26 a AUTO-29 | 2 |
| Seguridad | AUTO-30 a AUTO-35 | 2 |

---

## SPRINT 6 — Dashboards y Diseño (Semanas 11-12)
**Objetivo:** UI/UX de nivel producción, mobile responsive

| Tarea | Días |
|-------|------|
| Design system + tokens de color | 2 |
| Dashboard Admin mejorado + chat AG-01 | 3 |
| Dashboard Coach con datos reales + AG-02 | 2 |
| Dashboard Atleta mejorado + chats | 2 |
| Dashboard Financiero conectado | 2 |
| Mobile responsive + PWA | 3 |

---

## SPRINT 7 — Features Complementarios (Semanas 13-14)
**Objetivo:** Funcionalidades de alto valor que completan el producto

| Feature | Días |
|---------|------|
| Módulo médico completo | 3 |
| Portal de padres | 3 |
| Mensajería interna | 3 |
| Importación masiva (Excel → atletas) | 2 |
| Firma digital de documentos | 2 |
| Google Calendar sync | 2 |

---

## SPRINT 8 — Testing y Deploy (Semanas 15-16)
**Objetivo:** Plataforma production-ready

| Tarea | Días |
|-------|------|
| Tests E2E con Playwright | 4 |
| Tests de carga | 2 |
| Auditoría de seguridad final | 2 |
| Documentación de usuario | 2 |
| Deploy app en Vercel | 1 |
| Deploy backend en Railway | 1 |
| Monitoreo post-deploy | Continuo |

> **Nota:** Deploy en Vercel/Railway descartado. Se usa VPS Ubuntu + Traefik (ver SPEC-035 y `docs/DEPLOY_VPS.md`).

---

## Checklist de Calidad (cada feature)

Antes de marcar un spec como `done`:
- [ ] TypeScript sin errores: `npx tsc --noEmit`
- [ ] Build exitoso: `npm run build`
- [ ] RLS activo en todas las tablas nuevas
- [ ] No hay `console.log` en producción
- [ ] No hay datos hardcodeados (mock data)
- [ ] Mobile: funciona en pantalla 375px de ancho
- [ ] Commit hecho y pusheado

---

## Stack de Herramientas de Monitoreo (para Sprint 8)

| Herramienta | Qué monitorea |
|-------------|---------------|
| Supabase Dashboard | BD, queries lentas, errores |
| Flower | Tareas Celery (estado, errores, tiempos) |
| Sentry | Errores frontend + backend |
| Langfuse | Trazabilidad de agentes LangGraph |
| Uptime Robot | Disponibilidad 24/7 |

---

---

## SPRINT 9 — Auditoría de Seguridad + Deploy VPS + Facturación (Agosto 2026)

**Objetivo:** Cerrar vulnerabilidades críticas, configurar deploy en VPS propio con Traefik, implementar sistema completo de facturación mensual y cubrir formularios con Zod.

| Spec | Título | Status |
|------|--------|--------|
| SPEC-034 | Auditoría de seguridad + 11 bug fixes (code review + audit round 2) | ✅ done |
| SPEC-035 | Deploy VPS + Traefik (docker-compose, Dockerfile, nginx, deploy.sh) | ✅ done |
| SPEC-036 | Sistema de facturación mensual (invoices, Celery AUTO-36/37, email templates) | ✅ done |
| SPEC-037 | Zod en 4 formularios + fixes de seguridad residuales | ✅ done |

### Completado en Sprint 9

**Seguridad:**
- 11 bug fixes críticos del code review: stale closures, race conditions, PostgREST injection, JWT role bypass
- Migración `20260805100000_checkin_temporal_guard.sql`: validación temporal ±4h en checkin
- Migración `20260805200000_audit_round2_fixes.sql`: 12 fixes (handle_new_user, CV view, NFC UID, FK, coach policies, parent column, created_at, índices)
- Import CSV ahora usa `_fetch_app_role_async` — eliminado bypass de autorización

**Deploy:**
- `Dockerfile` multi-stage: Node 20 → nginx:1.27-alpine
- `docker-compose.yml` para Traefik (red `supabase2_net`) + red interna `app_net`
- `nginx/default.conf` con SSE support (`proxy_buffering off`) y cache de assets
- `deploy.sh` reescrito para Traefik (sin certbot, sin node en VPS)
- `docs/DEPLOY_VPS.md` — guía completa para el operador

**Facturación:**
- Tabla `invoices` con sequence `invoice_number_seq` (FAC-YYYY-NNNNN)
- 2 RPCs: `get_invoice_summary_by_month`, `mark_invoice_paid`
- 5 RLS policies en `invoices`
- Celery AUTO-36 (generación 1° mes) + AUTO-37 (recordatorios D-5 y overdue)
- 4 templates Jinja2 HTML responsivos para emails
- `helpers.py`: retry Resend, Jinja2 renderer, parámetro adjuntos
- Tab "Facturación" en Finance.tsx con KPI cards + tabla + Mark Paid

**Validación:**
- Zod en 4 formularios: AddAthleteDialog, AddUserDialog, EditUserDialog (53 campos), ClubInfoSettings (37 campos)

---

## SPRINT 10 — Rate Limiting + Tests E2E + Optimizaciones (Agosto 2026)

**Objetivo:** Cerrar gaps de seguridad en el backend, corregir los tests E2E y aplicar optimizaciones de bundle.

| Tarea | Status |
|-------|--------|
| Rate limiting FastAPI (slowapi) — 30/min chat, 20/min stream | ✅ done |
| Tests E2E — 102 tests autenticados SKIP graciosamente sin credenciales | ✅ done |
| `tests/e2e/helpers/auth.ts` — login retorna boolean, `HAS_E2E_CREDENTIALS` flag | ✅ done |
| Dynamic import `xlsx`/`jspdf` en `Reports.tsx` — carga solo al hacer click | ✅ done |
| NFC fallback indicator para iOS/desktop en `TrainingCheckin.tsx` | ✅ done |

### Pendiente (Sprint 11)

| Tarea | Prioridad |
|-------|-----------|
| 3 agentes IA faltantes: AG-08 Seguridad, AG-11 Operaciones, AG-12 Legal | ALTA |
| Crear usuarios de prueba E2E en Supabase + configurar vars `E2E_*` | ALTA |
| PDF generación de facturas + adjunto en email | MEDIA |
| RAG: subir documentos a Supabase Storage | MEDIA |
| `CreateTrainingDialog` — migrar a Zod | BAJA |
| CORS assertion en startup para producción | BAJA |

---

*Actualizado: Agosto 2026 — Sprint 10 completado*
