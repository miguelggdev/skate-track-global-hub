# SPEC-002 — Conectar App al Schema Nuevo
**Status:** `done`  
**Agente:** AG-CLAUDE-FRONTEND  
**Sprint:** 01  
**Prioridad:** CRÍTICA  

---

## Propósito
El schema fue reiniciado con 11 tablas limpias. El frontend todavía puede tener referencias a columnas o tablas que ya no existen (ej: `profiles.role`). Hay que sanear las queries y types.

## Acceptance Criteria
- [x] `npm run build` sin errores TypeScript
- [x] Login/signup funciona (handle_new_user crea profile + user_role)
- [x] `src/integrations/supabase/types.ts` regenerado con el nuevo schema
- [x] Cualquier referencia a `profiles.role` eliminada del frontend
- [x] Cualquier referencia a `app_role` eliminada del frontend
- [x] `useAuth` hook devuelve el rol desde `user_roles` (no desde `profiles.role`)

## Resultado Auditoría (jul 2026)
- `useUserProfile` ya leía de `user_roles` correctamente — nunca tocó `profiles.role`
- `profiles` DB no tiene columna `role` confirmado por types regenerados
- Cero referencias a `app_role` en todo el frontend
- `useAuth` solo maneja auth (user/session) — roles delegados a `useUserProfile`
- Trigger `on_auth_user_created` → `handle_new_user` existe y crea profile + user_role en signup
- `UserManagement` y `UserManagementTab` hacen join correcto profiles + user_roles

## Cambios de Frontend
- Regenerar types de Supabase: `npx supabase gen types typescript --project-id [ID] > src/integrations/supabase/types.ts`
- Auditar hooks que lean `profiles.role`
- Hook `useUserRole` debe leer de `user_roles` table

## Notas de Implementación
- El nuevo schema NO tiene `profiles.role` — los roles viven en la tabla `user_roles`
- `has_role(user_id, role)` y `get_user_role(user_id)` son las funciones RPC disponibles
- Supabase Project ID necesario para regenerar types

## Archivos a Modificar (probables)
- `src/integrations/supabase/types.ts`
- `src/hooks/useAuth.tsx` o equivalente
- Cualquier hook que lea `profiles.role`
