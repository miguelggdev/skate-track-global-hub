# /dashboard-upgrade [rol] — Mejorar Dashboard de un Rol

Mejora el dashboard de un rol específico con datos reales, nuevas métricas, diseño mejorado y widgets de agentes IA.

## Uso
```
/dashboard-upgrade admin    # Mejora AdminDashboard.tsx
/dashboard-upgrade coach    # Mejora CoachDashboard.tsx
/dashboard-upgrade athlete  # Mejora AthleteDashboard.tsx
/dashboard-upgrade finance  # Mejora FinanceDashboard.tsx
/dashboard-upgrade leader   # Mejora LeaderDashboard.tsx
```

## Mejoras por Dashboard

### Admin Dashboard (`src/pages/AdminDashboard.tsx`)
**Problemas actuales:** Console.log en producción, datos parciales, sin widget IA

**Mejoras:**
1. Remover todos los `console.log` del componente
2. Añadir 4 KPIs adicionales: próxima competencia, morosos, documentos vencidos, sesiones hoy
3. Cada KPI Card con: sparkline de tendencia, % vs meta, ícono de estado semáforo
4. Nuevo componente: `AlertsPanel.tsx` — lista priorizada de alertas activas
5. Nuevo componente: `TodaySchedule.tsx` — agenda del día con sesiones y eventos
6. Widget `ChatWidget` del agente admin integrado en esquina inferior derecha
7. Feed de actividad reciente (Supabase Realtime)
8. Contador regresivo a próxima competencia
9. Tabla de morosos top 5 con botón "Enviar recordatorio" inline

### Coach Dashboard (`src/pages/CoachDashboard.tsx`)
**Problema crítico:** Todos los datos son MOCK hardcodeados

**Mejoras:**
1. Conectar a BD real: `useAthletes()`, `useTrainingSessions()`, `useTrainingStats()`
2. Semáforo de carga de entrenamiento por atleta (verde/amarillo/rojo)
3. Gráfica de progreso de tiempos de los últimos 8 atletas mejor rendimiento
4. Widget de chat con Agente Entrenador IA (AG-02)
5. Botón "Generar Plan Semanal con IA" → abre `/training-plan-gen`
6. Vista de asistencia de hoy con registro rápido
7. Alertas de atletas con ≥2 inasistencias consecutivas

### Finance Dashboard (`src/pages/FinanceDashboard.tsx`)
**Problema crítico:** Datos hardcodeados, sin conexión real

**Mejoras:**
1. Conectar a BD: `useFinancialTransactions()`, `useAthletePaymentStatus()`
2. KPIs reales: ingresos reales del mes, gastos reales, pendientes de cobro
3. Gráfica de ingresos vs egresos (real) con proyección
4. Lista de morosos con días vencidos y monto
5. Widget chat Agente Financiero (AG-07)
6. Botón "Generar cierre de mes" con IA

## Componentes Nuevos a Crear

### `src/components/dashboard/KPICard.tsx` (mejorado)
```typescript
interface KPICardProps {
  title: string
  value: string | number
  target?: number
  trend?: number        // % cambio vs período anterior
  sparklineData?: number[]
  status?: 'good' | 'warning' | 'danger'
  icon: LucideIcon
  actionLabel?: string
  onAction?: () => void
}
```

### `src/components/dashboard/AlertsPanel.tsx`
Lista de alertas del sistema ordenadas por prioridad con iconos de tipo y acciones inline.

### `src/components/dashboard/TodaySchedule.tsx`
Timeline del día con sesiones de entrenamiento, eventos y recordatorios.

### `src/components/dashboard/ActivityFeed.tsx`
Feed en tiempo real de últimas acciones: registros, pagos, resultados, asistencias.

## Diseño
- Cards con sombra suave y hover effect
- Glassmorphism para el widget de chat
- Colores semánticos: verde (#22c55e), amarillo (#eab308), rojo (#ef4444)
- Animaciones con Framer Motion (o tailwindcss-animate)
- Skeleton loaders mientras cargan los datos
