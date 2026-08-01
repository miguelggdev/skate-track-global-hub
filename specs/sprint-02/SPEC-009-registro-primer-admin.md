# SPEC-009 — Registro del Primer Administrador
**Status:** `done`  
**Agente:** AG-CLAUDE-FRONTEND + AG-CLAUDE-DB  
**Sprint:** 02  
**Prioridad:** CRÍTICA  

---

## Propósito
El sistema no tiene forma de crear el primer administrador desde el frontend. Cualquier nuevo club que adopte la plataforma necesita un flujo de auto-registro para que el primer admin configure el sistema sin intervención manual en Supabase.

## Acceptance Criteria
- [x] Existe página `/register` accesible desde `/login`
- [x] Formulario: nombre, apellido, email, contraseña, confirmar contraseña
- [x] Validación: contraseñas coinciden, email válido, campos requeridos
- [x] El PRIMER usuario que se registra en el sistema obtiene rol `admin` automáticamente
- [x] Los usuarios posteriores obtienen `athlete` por defecto (no pueden auto-asignarse `admin`)
- [x] Tras registro exitoso: redirect a `/app` (si auto-confirmado) o pantalla de "verifica tu email"
- [x] Diseño consistente con Login (glassmorphism, misma imagen de fondo)
- [x] `npm run build` sin errores TypeScript

## Cambios de Base de Datos
- **Migración `20260730100000_secure_handle_new_user.sql`:** Reemplaza `handle_new_user` con versión que:
  1. Cuenta admins existentes en `user_roles`
  2. Si `COUNT = 0` → asigna `admin` al nuevo usuario
  3. Si `COUNT > 0` → asigna el rol del metadata SOLO si es un valor válido no-admin (`leader|coach|delegate|finance|athlete`)
  4. Default siempre es `athlete`
- **Seguridad:** Elimina la vulnerabilidad donde cualquier usuario podía pasarse `role: 'admin'` en el metadata de signup

## Cambios de Backend
- Sin Edge Functions nuevas (la lógica vive en el trigger de la BD)

## Cambios de Frontend
- **`src/pages/Register.tsx`** — Página nueva de registro
- **`src/App.tsx`** — Ruta `/register` pública
- **`src/pages/Login.tsx`** — Link "Crear cuenta de administrador" al pie

## UI / Comportamiento Esperado

```
┌─────────────────────────────────┐
│           ⛸️                    │
│    SpeedSkate Academy           │
│    Crear cuenta de administrador│
│                                 │
│  [👤 Nombre          ]          │
│  [👤 Apellido        ]          │
│  [📧 Email           ]          │
│  [🔒 Contraseña    👁]          │
│  [🔒 Confirmar     👁]          │
│                                 │
│  [     Crear cuenta     ]       │
│                                 │
│  ¿Ya tienes cuenta? Iniciar     │
└─────────────────────────────────┘

Estado éxito (email pendiente):
┌─────────────────────────────────┐
│           ✅                    │
│    ¡Cuenta creada!              │
│  Revisa tu bandeja de entrada   │
│  para confirmar tu email        │
│  [      Volver al login    ]    │
└─────────────────────────────────┘
```

## Notas de Implementación
- `supabase.auth.signUp()` usado directamente (no a través de `useAuth.signUp`) para acceder a `data.session`
- Si `data.session !== null` → auto-confirmado → redirect `/app` → RoleBasedRedirect → `/admin-dashboard`
- Si `data.session === null` → email pendiente → pantalla de éxito con instrucciones
- La vulnerabilidad del trigger original: `COALESCE((raw_user_meta_data->>'role')::user_role, 'athlete')` aceptaba cualquier valor incluyendo 'admin' desde el cliente

## Archivos Creados/Modificados
- `specs/sprint-02/SPEC-009-registro-primer-admin.md` ← este archivo
- `supabase/migrations/20260730100000_secure_handle_new_user.sql`
- `src/pages/Register.tsx`
- `src/App.tsx`
- `src/pages/Login.tsx`
