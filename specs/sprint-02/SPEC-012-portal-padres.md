# SPEC-012 — Portal de Padres / Tutores

**Status:** done  
**Sprint:** 2  
**Agente:** AG-CLAUDE-FRONTEND + AG-CLAUDE-DB  
**Fecha:** 2026-07-30

---

## Propósito

Proveer a los padres y tutores un panel de seguimiento de sus hijos atletas:
asistencia, pagos pendientes, próximas competencias y logros. Incluye el
nuevo rol `parent` en el sistema con su propio flujo de registro y vinculación.

---

## Cambios de Base de Datos

### Migración: `20260730200000_parent_role.sql`

1. `ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'parent'`
2. Nueva tabla `parent_athletes`:
   - `id, parent_user_id (→ auth.users), athlete_id (→ athletes), created_at`
   - UNIQUE `(parent_user_id, athlete_id)`
3. RLS en `parent_athletes`:
   - SELECT: `parent_user_id = auth.uid()`
   - ALL: admin o leader
4. Nuevas políticas para padres:
   - `athletes`: SELECT donde `id IN (parent_athletes WHERE parent_user_id = uid)`
   - `attendance`: SELECT idem
   - `transactions`: SELECT idem
5. `handle_new_user` actualizado para aceptar `'parent'` en metadata sin crear
   registro de atleta.

---

## Flujo de Usuario

```
Registro padre (/register) → activa checkbox "Soy padre/tutor"
  → signUp con metadata { role: 'parent' }
  → trigger asigna rol 'parent' en user_roles (sin crear athletes row)
  → /app → RoleBasedRedirect → /parent-dashboard

Admin/Leader (en User Management) → vincula parent_user_id + athlete_id
  → INSERT INTO parent_athletes

Padre recarga → dashboard muestra datos del hijo
```

---

## Componentes Creados / Modificados

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260730200000_parent_role.sql` | NUEVO — ENUM + tabla + RLS + trigger |
| `src/pages/ParentDashboard.tsx` | NUEVO — dashboard completo |
| `src/hooks/useUserProfile.ts` | MODIFICADO — añade `'parent'` a tipo y ROLE_PRIORITY, `isParent` helper |
| `src/components/layout/DashboardLayout.tsx` | MODIFICADO — nav, path, label para `parent` |
| `src/App.tsx` | MODIFICADO — ruta `/parent-dashboard`, case `parent` en redirect |
| `src/pages/Register.tsx` | MODIFICADO — checkbox padre/tutor + metadata `role: 'parent'` |

---

## Dashboard — Secciones

### Columna izquierda
- **Tarjeta atleta**: foto/avatar, nombre, categoría, fecha nacimiento, status, puntaje
- **Asistencia reciente**: barra de porcentaje + lista últimas 8 sesiones con estado

### Columna derecha
- **Pagos pendientes**: lista de transacciones `status IN (pending, overdue)` con total
- **Próximas competencias**: próximas 5 competencias de la categoría del atleta
- **Logros recientes**: últimas 5 medallas/premios

### Estados vacíos
- Sin atletas vinculados: instrucción clara para contactar al club
- Selector de hijo (si hay más de uno vinculado)

---

## Acceptance Criteria

- [x] Rol `parent` existe en ENUM y trigger lo acepta desde metadata
- [x] `parent_athletes` table con RLS correcto
- [x] Padres ven SOLO sus atletas vinculados (aislamiento por RLS)
- [x] `/register` permite marcar "Soy padre/tutor"
- [x] RoleBasedRedirect redirige `parent` → `/parent-dashboard`
- [x] Dashboard renderiza tarjeta de atleta, asistencia, pagos, competencias, logros
- [x] TypeScript: 0 errores (`npx tsc --noEmit`)
