import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Calendar, DollarSign, Users, Settings, Megaphone, BarChart2,
  Shield, MessageCircle, Receipt, Activity, Zap, AlertCircle,
  CheckCircle2, XCircle, Clock, RefreshCw, SlidersHorizontal, Lock,
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? `Bearer ${session.access_token}` : '';
}

// ── Catalog ───────────────────────────────────────────────────────────────────

type ParamDef = {
  key: string;
  label: string;
  type: 'number' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  description?: string;
};

interface AutomationDef {
  id: string;
  label: string;
  category: string;
  description: string;
  scheduleLabel: string;
  isEventDriven: boolean;
  params: ParamDef[];
}

const CATALOG: AutomationDef[] = [
  { id: 'AUTO-01', label: 'Recordatorio entrenamiento día siguiente', category: 'calendar', description: 'Notifica a atletas sobre entrenamientos del día siguiente', scheduleLabel: 'Diario 19:00', isEventDriven: false, params: [{ key: 'days_ahead', label: 'Días de anticipación', type: 'number', min: 1, max: 7 }] },
  { id: 'AUTO-02', label: 'Recordatorio 2 horas antes', category: 'calendar', description: 'Aviso 2 horas antes del inicio de cada sesión', scheduleLabel: 'Cada 30 min', isEventDriven: false, params: [{ key: 'hours_ahead', label: 'Horas de anticipación', type: 'number', min: 1, max: 12 }, { key: 'window_minutes', label: 'Ventana (min)', type: 'number', min: 10, max: 60 }] },
  { id: 'AUTO-03', label: 'Detección huecos en calendario', category: 'calendar', description: 'Detecta días sin entrenamiento en las próximas semanas', scheduleLabel: 'Lunes 08:00', isEventDriven: false, params: [{ key: 'lookahead_weeks', label: 'Semanas a revisar', type: 'number', min: 1, max: 12 }, { key: 'min_gap_days', label: 'Días mínimos sin entrenamiento', type: 'number', min: 2, max: 14 }] },
  { id: 'AUTO-04', label: 'Notificación ausencia', category: 'calendar', description: 'Alerta cuando un atleta acumula ausencias consecutivas', scheduleLabel: 'Evento: cambio asistencia', isEventDriven: true, params: [{ key: 'consecutive_threshold', label: 'Ausencias consecutivas para alerta', type: 'number', min: 1, max: 10 }] },
  { id: 'AUTO-05', label: 'Gestión lista de espera', category: 'calendar', description: 'Mueve atletas de lista de espera cuando hay cupos disponibles', scheduleLabel: 'Evento: cambio asistencia', isEventDriven: true, params: [] },
  { id: 'AUTO-06', label: 'Análisis carga semanal', category: 'calendar', description: 'Detecta sobrecarga o subcarga en el volumen de entrenamiento', scheduleLabel: 'Viernes 20:00', isEventDriven: false, params: [{ key: 'max_weekly_hours', label: 'Horas máx./semana', type: 'number', min: 5, max: 40 }] },
  { id: 'AUTO-07', label: 'Recibo automático de pago', category: 'finance', description: 'Genera y envía recibo al recibir un pago', scheduleLabel: 'Evento: pago recibido', isEventDriven: true, params: [] },
  { id: 'AUTO-08', label: 'Alertas cartera morosa', category: 'finance', description: 'Notifica pagos vencidos en tres niveles de urgencia', scheduleLabel: '1° y 15° de cada mes 09:00', isEventDriven: false, params: [{ key: 'days_warning', label: 'Días para aviso (amarillo)', type: 'number', min: 7, max: 60 }, { key: 'days_critical', label: 'Días para alerta (naranja)', type: 'number', min: 15, max: 90 }, { key: 'days_urgent', label: 'Días para urgente (rojo)', type: 'number', min: 30, max: 180 }] },
  { id: 'AUTO-09', label: 'Cierre de caja diario', category: 'finance', description: 'Resumen financiero del día al administrador', scheduleLabel: 'Diario 22:00', isEventDriven: false, params: [] },
  { id: 'AUTO-10', label: 'Proyección financiera mensual', category: 'finance', description: 'Proyecta ingresos y egresos para los próximos meses', scheduleLabel: 'Días 28-31 18:00', isEventDriven: false, params: [{ key: 'projection_months', label: 'Meses a proyectar', type: 'number', min: 1, max: 12 }] },
  { id: 'AUTO-11', label: 'Renovación de membresía', category: 'finance', description: 'Alerta sobre membresías próximas a vencer', scheduleLabel: 'Diario 08:00', isEventDriven: false, params: [{ key: 'days_before_expiry', label: 'Días antes de vencer (aviso)', type: 'number', min: 7, max: 60 }, { key: 'days_urgent', label: 'Días antes de vencer (urgente)', type: 'number', min: 1, max: 30 }] },
  { id: 'AUTO-12', label: 'Seguimiento post-competencia', category: 'athletes', description: 'Analiza resultados y envía retroalimentación tras una competencia', scheduleLabel: 'Evento: resultado competencia', isEventDriven: true, params: [{ key: 'followup_hours', label: 'Horas de demora para análisis', type: 'number', min: 1, max: 48 }] },
  { id: 'AUTO-13', label: 'Recordatorio evaluación semestral', category: 'athletes', description: 'Alerta cuando un atleta lleva más de N meses sin evaluación', scheduleLabel: 'Lunes 10:00', isEventDriven: false, params: [{ key: 'evaluation_months', label: 'Meses entre evaluaciones', type: 'number', min: 1, max: 12 }] },
  { id: 'AUTO-14', label: 'Protocolo de lesión', category: 'athletes', description: 'Activa protocolo de seguimiento médico al registrar una lesión', scheduleLabel: 'Evento: sesión médica', isEventDriven: true, params: [] },
  { id: 'AUTO-15', label: 'Monitoreo de progreso semanal', category: 'athletes', description: 'Analiza la evolución de los tiempos y envía reporte de progreso', scheduleLabel: 'Lunes 07:00', isEventDriven: false, params: [{ key: 'lookback_weeks', label: 'Semanas a analizar', type: 'number', min: 1, max: 12 }] },
  { id: 'AUTO-16', label: 'Briefing matutino', category: 'admin', description: 'Resumen del día para admin y líderes al inicio de la jornada', scheduleLabel: 'Lun-Vie 07:30', isEventDriven: false, params: [] },
  { id: 'AUTO-17', label: 'Resumen fin de día', category: 'admin', description: 'Consolidado de actividades del día para el equipo directivo', scheduleLabel: 'Lun-Sáb 21:00', isEventDriven: false, params: [] },
  { id: 'AUTO-18', label: 'Documentos próximos a vencer', category: 'admin', description: 'Alerta sobre documentos que vencen en los próximos días', scheduleLabel: 'Diario 09:00', isEventDriven: false, params: [{ key: 'warning_days', label: 'Días para aviso anticipado', type: 'number', min: 7, max: 60 }, { key: 'urgent_days', label: 'Días para alerta urgente', type: 'number', min: 1, max: 30 }] },
  { id: 'AUTO-19', label: 'Control de inventario', category: 'admin', description: 'Alerta cuando el stock de equipamiento está bajo', scheduleLabel: 'Lunes 06:00', isEventDriven: false, params: [{ key: 'low_stock_threshold', label: 'Unidades mínimas antes de alerta', type: 'number', min: 1, max: 20 }] },
  { id: 'AUTO-20', label: 'Documentos nuevo atleta', category: 'admin', description: 'Solicita documentación al inscribir un nuevo atleta', scheduleLabel: 'Evento: nuevo atleta', isEventDriven: true, params: [] },
  { id: 'AUTO-21', label: 'Felicitaciones de cumpleaños', category: 'marketing', description: 'Mensaje personalizado de cumpleaños a cada atleta', scheduleLabel: 'Diario 07:00', isEventDriven: false, params: [] },
  { id: 'AUTO-22', label: 'Reactivación de inactivos', category: 'marketing', description: 'Contacta atletas que llevan tiempo sin asistir', scheduleLabel: '1° y 15° de cada mes 10:00', isEventDriven: false, params: [{ key: 'inactive_days', label: 'Días de inactividad para contactar', type: 'number', min: 14, max: 180 }] },
  { id: 'AUTO-23', label: 'Encuesta de satisfacción', category: 'marketing', description: 'Envía encuesta trimestral a toda la comunidad del club', scheduleLabel: 'Trimestral 1° del mes', isEventDriven: false, params: [] },
  { id: 'AUTO-24', label: 'Solicitud de testimonio', category: 'marketing', description: 'Pide testimonio a atletas con buen resultado en competencia', scheduleLabel: 'Evento: resultado competencia', isEventDriven: true, params: [{ key: 'delay_hours', label: 'Horas de espera antes de solicitar', type: 'number', min: 1, max: 72 }, { key: 'min_position', label: 'Posición máxima para solicitar (1=solo 1°)', type: 'number', min: 1, max: 10 }] },
  { id: 'AUTO-25', label: 'Campaña pre-inscripción', category: 'marketing', description: 'Campaña anual para captar nuevos atletas', scheduleLabel: '1 Octubre 09:00', isEventDriven: false, params: [] },
  { id: 'AUTO-26', label: 'Reporte semanal directivo', category: 'reporting', description: 'Resumen ejecutivo semanal del club', scheduleLabel: 'Domingo 20:00', isEventDriven: false, params: [] },
  { id: 'AUTO-27', label: 'Reporte mensual de rendimiento', category: 'reporting', description: 'Análisis mensual de KPIs deportivos y financieros', scheduleLabel: '1° del mes 08:00', isEventDriven: false, params: [] },
  { id: 'AUTO-28', label: 'Documentación federativa', category: 'reporting', description: 'Genera informes para la FCP y entes de control', scheduleLabel: '1 Agosto 09:00', isEventDriven: false, params: [] },
  { id: 'AUTO-29', label: 'Análisis predictivo', category: 'reporting', description: 'Predicciones de rendimiento y riesgo de deserción', scheduleLabel: 'Domingo 23:00', isEventDriven: false, params: [{ key: 'lookback_months', label: 'Meses de historial a analizar', type: 'number', min: 3, max: 24 }] },
  { id: 'AUTO-30', label: 'Detección accesos sospechosos', category: 'security', description: 'Alerta sobre patrones de acceso anómalos', scheduleLabel: 'Evento: acceso sospechoso', isEventDriven: true, params: [{ key: 'max_failures', label: 'Intentos fallidos para alerta', type: 'number', min: 3, max: 20 }, { key: 'window_minutes', label: 'Ventana de tiempo (min)', type: 'number', min: 5, max: 60 }] },
  { id: 'AUTO-31', label: 'Verificación de backups', category: 'security', description: 'Verifica la integridad de los backups automáticos', scheduleLabel: 'Diario 03:00', isEventDriven: false, params: [] },
  { id: 'AUTO-32', label: 'Auditoría de datos sensibles', category: 'security', description: 'Detecta operaciones anómalas sobre datos de atletas', scheduleLabel: 'Domingo 04:00', isEventDriven: false, params: [{ key: 'anomaly_threshold', label: 'Operaciones/día para considerar anómalo', type: 'number', min: 10, max: 500 }] },
  { id: 'AUTO-33', label: 'Rotación sesiones inactivas', category: 'security', description: 'Cierra sesiones de usuarios con inactividad prolongada', scheduleLabel: 'Diario 02:00', isEventDriven: false, params: [{ key: 'inactive_days', label: 'Días de inactividad para cerrar sesión', type: 'number', min: 7, max: 90 }] },
  { id: 'AUTO-34', label: 'Notificaciones en tiempo real', category: 'security', description: 'Envía alertas críticas de seguridad inmediatamente', scheduleLabel: 'Evento: acceso sospechoso', isEventDriven: true, params: [] },
  { id: 'AUTO-35', label: 'Resumen actividad de agentes IA', category: 'security', description: 'Consolida la actividad diaria de todos los agentes', scheduleLabel: 'Diario 23:30', isEventDriven: false, params: [] },
  { id: 'AUTO-36-WA', label: 'Frase motivadora WhatsApp', category: 'whatsapp', description: 'Envía frase motivadora diaria por WhatsApp a atletas activos', scheduleLabel: 'Diario 08:30', isEventDriven: false, params: [] },
  { id: 'AUTO-36-BIL', label: 'Generación de cuotas mensuales', category: 'billing', description: 'Crea las cuotas del mes y notifica a los responsables de pago', scheduleLabel: '1° del mes 07:00', isEventDriven: false, params: [{ key: 'billing_day', label: 'Día de generación', type: 'number', min: 1, max: 5 }, { key: 'due_day_of_month', label: 'Día de vencimiento', type: 'number', min: 5, max: 28 }] },
  { id: 'AUTO-37', label: 'Recordatorios de pago', category: 'billing', description: 'Recordatorios escalonados antes y después del vencimiento', scheduleLabel: 'Diario 09:00', isEventDriven: false, params: [{ key: 'pre_due_days', label: 'Días antes del vencimiento para recordar', type: 'number', min: 1, max: 14 }, { key: 'overdue_cycle_days', label: 'Ciclo de recordatorio vencido (días)', type: 'number', min: 1, max: 30 }] },
];

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  calendar:  { label: 'Calendario',    icon: Calendar,       color: 'text-blue-400' },
  finance:   { label: 'Finanzas',      icon: DollarSign,     color: 'text-green-400' },
  athletes:  { label: 'Atletas',       icon: Users,          color: 'text-purple-400' },
  admin:     { label: 'Administración',icon: Settings,       color: 'text-gray-400' },
  marketing: { label: 'Marketing',     icon: Megaphone,      color: 'text-pink-400' },
  reporting: { label: 'Reportería',    icon: BarChart2,      color: 'text-amber-400' },
  security:  { label: 'Seguridad',     icon: Shield,         color: 'text-red-400' },
  whatsapp:  { label: 'WhatsApp',      icon: MessageCircle,  color: 'text-emerald-400' },
  billing:   { label: 'Facturación',   icon: Receipt,        color: 'text-orange-400' },
};

