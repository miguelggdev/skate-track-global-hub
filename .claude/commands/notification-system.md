# /notification-system — Sistema de Notificaciones en Tiempo Real

Implementa el sistema completo de notificaciones usando Supabase Realtime y push notifications.

## Qué implementar

### 1. Migración SQL — notification_log
```sql
-- Mejorar tabla notifications existente
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'; -- 'low', 'normal', 'high', 'urgent'
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel TEXT[] DEFAULT ARRAY['in_app']; -- 'in_app', 'email', 'push', 'whatsapp'
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS agent_id TEXT; -- qué agente la generó

-- Tabla de preferencias de notificación por usuario
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  channels JSONB DEFAULT '{"in_app": true, "email": true, "push": false}',
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  categories JSONB DEFAULT '{}' -- por categoría de notificación
);
```

### 2. Supabase Edge Function — send-notification
En `supabase/functions/send-notification/index.ts`:
- Recibe: `user_id`, `title`, `message`, `priority`, `channels`, `action_url`
- Inserta en `notifications`
- Si `channels` incluye `email`: envía email via Supabase/Resend
- Si `channels` incluye `push`: envía web push via VAPID
- Respeta quiet hours del usuario

### 3. Hook React — `src/hooks/useNotifications.ts`
```typescript
export function useNotifications() {
  // Suscripción Supabase Realtime a la tabla notifications
  // useEffect con supabase.channel('notifications').on('INSERT', ...)
  // Estado: notifications[], unreadCount
  // Funciones: markAsRead(id), markAllAsRead(), deleteNotification(id)
}
```

### 4. Componente — `src/components/notifications/NotificationBell.tsx`
- Ícono de campana en TopNavigation con badge de conteo
- Dropdown con lista de notificaciones recientes
- Indicador de punto rojo para no leídas
- Click en notificación → navega a `action_url`
- Botón "Ver todas" → página de notificaciones

### 5. Componente — `src/components/notifications/NotificationCenter.tsx`
- Página completa de notificaciones
- Filtros: todas, no leídas, por categoría
- Acciones bulk: marcar todas como leídas
- Historial de notificaciones (últimos 30 días)

### 6. Componente — `src/components/notifications/NotificationToast.tsx`
- Toast automático cuando llega notificación nueva
- Diferente estilo según prioridad (normal=azul, high=naranja, urgent=rojo)
- Auto-dismiss: 5 seg (normal), 10 seg (high), manual (urgent)
- Click en toast → navega a la acción

### 7. Categorías de Notificaciones
```typescript
export const NOTIFICATION_CATEGORIES = {
  TRAINING_REMINDER: { label: "Recordatorios de entrenamiento", icon: "🏋️" },
  COMPETITION_UPDATE: { label: "Actualizaciones de competencia", icon: "🏆" },
  PAYMENT_ALERT: { label: "Alertas de pago", icon: "💰" },
  ATTENDANCE_ALERT: { label: "Alertas de asistencia", icon: "📋" },
  MEDICAL_ALERT: { label: "Alertas médicas", icon: "🏥" },
  AGENT_MESSAGE: { label: "Mensajes de agentes IA", icon: "🤖" },
  SYSTEM: { label: "Sistema", icon: "⚙️" },
}
```

## Anti-spam
- Máximo 1 notificación por categoría por usuario en 1 hora
- Quiet hours respetadas (no notificaciones entre 22:00-07:00 excepto urgentes)
- Agrupación: múltiples eventos similares → 1 notificación resumen
