# SPEC-011 — Guard de Onboarding
**Status:** `done`  
**Agente:** AG-CLAUDE-FRONTEND  
**Sprint:** 02  
**Prioridad:** ALTA  

---

## Propósito
Un admin puede evitar el wizard de onboarding accediendo directamente a `/admin-dashboard`. El guard detecta si el club no está configurado y redirige automáticamente a `/onboarding`.

## Acceptance Criteria
- [x] Si el admin inicia sesión y `club_settings` no tiene ninguna fila → redirige a `/onboarding`
- [x] Si el admin completa el onboarding y vuelve a `/app` → va al dashboard normalmente
- [x] La redirección ocurre en `RoleBasedRedirect` — no afecta otras rutas
- [x] Hook `useOnboardingGuard` centraliza la lógica de detección
- [x] No aplica a roles distintos de `admin` y `leader`
- [x] `npm run build` sin errores TypeScript

## Cambios de Base de Datos
- Sin cambios — solo lectura de `club_settings`

## Cambios de Frontend
- **`src/hooks/useOnboardingGuard.ts`** — Hook que detecta si se necesita onboarding
- **`src/App.tsx`** — `RoleBasedRedirect` usa el hook para redirigir admins sin club config

## Lógica de Detección
```
club_settings = await supabase.from('club_settings').select('id, club_name').maybeSingle()
needsOnboarding = club_settings === null
```

El check es simple: si no existe ninguna fila en `club_settings` → onboarding pendiente.

## Notas de Implementación
- El hook devuelve `{ needsOnboarding: boolean, loading: boolean }`
- Solo se ejecuta si el usuario tiene rol `admin` o `leader`
- La query está deshabilitada (enabled: false) para otros roles
- `RoleBasedRedirect` espera que el hook cargue antes de redirigir

## Archivos Creados/Modificados
- `specs/sprint-02/SPEC-011-guard-onboarding.md` ← este archivo
- `src/hooks/useOnboardingGuard.ts`
- `src/App.tsx`
