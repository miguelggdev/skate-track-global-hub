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

### Día 1 (Hoy — completado en parte)
| Tarea | Agente | Spec | Status |
|-------|--------|------|--------|
| CLAUDE.md + WORK_PLAN.md + estructura specs | AG-CLAUDE-DB | SPEC-001 | ✅ |
| Schema inicial en Supabase | AG-CLAUDE-DB | — | ✅ 11 tablas |
| Crear ramas dev + master | Tú | SPEC-001 | ⏳ |

### Día 2
| Tarea | Agente | Spec | Status |
|-------|--------|------|--------|
| Regenerar Supabase types en frontend | AG-CLAUDE-FRONTEND | SPEC-002 | ⬜ |
| Auditar y sanear `profiles.role` del frontend | AG-CLAUDE-FRONTEND | SPEC-002 | ⬜ |
| Verificar login/signup funcionando | AG-CLAUDE-FRONTEND | SPEC-002 | ⬜ |

### Día 3
| Tarea | Agente | Spec | Status |
|-------|--------|------|--------|
| Crear buckets en Supabase Dashboard | Tú (manual) | SPEC-004 | ⬜ |
| Migración storage policies | AG-CLAUDE-DB | SPEC-004 | ⬜ |
| Activar pgvector en Supabase Dashboard | Tú (manual) | SPEC-003 | ⬜ |

### Día 4
| Tarea | Agente | Spec | Status |
|-------|--------|------|--------|
| Migración audit_log + triggers | AG-CLAUDE-DB | SPEC-003 | ⬜ |
| Migración knowledge_base + vector index | AG-CLAUDE-DB | SPEC-003 | ⬜ |

### Día 5
| Tarea | Agente | Spec | Status |
|-------|--------|------|--------|
| RLS review completo — todas las tablas | AG-CLAUDE-SECURITY | — | ⬜ |
| Seed de club_settings (fila inicial) | AG-CLAUDE-DB | — | ⬜ |
| Commit semanal + push | Tú | — | ⬜ |

---

## SPRINT 2 — Backend Python + Agentes IA (Semanas 3-4)
**Objetivo:** FastAPI + LangGraph funcionando, AG-01 (Admin) y AG-02 (Coach) MVP

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
| Tarea | Agente | Status |
|-------|--------|--------|
| Setup FastAPI + estructura backend | AG-CLAUDE-BACKEND | ⬜ |
| Conexión Supabase desde Python | AG-CLAUDE-BACKEND | ⬜ |
| base_agent.py con RAG + DB access | AG-CLAUDE-BACKEND | ⬜ |
| admin_agent.py (AG-01) MVP | AG-CLAUDE-BACKEND | ⬜ |

### Días 9-10
| Tarea | Agente | Status |
|-------|--------|--------|
| skating_agent.py (AG-02) MVP | AG-CLAUDE-BACKEND | ⬜ |
| Celery + Redis configuración | AG-CLAUDE-BACKEND | ⬜ |
| WebSocket endpoint para streaming | AG-CLAUDE-BACKEND | ⬜ |

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

*Actualizado: Julio 2026 — Sprint 1 en curso*