// ── API ───────────────────────────────────────────────────────────────────────

interface AutomationConfig {
  automation_id: string;
  enabled: boolean;
  schedule_hour: number | null;
  schedule_minute: number | null;
  custom_params: Record<string, unknown>;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  automation_id: string;
  agent_id: string;
  status: 'success' | 'error' | 'skipped';
  records_found: number;
  actions_taken: number;
  summary: string | null;
  error_message: string | null;
  ran_at: string;
}

async function fetchAutomations(): Promise<AutomationConfig[]> {
  const auth = await getAuthHeader();
  const res = await fetch(`${BACKEND_URL}/api/automations`, { headers: { Authorization: auth } });
  if (!res.ok) throw new Error('Error al cargar automatizaciones');
  const data = await res.json();
  return data.automations as AutomationConfig[];
}

async function fetchLogs(automationId?: string): Promise<ActivityLog[]> {
  const auth = await getAuthHeader();
  const url = automationId
    ? `${BACKEND_URL}/api/automations/logs?limit=100&automation_id=${automationId}`
    : `${BACKEND_URL}/api/automations/logs?limit=100`;
  const res = await fetch(url, { headers: { Authorization: auth } });
  if (!res.ok) throw new Error('Error al cargar historial');
  const data = await res.json();
  return data.logs as ActivityLog[];
}

