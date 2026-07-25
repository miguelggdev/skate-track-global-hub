# /rls-policy — Crear Políticas RLS para Supabase

Genera y aplica políticas de Row Level Security (RLS) completas para las tablas del proyecto.

## Contexto
- Base de datos: Supabase PostgreSQL
- Roles existentes: `admin`, `coach`, `athlete`, `delegate`, `leader`, `finance`
- Función helper existente: `has_role(user_id, role_name)` y `get_user_role(user_id)`
- Tablas sensibles: athletes, financial_transactions, athlete_body_info, user_medical_info

## Qué hacer

1. **Leer** `src/integrations/supabase/types.ts` para ver todas las tablas
2. **Leer** las últimas migraciones en `supabase/migrations/` para ver el estado actual
3. **Generar** un nuevo archivo de migración SQL en `supabase/migrations/` con nombre `YYYYMMDDHHMMSS_complete_rls_policies.sql`

## Reglas de acceso por tabla

### athletes
- SELECT: propio atleta, su coach asignado, admin, leader
- INSERT: admin, coach
- UPDATE: admin, coach (solo sus atletas), propio atleta (solo campos permitidos)
- DELETE: solo admin

### financial_transactions
- SELECT: admin, finance, leader (todas), propio atleta (las suyas)
- INSERT: admin, finance
- UPDATE: admin, finance
- DELETE: solo admin

### training_sessions
- SELECT: todos los roles autenticados
- INSERT: admin, coach
- UPDATE: admin, coach
- DELETE: admin, coach

### competition_results
- SELECT: todos los autenticados
- INSERT: admin, delegate
- UPDATE: admin, delegate
- DELETE: solo admin

### athlete_body_info, user_medical_info
- SELECT: propio atleta, su coach, admin
- INSERT/UPDATE: admin, coach (solo sus atletas)
- DELETE: solo admin

### profiles
- SELECT: propio perfil (cualquier rol), admin (todos)
- UPDATE: propio perfil, admin
- DELETE: solo admin

## Formato de salida
```sql
-- Habilitar RLS
ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "[nombre_descriptivo]" ON [tabla]
  FOR [SELECT|INSERT|UPDATE|DELETE|ALL]
  [TO authenticated]
  USING ([condición])
  [WITH CHECK ([condición])];
```

Generar el archivo de migración completo listo para aplicar.
