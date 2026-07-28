# CLAUDE.md — SpeedSkateTrack Hub
## Instrucciones para Claude Code en este proyecto

---

## 1. Contexto del Proyecto

**SpeedSkateTrack Hub** es una plataforma de gestión integral para clubs de patinaje de velocidad.
Stack: React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui + Supabase + LangGraph (Python).

**Rutas del proyecto:**
- App principal: `C:\Users\Miguel Angel GG\Documents\PROYECTOS_CLAUDE\SKATE\skate-track-global-hub-main\skate-track-global-hub-main`
- Landing page: `C:\Users\Miguel Angel GG\Documents\PROYECTOS_CLAUDE\SKATE\speedskatetrack-landing`
- Backend agentes: `C:\Users\Miguel Angel GG\Documents\PROYECTOS_CLAUDE\SKATE\skate-track-global-hub-main\skate-track-global-hub-main\backend` (por crear)

**Documento maestro del proyecto:** `PROYECTO_SKATE_MASTER.md`
**Specs activos:** `specs/sprint-*/`
**Plan de trabajo:** `WORK_PLAN.md`

---

## 2. Estándares de Código

### TypeScript / React
- TypeScript estricto — sin `any`, sin `as unknown`
- Componentes funcionales con hooks, sin class components
- Props tipadas con `interface`, no `type` para objetos
- Imports absolutos desde `@/` (ya configurado en vite)
- Zod para validación en todos los formularios
- TanStack Query para todo el fetching — no `useEffect` para datos

### Naming
- Componentes: PascalCase (`AthleteCard.tsx`)
- Hooks: camelCase con `use` prefix (`useAthletes.ts`)
- Utilities/helpers: camelCase (`formatDate.ts`)
- Constantes: SCREAMING_SNAKE_CASE
- Archivos de página: PascalCase en `src/pages/`

### Estructura de archivos
```
src/
├── components/
│   ├── ui/           # shadcn-ui (no modificar)
│   ├── layout/       # Layout components
│   ├── agents/       # Chat widgets de agentes IA
│   └── [feature]/    # Componentes por feature
├── pages/            # Páginas (una por ruta)
├── hooks/            # Hooks personalizados
├── lib/              # Supabase client, utils
├── types/            # TypeScript types
└── integrations/     # Supabase generated types
```

### CSS / Tailwind
- Tailwind utility-first — no CSS modules, no styled-components
- shadcn-ui para todos los componentes de UI base
- Design tokens en `tailwind.config.ts` — no hardcodear colores
- Mobile-first siempre: `sm:` → `md:` → `lg:`

---

## 3. Supabase

### Schema
- **Un solo archivo de migración inicial:** `supabase/migrations/20260101000000_initial_schema.sql`
- Nuevas features se agregan como migraciones nuevas con timestamp: `YYYYMMDDHHMMSS_descripcion.sql`
- **NUNCA** modificar migraciones ya aplicadas — crear una nueva
- RLS activo en todas las tablas siempre

### Funciones de seguridad clave
```sql
-- Siempre usar estas funciones en RLS policies:
has_role(auth.uid(), 'admin')         -- chequea si usuario tiene un rol
get_user_role(auth.uid())             -- devuelve el rol de mayor jerarquía
```

### Convenciones SQL
- `SECURITY DEFINER SET search_path = 'public'` en todas las funciones sensibles
- `ON CONFLICT ... DO NOTHING` para inserts idempotentes
- Usar `user_role` ENUM — nunca texto plano para roles
- `IN ('value')` en vez de `= ANY(ARRAY['value'])` para enums en SQL puro

### Edge Functions
- Ubicación: `supabase/functions/[nombre]/index.ts`
- TypeScript + Deno
- Validar JWT en el header siempre: `supabase.auth.getUser(token)`
- Rate limiting en funciones públicas

---

## 4. Seguridad — Principios No Negociables