async function patchAutomation(
  automationId: string,
  payload: Partial<{ enabled: boolean; schedule_hour: number; schedule_minute: number; custom_params: Record<string, unknown> }>
): Promise<void> {
  const auth = await getAuthHeader();
  const res = await fetch(`${BACKEND_URL}/api/automations/${automationId}`, {
    method: 'PATCH',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Error al actualizar');
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  if (status === 'success') return <Badge className="bg-green-500/15 text-green-400 border-green-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Éxito</Badge>;
  if (status === 'error')   return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 gap-1"><XCircle className="h-3 w-3" />Error</Badge>;
  return <Badge className="bg-gray-500/15 text-gray-400 border-gray-500/30 gap-1"><Clock className="h-3 w-3" />{status}</Badge>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AutomationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const isLeader = profile?.role === 'leader';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [configureId, setConfigureId] = useState<string | null>(null);
  const [editParams, setEditParams] = useState<Record<string, unknown>>({});
  const [editEnabled, setEditEnabled] = useState(true);
  const [editHour, setEditHour] = useState<string>('');
  const [editMinute, setEditMinute] = useState<string>('');

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: fetchAutomations,
    staleTime: 30_000,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: () => fetchLogs(),
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      patchAutomation(id, { enabled }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!configureId) return Promise.resolve();
      const payload: Record<string, unknown> = { enabled: editEnabled, custom_params: editParams };
      if (editHour !== '') payload.schedule_hour = Number(editHour);
      if (editMinute !== '') payload.schedule_minute = Number(editMinute);
      return patchAutomation(configureId, payload as Parameters<typeof patchAutomation>[1]);
    },
    onSuccess: () => {
      toast({ title: 'Guardado', description: 'Configuración actualizada' });
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setConfigureId(null);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const configMap = React.useMemo(() => {
    const m: Record<string, AutomationConfig> = {};
    for (const c of configs) m[c.automation_id] = c;
    return m;
  }, [configs]);

  const visibleAutomations = CATALOG.filter(
    a => selectedCategory === 'all' || a.category === selectedCategory
  );

  function openConfigure(def: AutomationDef) {
    const cfg = configMap[def.id];
    setEditEnabled(cfg?.enabled ?? true);
    setEditHour(cfg?.schedule_hour != null ? String(cfg.schedule_hour) : '');
    setEditMinute(cfg?.schedule_minute != null ? String(cfg.schedule_minute) : '');
    const params: Record<string, unknown> = {};
    for (const p of def.params) {
      params[p.key] = cfg?.custom_params?.[p.key] ?? (p.type === 'boolean' ? false : 0);
    }
    setEditParams(params);
    setConfigureId(def.id);
  }

  const configureDef = CATALOG.find(a => a.id === configureId);

  const lastRunMap = React.useMemo(() => {
    const m: Record<string, ActivityLog> = {};
    for (const l of logs) {
      if (!m[l.automation_id]) m[l.automation_id] = l;
    }
    return m;
  }, [logs]);

  return (
    <DashboardLayout title="Panel de Automatizaciones" userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Automatizaciones</h1>
          <p className="text-muted-foreground mt-1 text-sm">Controla y configura las {CATALOG.length} automatizaciones Celery del club</p>
        </div>

        <Tabs defaultValue="automations">
          <TabsList className="mb-4">
            <TabsTrigger value="automations" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />Automatizaciones
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />Historial de Actividad
            </TabsTrigger>
          </TabsList>

          {/* ── Automations tab ────────────────────────────────────────────── */}
          <TabsContent value="automations">
            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                Todas ({CATALOG.length})
              </button>
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const count = CATALOG.filter(a => a.category === key).length;
                const Icon = meta.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === key ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />{meta.label} ({count})
                  </button>
                );
              })}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="h-6 w-6 animate-spin text-orange-400" />
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-8">Estado</TableHead>
                      <TableHead>Automatización</TableHead>
                      <TableHead className="hidden md:table-cell">Horario</TableHead>
                      <TableHead className="hidden lg:table-cell">Último run</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleAutomations.map(def => {
                      const cfg = configMap[def.id];
                      const isEnabled = cfg?.enabled ?? true;
                      const lastRun = lastRunMap[def.id];
                      const CatIcon = CATEGORY_META[def.category]?.icon ?? Zap;
                      const catColor = CATEGORY_META[def.category]?.color ?? 'text-gray-400';
                      return (
                        <TableRow key={def.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={v => !isLeader && toggleMutation.mutate({ id: def.id, enabled: v })}
                              disabled={isLeader || toggleMutation.isPending}
                              className="data-[state=checked]:bg-orange-500"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2.5">
                              <CatIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${catColor}`} />
                              <div>
                                <p className={`text-sm font-medium leading-snug ${!isEnabled ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                  {def.label}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono text-muted-foreground">{def.id}</span>
                                  {def.isEventDriven && (
                                    <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 py-0">event-driven</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {cfg?.schedule_hour != null
                                ? `${String(cfg.schedule_hour).padStart(2, '0')}:${String(cfg?.schedule_minute ?? 0).padStart(2, '0')}`
                                : def.scheduleLabel}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {lastRun ? (
                              <div className="flex items-center gap-2">
                                {statusBadge(lastRun.status)}
                                <span className="text-xs text-muted-foreground">{formatDate(lastRun.ran_at)}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Sin datos</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => openConfigure(def)}
                            >
                              {isLeader ? <Lock className="h-3 w-3" /> : <SlidersHorizontal className="h-3 w-3" />}
                              {isLeader ? 'Ver' : 'Configurar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ── Activity log tab ───────────────────────────────────────────── */}
          <TabsContent value="logs">
            {logsLoading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="h-6 w-6 animate-spin text-orange-400" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Activity className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Sin actividad registrada aún</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Automatización</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden sm:table-cell">Registros</TableHead>
                      <TableHead className="hidden md:table-cell">Acciones</TableHead>
                      <TableHead className="hidden lg:table-cell">Resumen</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => {
                      const def = CATALOG.find(a => a.id === log.automation_id);
                      const CatIcon = def ? (CATEGORY_META[def.category]?.icon ?? Zap) : Zap;
                      const catColor = def ? (CATEGORY_META[def.category]?.color ?? 'text-gray-400') : 'text-gray-400';
                      return (
                        <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CatIcon className={`h-3.5 w-3.5 flex-shrink-0 ${catColor}`} />
                              <div>
                                <p className="text-xs font-medium">{def?.label ?? log.automation_id}</p>
                                <span className="text-[10px] font-mono text-muted-foreground">{log.automation_id}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{statusBadge(log.status)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{log.records_found}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{log.actions_taken}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {log.status === 'error' ? (
                              <span className="text-xs text-red-400 flex items-start gap-1">
                                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {log.error_message?.slice(0, 60)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">{log.summary?.slice(0, 60)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.ran_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Config sheet ──────────────────────────────────────────────────────── */}
      <Sheet open={!!configureId} onOpenChange={open => { if (!open) setConfigureId(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {configureDef && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-lg">{configureDef.label}</SheetTitle>
                <SheetDescription className="text-sm">{configureDef.description}</SheetDescription>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{configureDef.id}</span>
                  {configureDef.isEventDriven && (
                    <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">event-driven</Badge>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-5">
                {/* Enable toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                  <div>
                    <p className="text-sm font-medium">Estado</p>
                    <p className="text-xs text-muted-foreground">{editEnabled ? 'Activa — se ejecuta según horario' : 'Desactivada — no se ejecuta'}</p>
                  </div>
                  <Switch
                    checked={editEnabled}
                    onCheckedChange={setEditEnabled}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>

                {/* Schedule override */}
                {!configureDef.isEventDriven && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Horario de ejecución</p>
                    <p className="text-xs text-muted-foreground">Horario predeterminado: <span className="font-mono">{configureDef.scheduleLabel}</span></p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Hora (0-23)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={23}
                          placeholder="ej: 19"
                          value={editHour}
                          onChange={e => setEditHour(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Minuto (0-59)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={59}
                          placeholder="ej: 0"
                          value={editMinute}
                          onChange={e => setEditMinute(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-amber-400/80">Nota: cambiar la hora aquí permite ajustar la referencia en el sistema. El crontab de Celery Beat requiere reiniciar el worker para reflejar el cambio.</p>
                  </div>
                )}

                {/* Custom params */}
                {configureDef.params.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Parámetros</p>
                    {configureDef.params.map(p => (
                      <div key={p.key} className="space-y-1.5">
                        <Label className="text-xs">{p.label}</Label>
                        {p.type === 'boolean' ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={Boolean(editParams[p.key])}
                              onCheckedChange={v => setEditParams(prev => ({ ...prev, [p.key]: v }))}
                              className="data-[state=checked]:bg-orange-500"
                            />
                            <span className="text-xs text-muted-foreground">{Boolean(editParams[p.key]) ? 'Sí' : 'No'}</span>
                          </div>
                        ) : (
                          <Input
                            type="number"
                            min={p.min}
                            max={p.max}
                            step={p.step ?? 1}
                            value={editParams[p.key] as number ?? 0}
                            onChange={e => setEditParams(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
                            className="h-9"
                          />
                        )}
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {isLeader && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                    <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                    Solo los administradores pueden guardar cambios
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {!isLeader && (
                    <Button
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {saveMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setConfigureId(null)} className={isLeader ? 'w-full' : 'flex-1'}>
                    {isLeader ? 'Cerrar' : 'Cancelar'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
