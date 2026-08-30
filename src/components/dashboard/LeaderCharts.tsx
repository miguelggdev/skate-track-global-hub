import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentClub } from '@/hooks/useCurrentClub';

const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }
};

// ── Salud del Club: cada eje es un % real derivado de datos existentes,
// no un índice inventado. Fórmula de cada uno documentada al lado.
function useClubHealth(clubId: string | undefined, targetRevenue: number | null) {
  return useQuery({
    queryKey: ['leader-club-health', clubId],
    queryFn: async () => {
      const today = new Date();
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const days30Ago = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const days90Ago = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [
        incomeRes, athletesActiveRes, athletesTotalRes,
        attendanceRes, docsVigentesRes, docsTotalRes,
        equipmentOkRes, equipmentTotalRes, recentResultsRes,
      ] = await Promise.all([
        supabase.from('financial_transactions').select('amount').gt('amount', 0).gte('transaction_date', monthStart),
        supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('athletes').select('id', { count: 'exact', head: true }),
        supabase.from('training_attendance').select('attended').gte('created_at', days30Ago),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('doc_status', 'vigente'),
        supabase.from('documents').select('id', { count: 'exact', head: true }).neq('doc_status', 'no_aplica'),
        supabase.from('equipment').select('id', { count: 'exact', head: true }).in('status', ['available', 'assigned']),
        supabase.from('equipment').select('id', { count: 'exact', head: true }),
        supabase.from('competition_results').select('athlete_id').gte('created_at', days90Ago),
      ]);

      const income = (incomeRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const finanzas = targetRevenue ? Math.min(100, Math.round((income / targetRevenue) * 100)) : 0;

      const attendanceRows = attendanceRes.data ?? [];
      const asistencia = attendanceRows.length > 0
        ? Math.round((attendanceRows.filter(r => r.attended).length / attendanceRows.length) * 100)
        : 0;

      const docsTotal = docsTotalRes.count ?? 0;
      const documentos = docsTotal > 0 ? Math.round(((docsVigentesRes.count ?? 0) / docsTotal) * 100) : 0;

      const athletesTotal = athletesTotalRes.count ?? 0;
      const retencion = athletesTotal > 0 ? Math.round(((athletesActiveRes.count ?? 0) / athletesTotal) * 100) : 0;

      const equipTotal = equipmentTotalRes.count ?? 0;
      const equipos = equipTotal > 0 ? Math.round(((equipmentOkRes.count ?? 0) / equipTotal) * 100) : 0;

      const activeAthletes = athletesActiveRes.count ?? 0;
      const athletesWithRecentResult = new Set((recentResultsRes.data ?? []).map(r => r.athlete_id)).size;
      const rendimiento = activeAthletes > 0 ? Math.round((athletesWithRecentResult / activeAthletes) * 100) : 0;

      return [
        { axis: 'Finanzas', score: finanzas },
        { axis: 'Rendimiento', score: rendimiento },
        { axis: 'Asistencia', score: asistencia },
        { axis: 'Documentos', score: documentos },
        { axis: 'Retención', score: retencion },
        { axis: 'Equipos', score: equipos },
      ];
    },
    enabled: !!clubId,
  });
}

interface StrategicAlert {
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

function useStrategicAlerts() {
  return useQuery<StrategicAlert[]>({
    queryKey: ['leader-strategic-alerts'],
    queryFn: async () => {
      const days30Ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [expiredDocs, overdueInvoices, maintenanceEquip] = await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('doc_status', 'vencido'),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['draft', 'sent']).lt('due_date', days30Ago.split('T')[0]),
        supabase.from('equipment').select('id', { count: 'exact', head: true }).eq('status', 'maintenance'),
      ]);

      const alerts: StrategicAlert[] = [];
      if ((expiredDocs.count ?? 0) > 0) {
        alerts.push({ level: 'high', title: 'Documentos vencidos', description: `${expiredDocs.count} atletas con documentación expirada` });
      }
      if ((overdueInvoices.count ?? 0) > 0) {
        alerts.push({ level: 'medium', title: 'Cuotas pendientes', description: `${overdueInvoices.count} facturas con +30 días de mora` });
      }
      if ((maintenanceEquip.count ?? 0) > 0) {
        alerts.push({ level: 'low', title: 'Equipos en mantenimiento', description: `${maintenanceEquip.count} equipos pendientes` });
      }
      return alerts;
    },
  });
}

function useAnnualTrend() {
  return useQuery({
    queryKey: ['leader-annual-trend'],
    queryFn: async () => {
      const months: { key: string; label: string }[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleDateString('es', { month: 'short' }),
        });
      }
      const rangeStart = `${months[0].key}-01`;

      const [athletesRes, transactionsRes, attendanceRes] = await Promise.all([
        supabase.from('athletes').select('created_at'),
        supabase.from('financial_transactions').select('amount, transaction_date').gte('transaction_date', rangeStart),
        supabase.from('training_attendance').select('attended, created_at').gte('created_at', rangeStart),
      ]);

      const athletes = athletesRes.data ?? [];
      const transactions = transactionsRes.data ?? [];
      const attendance = attendanceRes.data ?? [];

      return months.map(({ key, label }) => {
        const monthEnd = `${key}-31`;
        const atletas = athletes.filter(a => a.created_at.slice(0, 7) <= key).length;
        const ingresos = transactions
          .filter(t => t.transaction_date.slice(0, 7) === key && Number(t.amount) > 0)
          .reduce((s, t) => s + Number(t.amount), 0);
        const monthAttendance = attendance.filter(a => a.created_at.slice(0, 7) === key);
        const asistencia = monthAttendance.length > 0
          ? Math.round((monthAttendance.filter(a => a.attended).length / monthAttendance.length) * 100)
          : 0;
        return { mes: label, atletas, ingresos, asistencia };
      });
    },
  });
}

