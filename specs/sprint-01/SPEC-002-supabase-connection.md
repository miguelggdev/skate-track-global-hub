# SPEC-002 — Conectar App al Schema Nuevo
**Status:** `done`  
**Agente:** AG-CLAUDE-FRONTEND  
**Sprint:** 01  
**Prioridad:** CRÍTICA  

---

## Propósito
El schema fue reiniciado con 11 tablas limpias. El frontend todavía puede tener referencias a columnas o tablas que ya no existen (ej: `profiles.role`). Hay que sanear las queries y types.

## Acceptance Criteria
- [ ] `npm run build` sin errores TypeScript
- [ ] Login/signup funciona (handle_new_user crea profile + user_role)
- [ ] `src/integrations/supabase/types.ts` regenerado con el nuevo schema
- [ ] Cualquier referencia a `profiles.role` eliminada del frontend
- [ ] Cualquier referencia a `app_role` eliminada del frontend
- [ ] `useAuth` hook devuelve el rol desde `user_roles` (no desde `profiles.role`)

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
