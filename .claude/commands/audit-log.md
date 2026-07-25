# /audit-log — Implementar Sistema de Audit Log

Implementa un sistema completo de auditoría que registra todas las operaciones sensibles en el sistema.

## Qué implementar

### 1. Migración SQL
Crear `supabase/migrations/[timestamp]_audit_log_system.sql`:
- Tabla `audit_log` con todos los campos necesarios
- Triggers en tablas críticas: `athletes`, `profiles`, `financial_transactions`, `athlete_body_info`, `competition_results`, `users`
- Función `create_audit_log_entry()`
- RLS en audit_log: solo admin puede leer

### 2. UI — Panel de Auditoría Admin
Crear `src/pages/AuditLog.tsx`:
- Solo accesible para rol `admin`
- Tabla con: fecha, usuario, acción, tabla afectada, datos cambiados
- Filtros: por fecha, por usuario, por tabla, por tipo de operación
- Exportar a Excel
- Indicadores visuales: INSERT=verde, UPDATE=amarillo, DELETE=rojo

### 3. Hook React
`src/hooks/useAuditLog.ts` con paginación y filtros.

### 4. Menú de navegación
Añadir "Auditoría" al menú de admin en `src/components/layout/DashboardLayout.tsx`.

## Campos del audit_log
- `id`, `user_id`, `user_email`, `action` (INSERT/UPDATE/DELETE/SELECT_SENSITIVE)
- `table_name`, `record_id`
- `old_values JSONB`, `new_values JSONB`
- `ip_address`, `user_agent`
- `created_at`
