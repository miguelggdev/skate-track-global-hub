import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }
};

const CATEGORY_LABELS: Record<string, string> = {
  escuela: 'Escuela',
  menores: 'Menores',
  transicion: 'Transición',
  prejuvenil: 'Prejuvenil',
  juvenil: 'Juvenil',
  mayores: 'Mayores',
  preclub: 'Preclub',
  adultos: 'Adultos',
};

const OP_ICON: Record<string, string> = { INSERT: '✅', UPDATE: '✏️', DELETE: '🗑️' };
const TABLE_LABEL: Record<string, string> = {
  athletes: 'Atleta',
  competitions: 'Competencia',
  training_sessions: 'Sesión',
  transactions: 'Transacción',
  awards: 'Premio',
  competition_registrations: 'Inscripción',
  profiles: 'Usuario',
  documents: 'Documento',
};

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${d}d`;
}

function auditAction(operation: string, tableName: string): string {
  const op = (operation ?? '').toUpperCase();
  const table = TABLE_LABEL[tableName] ?? tableName;
  if (op === 'INSERT') return `${table} registrado`;
  if (op === 'UPDATE') return `${table} actualizado`;
  if (op === 'DELETE') return `${table} eliminado`;
  return `${table} modificado`;
}

export function AdminClubHealthRadar() {
  const { data } = useQuery({
    queryKey: ['club-health-radar'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [
        athletesRes, transactionsRes,
        attendanceRes, docsRes, equipmentRes,
      ] = await Promise.all([
        supabase.from('athletes').select('id, user_id, status, performance_score'),
        supabase.from('financial_transactions').select('payment_status'),
        supabase
          .from('training_attendance')
          .select('attended')
          .gte('created_at', monthStart),
        supabase.from('user_documents').select('user_id').not('document_url', 'is', null),
        supabase.from('athlete_equipment').select('athlete_id'),
      ]);

      return {
        athletes:    athletesRes.data    ?? [],
        transactions: transactionsRes.data ?? [],
        attendance:  attendanceRes.data  ?? [],
        docs:        docsRes.data        ?? [],
        equipment:   equipmentRes.data   ?? [],
      };
    },
  });

  const athletes     = data?.athletes    ?? [];
  const transactions = data?.transactions ?? [];
  const attendance   = data?.attendance  ?? [];
  const docs         = data?.docs        ?? [];
  const equipment    = data?.equipment   ?? [];

  const totalAthletes  = athletes.length;
  const activeAthletes = athletes.filter(a => a.status === 'active').length;
  const retention      = totalAthletes > 0 ? Math.round((activeAthletes / totalAthletes) * 100) : 0;

  const totalTx = transactions.length;
  const paidTx  = transactions.filter(t => t.payment_status === 'paid').length;
  const finanzas = totalTx > 0 ? Math.round((paidTx / totalTx) * 100) : 0;

  const avgPerformance = activeAthletes > 0
    ? Math.min(100, Math.round(
        athletes
          .filter(a => a.status === 'active')
          .reduce((s, a) => s + (a.performance_score ?? 0), 0) / activeAthletes
      ))
    : 0;

  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.attended).length / attendance.length) * 100)
    : 0;

  const userIdsWithDocs = new Set(docs.map(d => d.user_id));
  const athletesWithDocs = athletes.filter(a => a.user_id && userIdsWithDocs.has(a.user_id)).length;
  const documentos = totalAthletes > 0
    ? Math.round((athletesWithDocs / totalAthletes) * 100)
    : 0;

  const athleteIdsWithEquip = new Set(equipment.map(e => e.athlete_id));
  const equipos = totalAthletes > 0
    ? Math.round((athleteIdsWithEquip.size / totalAthletes) * 100)
    : 0;

  const HEALTH_DATA = [
    { axis: 'Finanzas',    score: finanzas },
    { axis: 'Rendimiento', score: avgPerformance },
    { axis: 'Asistencia',  score: attendanceRate },
    { axis: 'Documentos',  score: documentos },
    { axis: 'Retención',   score: retention },
    { axis: 'Equipos',     score: equipos },
  ];

  const avg = Math.round(HEALTH_DATA.reduce((s, d) => s + d.score, 0) / HEALTH_DATA.length);
  const healthLabel = avg >= 80 ? 'Excelente' : avg >= 65 ? 'Bueno' : 'Necesita atención';
  const healthColor = avg >= 80 ? 'text-emerald-500' : avg >= 65 ? 'text-amber-500' : 'text-red-500';

  return (
    <Card className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Salud del Club
          </CardTitle>
          <CardDescription>Índice multidimensional de desempeño</CardDescription>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-black tabular-nums ${healthColor}`}>{avg}</p>
          <p className={`text-xs font-medium ${healthColor}`}>{healthLabel}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={HEALTH_DATA} margin={{ top: 10, right: 24, left: 24, bottom: 10 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2.5} dot={{ fill: '#f97316', r: 3 }} />
                <Tooltip {...TT} formatter={(v: number) => [`${v}/100`, 'Puntaje']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 content-center">
            {HEALTH_DATA.map((d) => {
              const pct = d.score;
              const color = pct >= 80 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444';
              return (
                <div key={d.axis} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{d.axis}</span>
                    <span className="font-semibold tabular-nums" style={{ color }}>{pct}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminGenderDistribution() {
  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-gender-distribution'],
    queryFn: async () => {
      const { data } = await supabase
        .from('athletes')
        .select('category, gender')
        .eq('status', 'active');
      return data ?? [];
    },
  });

  const categorySet = new Set(athletes.map(a => a.category).filter(Boolean));
  const chartData = [...categorySet].map(cat => ({
    categoria: CATEGORY_LABELS[cat as string] ?? cat,
    masculino: athletes.filter(a => a.category === cat && a.gender === 'masculino').length,
    femenino: athletes.filter(a => a.category === cat && a.gender === 'femenino').length,
  }));

  return (
    <Card className="animate-slide-up delay-75">
      <CardHeader>
        <CardTitle className="text-base">Atletas por Categoría y Género</CardTitle>
        <CardDescription>Distribución demográfica del club</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Sin datos de atletas activos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="categoria" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={v => v === 'masculino' ? 'Masculino' : 'Femenino'} />
                <Bar dataKey="masculino" name="masculino" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="femenino" name="femenino" fill="#ec4899" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminMemberGrowth() {
  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-member-growth'],
    queryFn: async () => {
      const { data } = await supabase
        .from('athletes')
        .select('created_at')
        .order('created_at');
      return data ?? [];
    },
  });

  const now = new Date();
  const growthData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const count = athletes.filter(a => a.created_at <= endOfMonth).length;
    const mes = d.toLocaleDateString('es-CO', { month: 'short' });
    return { mes: mes.charAt(0).toUpperCase() + mes.slice(1), atletas: count };
  });

  return (
    <Card className="animate-slide-up delay-150">
      <CardHeader>
        <CardTitle className="text-base">Crecimiento de Miembros</CardTitle>
        <CardDescription>Últimos 12 meses (acumulado)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 'auto']} allowDecimals={false} />
              <Tooltip {...TT} formatter={(v: number) => [`${v} atletas`, 'Total']} />
              <Line type="monotone" dataKey="atletas" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminAuditFeed() {
  const { data: auditRows = [] } = useQuery({
    queryKey: ['audit-feed'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_log')
        .select('id, operation, performed_at, performed_by, table_name')
        .order('performed_at', { ascending: false })
        .limit(10);
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  return (
    <Card className="animate-slide-up delay-225">
      <CardHeader>
        <CardTitle className="text-base">Actividad Reciente</CardTitle>
        <CardDescription>Últimas acciones del sistema</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {auditRows.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Sin actividad registrada
          </div>
        ) : (
          <div className="divide-y divide-border">
            {auditRows.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <span className="text-base">{OP_ICON[entry.operation?.toUpperCase()] ?? '📝'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{auditAction(entry.operation, entry.table_name)}</p>
                  <p className="text-xs text-muted-foreground">{entry.performed_by ?? 'Sistema'}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgoShort(entry.performed_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