1. **RLS siempre activo** — toda tabla nueva lleva sus policies en la misma migración
2. **Validación en 3 capas:** frontend (Zod) + Edge Function + RLS
3. **Audit log** para operaciones sensibles (UPDATE/DELETE en datos de atletas, finanzas, médicos)
4. **`SECURITY DEFINER`** en todas las funciones que accedan a tablas restringidas
5. **Datos de menores:** solo accesible por coach asignado, admin, o padre/tutor
6. **Sin secrets en código:** usar variables de entorno de Supabase y `.env.local`
7. **Sanitizar inputs:** especialmente en funciones que construyen queries dinámicos

---

## 5. Git Workflow (SDD — Spec-Driven Development)

### Flujo diario
```
1. Revisar spec del día en specs/sprint-XX/SPEC-XXX-*.md
2. Implementar según acceptance criteria del spec
3. Verificar que compila: npm run build (no warnings TypeScript)
4. Commit diario al cierre con formato estándar
5. Push a origin
```

### Formato de commit
```
[AGENT-XX][SPEC-XXX] descripción breve

- detalle 1
- detalle 2

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Ramas
- `master`: producción estable
- `dev`: desarrollo activo (trabajo aquí)
- `feature/SPEC-XXX-nombre`: features grandes (opcional)

### Regla de oro
**Un commit al final de cada sesión de trabajo.** Nunca terminar el día sin push.

---

## 6. Metodología SDD (Spec-Driven Development)

Antes de implementar cualquier feature:
1. Crear spec en `specs/sprint-XX/SPEC-XXX-nombre.md` usando `specs/_template.md`
2. Definir: propósito, acceptance criteria, cambios de BD, comportamiento UI
3. Implementar siguiendo el spec — no agregar nada que no esté en el spec
4. Marcar spec como `status: done` al completar

**El spec ES el diseño. El código ES la implementación del spec.**

---

## 7. Agentes IA — Roles y Dominios

Cada sesión de Claude Code actúa como uno de estos agentes según el área de trabajo:

| Agente | Dominio | Specs asignados |
|--------|---------|-----------------|
| **AG-CLAUDE-DB** | Schema, migraciones, RLS, Supabase | SPEC-001 a SPEC-009 |
| **AG-CLAUDE-BACKEND** | LangGraph, FastAPI, Celery, Python | SPEC-010 a SPEC-024 |
| **AG-CLAUDE-FRONTEND** | React, dashboards, UI, hooks | SPEC-025 a SPEC-044 |
| **AG-CLAUDE-SECURITY** | Auditoría, RLS review, tests seguridad | SPEC-045 a SPEC-049 |
| **AG-CLAUDE-MARKETING** | Landing page, emails, templates | SPEC-050 a SPEC-059 |

Al iniciar una sesión, indicar: **"Actúa como AG-CLAUDE-[DOMINIO] implementando SPEC-XXX"**

---

## 8. Testing

- TypeScript type-check: `npx tsc --noEmit` antes de cada commit
- Build check: `npm run build` — cero errores, cero warnings TS
- Playwright E2E (Sprint 8): `npx playwright test`
- **No mockear Supabase** — usar Supabase local (`supabase start`) para tests

---

## 9. Deploy

### App principal
- **Producción:** Vercel (o Netlify)
- Variables de entorno requeridas:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Build command: `npm run build`
- Output directory: `dist`

### Backend Python (LangGraph)
- **Producción:** Railway o Render
- Variables: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `REDIS_URL`

### Landing page
- **Producción:** GitHub Pages (ya configurado con Actions)

---

## 10. Referencia Rápida

```bash
# Desarrollo local
npm run dev                     # Levantar app en localhost:5173

# Supabase local
supabase start                  # BD local en localhost:54321
supabase db diff                # Ver cambios de schema
supabase migration new nombre   # Nueva migración

# TypeScript check
npx tsc --noEmit

# Build
npm run build
```