function useExecutiveKPIs(clubId: string | undefined) {
  return useQuery({
    queryKey: ['leader-executive-kpis', clubId],
    queryFn: async () => {
      const days90Ago = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      })();

      const [
        totalRes, activeRes, newRes, registrationsRes, transactionsRes,
      ] = await Promise.all([
        supabase.from('athletes').select('id', { count: 'exact', head: true }),
        supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('athletes').select('id', { count: 'exact', head: true }).gte('created_at', days90Ago),
        supabase.from('competition_registrations').select('athlete_id'),
        supabase.from('financial_transactions').select('amount').gte('transaction_date', monthStart),
      ]);

      const total = totalRes.count ?? 0;
      const active = activeRes.count ?? 0;
      const newAthletes = newRes.count ?? 0;
      const crecimiento = total > 0 ? Math.round((newAthletes / total) * 100) : 0;
      const retencion = total > 0 ? Math.round((active / total) * 100) : 0;

      const registeredAthletes = new Set((registrationsRes.data ?? []).map(r => r.athlete_id)).size;
      const participacion = active > 0 ? Math.round((registeredAthletes / active) * 100) : 0;

      const income = (transactionsRes.data ?? []).filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
      const expenses = Math.abs((transactionsRes.data ?? []).filter(t => Number(t.amount) < 0).reduce((s, t) => s + Number(t.amount), 0));
      const roi = expenses > 0 ? `${(income / expenses).toFixed(1)}x` : income > 0 ? '∞' : '—';

      return [
        { label: 'Crecimiento atletas', value: `+${crecimiento}%`, desc: 'nuevos en los últimos 90 días', trend: 'up' as const },
        { label: 'Retención activa', value: `${retencion}%`, desc: 'atletas activos sobre el total', trend: retencion >= 80 ? 'up' as const : 'stable' as const },
        { label: 'Tasa de participación', value: `${participacion}%`, desc: 'atletas activos inscritos a competencias', trend: 'stable' as const },
        { label: 'ROI del mes', value: roi, desc: 'ingresos / gastos operativos', trend: 'stable' as const },
      ];
    },
    enabled: !!clubId,
  });
}

function AlertBadge({ level }: { level: StrategicAlert['level'] }) {
  const cfg = {
    high: { label: 'Alta', cls: 'bg-red-500/15 text-red-600 border-red-500/30' },
    medium: { label: 'Media', cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
    low: { label: 'Baja', cls: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  }[level];
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

export function LeaderClubHealthRadar() {
  const { club } = useCurrentClub();
  const { data = [], isLoading } = useClubHealth(club?.id, club?.target_revenue ?? null);
  const avg = data.length ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">Salud del Club</CardTitle>
          <CardDescription>Índice compuesto por dimensión</CardDescription>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black tabular-nums ${avg >= 80 ? 'text-emerald-500' : avg >= 65 ? 'text-amber-500' : 'text-red-500'}`}>{avg}</p>
          <p className="text-[10px] text-muted-foreground">de 100</p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-56 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
                <Tooltip {...TT} formatter={(v: number) => [`${v}/100`, 'Puntaje']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LeaderAnnualTrend() {
  const { data = [], isLoading } = useAnnualTrend();
  return (
    <Card className="animate-fade-in delay-75">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Tendencia Anual</CardTitle>
        <CardDescription>Crecimiento de atletas e ingresos</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-56 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip {...TT} formatter={(v: number, n: string) => {
                  if (n === 'Atletas') return [`${v}`, n];
                  if (n === 'Ingresos') return [`$${v.toLocaleString()}`, n];
                  return [`${v}%`, n];
                }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="atletas" name="Atletas" fill="#f97316" radius={[4,4,0,0]} opacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="ingresos" name="Ingresos" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} />
                <Line yAxisId="left" type="monotone" dataKey="asistencia" name="Asistencia%" stroke="#10b981" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LeaderStrategicAlerts() {
  const { data = [], isLoading } = useStrategicAlerts();
  return (
    <Card className="animate-fade-in delay-150">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alertas Estratégicas
        </CardTitle>
        <CardDescription>Prioridades de gestión</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin alertas pendientes</p>
        ) : (
          data.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
              <AlertBadge level={a.level} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function LeaderExecutiveKPIs() {
  const { club } = useCurrentClub();
  const { data: kpis = [], isLoading } = useExecutiveKPIs(club?.id);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4 h-20 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k, i) => (
        <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <div className="flex items-end gap-1 mt-1">
              <p className="text-xl font-black text-foreground">{k.value}</p>
              {k.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500 mb-0.5" />}
              {k.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mb-0.5" />}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{k.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
