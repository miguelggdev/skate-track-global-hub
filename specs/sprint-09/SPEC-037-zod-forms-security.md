# SPEC-037 — Sprint 9: Zod en Formularios + Fixes de Seguridad Residuales

**Sprint:** 09  
**Agente:** AG-CLAUDE-SECURITY + AG-CLAUDE-FRONTEND  
**Estado:** done  
**Fecha:** 2026-08-06  

---

## 1. Propósito

Cubrir los formularios de alta carga que carecían de validación Zod (violación del estándar del proyecto definido en CLAUDE.md) y corregir dos vulnerabilidades de seguridad que quedaron pendientes de la auditoría round 2.

---

## 2. Fixes de Seguridad

### 2.1 Import CSV de atletas — bypass de autorización

**Archivo:** `backend/api/routes/athletes.py`

**Problema:** La guarda usaba `current_user.get("role")`, que en Supabase JWT siempre devuelve `"authenticated"` (nunca `"admin"`). Cualquier usuario logueado podía importar atletas masivamente.

**Fix:**
```python
# Antes (roto):
if current_user.get("role") not in {"admin"}:
    raise HTTPException(status_code=403, ...)

# Después (correcto):
user_id = current_user.get("sub")
if not user_id:
    raise HTTPException(status_code=401, detail="Token sin sub claim")
app_role = await _fetch_app_role_async(user_id)
if app_role != "admin":
    raise HTTPException(status_code=403, detail="Solo administradores pueden importar atletas.")
```

**Impacto:** Crítico. Cualquier usuario autenticado (incluyendo atletas y padres) podía insertar datos masivamente en la tabla `athletes`.

### 2.2 Sesiones de checkin — leak de datos

**Archivo:** `src/pages/Checkin.tsx`

**Problema:** La query de sesiones de hoy tenía `enabled: !!token` — cualquier string no vacío habilitaba la consulta. Un atacante con una URL `/checkin/STRING_CUALQUIERA` veía todas las sesiones de entrenamiento del día.

**Fix:**
```typescript
// Antes (roto):
enabled: !!token,

// Después (correcto):
enabled: !!athleteInfo && !athleteError,
```

**Impacto:** Las sesiones de entrenamiento (nombre, tipo, horario, ubicación) solo se devuelven si el token corresponde a un atleta real.

---

## 3. Zod en 4 Formularios

### 3.1 `AddAthleteDialog.tsx`

Schema `addAthleteSchema`:
- `firstName`, `lastName`, `idNumber` — `z.string().min(1, ...)`
- `email` — `.email('...')`
- `password` — `.min(6, ...)`
- `dateOfBirth` — `z.date({ required_error: '...' })`
- `gender`, `idType` — `z.string().min(1, ...)`
- Eliminados todos los `rules={{ required: ..., pattern: ... }}` de los 8 `FormField`
- Interface manual `AthleteFormData` reemplazada por `z.infer<typeof addAthleteSchema>`

### 3.2 `AddUserDialog.tsx`

Schema `addUserSchema`:
- `email`, `password`, `first_name`, `last_name` — required con mensajes en español
- `role` — `z.enum(['admin', 'coach', 'athlete', 'delegate', 'leader', 'finance'])`
- `phone`, `date_of_birth`, `bio` — `.optional().or(z.literal(''))`
- Import `CreateUserData` eliminado del useForm (schema provee el tipo)

### 3.3 `EditUserDialog.tsx`

Schema `editUserSchema` (53 campos, los más complejo del proyecto):
- Required: `first_name`, `last_name`, `email`, `role`
- Opcionales string: 20+ campos de contacto, médico, profesional, administrativo
- Booleanos: `data_consent`, `accepts_regulations`
- Numéricos: `years_experience`, `hourly_rate`
- Arrays: `languages: z.array(z.string()).optional()`
- Interface manual `EditUserFormData` eliminada (evita duplicación)

### 3.4 `ClubInfoSettings.tsx`

Schema `clubInfoSchema` (37 campos):
- `club_name` — único campo required
- Todos los campos de información del club, delegado, presidente, staff médico, coach, redes sociales
- Booleanos de configuración de reportes: `report_include_logo`, etc.
- `onSubmit` cambiado de `(data: any)` a `(data: ClubInfoFormData)`

---

## 4. Patrón aplicado

```typescript
// 1. Importar
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 2. Definir schema
const formSchema = z.object({
  requiredField: z.string().min(1, 'Mensaje de error en español'),
  optionalString: z.string().optional().or(z.literal('')),
  boolField: z.boolean().optional(),
  numField: z.number().optional(),
});

// 3. Inferir tipo
type FormData = z.infer<typeof formSchema>;

// 4. Conectar con react-hook-form
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { ... },
});
```

---

## 5. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/api/routes/athletes.py` | Role check real con `_fetch_app_role_async` |
| `src/pages/Checkin.tsx` | Sessions query `enabled: !!athleteInfo && !athleteError` |
| `src/components/athletes/AddAthleteDialog.tsx` | Zod completo, reescrito; eliminados `rules` props |
| `src/components/users/AddUserDialog.tsx` | zodResolver + schema |
| `src/components/users/EditUserDialog.tsx` | zodResolver + schema 53 campos; eliminado interface manual |
| `src/components/club-config/ClubInfoSettings.tsx` | zodResolver + schema 37 campos; `data: any` → `data: ClubInfoFormData` |

---

## 6. Resultado

`npx tsc --noEmit` → **0 errores**  
`npm run build` → **build exitoso**
