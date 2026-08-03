# SPEC-010 — Wizard de Onboarding del Club
**Status:** `done`  
**Agente:** AG-CLAUDE-FRONTEND  
**Sprint:** 02  
**Prioridad:** ALTA  

---

## Propósito
Después de que el primer admin se registra, llega al dashboard sin ningún dato del club configurado. El wizard de onboarding guía al admin para configurar el club en 4 pasos antes de usar el sistema.

## Acceptance Criteria
- [x] Página `/onboarding` accesible solo para admins autenticados
- [x] Stepper visual de 4 pasos con progreso
- [x] Paso 1: Nombre del club + descripción (requerido para avanzar)
- [x] Paso 2: Contacto (email, teléfono, dirección, sitio web)
- [x] Paso 3: Directivos (presidente, delegado, liga, país)
- [x] Paso 4: Pantalla de éxito → redirige a `/admin-dashboard`
- [x] Guarda todo en `club_settings` al finalizar el paso 4
- [x] Si ya existe una fila → UPDATE; si no → INSERT
- [x] `npm run build` sin errores TypeScript

## Cambios de Base de Datos
- Sin cambios de schema — usa las columnas ya existentes de `club_settings`

## Cambios de Frontend
- **`src/pages/Onboarding.tsx`** — Página completa del wizard (4 pasos + success screen)
- **`src/App.tsx`** — Ruta `/onboarding` protegida para admin/leader

## UI / Comportamiento Esperado

```
┌────────────────────────────────────────┐
│  ● ─── ○ ─── ○ ─── ○                  │
│ Club  Contacto  Directivos  ¡Listo!   │
│                                        │
│        [formulario del paso]           │
│                                        │
│   [Anterior]          [Siguiente →]   │
└────────────────────────────────────────┘
```

## Notas de Implementación
- Formulario acumula datos en estado local → upsert único al finalizar paso 4
- Logo del club: se omite en el wizard (el admin puede subirlo después en `/club-config`)
- La validación del paso 1 (club_name requerido) es suficiente — el resto es opcional
- Ruta `/onboarding` debe ser un ProtectedRoute para admin/leader

## Archivos Creados/Modificados
- `specs/sprint-02/SPEC-010-onboarding-wizard.md` ← este archivo
- `src/pages/Onboarding.tsx`
- `src/App.tsx`
