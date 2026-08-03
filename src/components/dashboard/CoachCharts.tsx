import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Zap, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }
};

const CATEGORY_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

const CATEGORY_KEYS = [
  { key: 'escuela',    label: 'Escuela' },
  { key: 'menores',   label: 'Menores' },
  { key: 'juvenil',   label: 'Juvenil' },
  { key: 'mayores',   label: 'Mayores' },
  { key: 'adultos',   label: 'Adultos' },
];

interface AthleteStatus {
  id: string;
  name: string;
  attendance: number;
  trend: 'up' | 'down' | 'stable';
  lastTime: string;
  status: 'green' | 'yellow' | 'red';
}

function StatusIcon({ status }: { status: AthleteStatus['trend'] }) {
  if (status === 'up')   return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === 'down') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function TrafficLight({ status }: { status: AthleteStatus['status'] }) {
  const cls = { green: 'bg-emerald-500', yellow: 'bg-amber-400', red: 'bg-red-500' }[status];
  return <div className={`w-2.5 h-2.5 rounded-full ${cls} flex-shrink-0`} />;
}

const fmtSec = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${s.toFixed(3).padStart(6, '0')}` : s.toFixed(3);
};

function monthLabel(d: Date) {
  const s = d.toLocaleDateString('es-CO', { month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function CoachPerformanceBar() {
  const { data } = useQuery({
    queryKey: ['coach-performance-bar'],
    queryFn: async () => {
      const twoWeeksAgo  = new Date(Date.now() - 14 * 86400000).toISOString();
      const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString();
      const [recentRes, prevRes, athletesRes] = await Promise.all([
        supabase.from('competition_results')
          .select('athlete_id, time_seconds')
          .gte('created_at', twoWeeksAgo)
          .not('time_seconds', 'is', null)
          .not('athlete_id', 'is', null),
        supabase.from('competition_results')
          .select('athlete_id, time_seconds')
          .gte('created_at', fourWeeksAgo)
          .lt('created_at', twoWeeksAgo)
          .not('time_seconds', 'is', null)
          .not('athlete_id', 'is', null),
        supabase.from('athletes').select('id, first_name, last_name').eq('status', 'active'),
      ]);
      return {
        recent:   recentRes.data   ?? [],
        prev:     prevRes.data     ?? [],
        athletes: athletesRes.data ?? [],
      };
    },
  });

  const athleteMap = new Map((data?.athletes ?? []).map(a => [
    a.id,
    `${a.first_name[0]}. ${a.last_name}`,
  ]));

  const avg = (items: { time_seconds: number | null }[]) => {
    const valid = items.map(i => i.time_seconds).filter((v): v is number => v !== null);
    return valid.length > 0 ? valid.reduce((s, v) => s + v, 0) / valid.length : null;
  };

  const recentByAthlete: Record<string, { time_seconds: number | null }[]> = {};
  for (const r of data?.recent ?? []) {
    if (r.athlete_id) (recentByAthlete[r.athlete_id] ??= []).push(r);
  }
  const prevByAthlete: Record<string, { time_seconds: number | null }[]> = {};
  for (const r of data?.prev ?? []) {
    if (r.athlete_id) (prevByAthlete[r.athlete_id] ??= []).push(r);
  }

  const chartData = [
    ...new Set([...Object.keys(recentByAthlete), ...Object.keys(prevByAthlete)]),
  ]
    .map(id => {
      const actual   = avg(recentByAthlete[id] ?? []);
      const anterior = avg(prevByAthlete[id]   ?? []);
      return {
        name:     athleteMap.get(id) ?? 'Atleta',
        actual:   actual   !== null ? Math.round(actual   * 10) / 10 : undefined,
        anterior: anterior !== null ? Math.round(anterior * 10) / 10 : undefined,
      };
    })
    .filter(d => d.actual !== undefined)
    .slice(0, 8);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Rendimiento Comparativo</CardTitle>
        <CardDescription>Tiempos (seg) — últimas 2 semanas vs anteriores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Sin resultados de competencia recientes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `${v}s`} />
                <Tooltip {...TT} formatter={(v: number, n: string) => [`${v}s`, n === 'actual' ? 'Esta semana' : 'Sem. anterior']} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={v => v === 'actual' ? 'Esta semana' : 'Sem. anterior'} />
                <Bar dataKey="anterior" fill="hsl(var(--chart-2))" radius={[4,4,0,0]} opacity={0.45} />
                <Bar dataKey="actual"   fill="hsl(var(--chart-1))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CoachAttendanceArea() {
  const { data: txData = [] } = useQuery({
    queryKey: ['coach-attendance-area'],
    queryFn: async () => {
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 86400000).toISOString();
      // training_attendance may not exist — graceful empty on error
      const { data } = await supabase
        .from('training_attendance')
        .select('attended, created_at')
        .gte('created_at', sixMonthsAgo);
      return (data ?? []) as { attended: boolean; created_at: string }[];
    },
  });

  const now = new Date();
  const attendanceData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthRows = txData.filter(r => r.created_at.startsWith(monthStr));
    const pct = monthRows.length > 0
      ? Math.round((monthRows.filter(r => r.attended).length / monthRows.length) * 100)
      : null;
    return { mes: monthLabel(d), porcentaje: pct };
  });

  return (
    <Card className="animate-fade-in delay-75">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Asistencia Grupal</CardTitle>
        <CardDescription>Tendencia de los últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          {attendanceData.every(d => d.porcentaje === null) ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Sin registros de asistencia disponibles
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip {...TT} formatter={(v: number) => [`${v}%`, 'Asistencia']} />
                <Area type="monotone" dataKey="porcentaje" stroke="hsl(var(--chart-1))" strokeWidth={2.5} fill="url(#attendanceGrad)" connectNulls dot={{ fill: 'hsl(var(--chart-1))', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CoachCategoryPie() {
  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-by-category'],
    queryFn: async () => {
      const { data } = await supabase
        .from('athletes')
        .select('category')
        .eq('status', 'active');
      return data ?? [];
    },
  });

  const counts = athletes.reduce<Record<string, number>>((acc, r) => {
    if (r.category) acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});

  const data = CATEGORY_KEYS.map((c, i) => ({
    name:  c.label,
    value: counts[c.key] ?? 0,
    color: CATEGORY_COLORS[i],
  })).filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="animate-fade-in delay-150">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Distribución por Categoría</CardTitle>
        <CardDescription>Atletas activos por grupo</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Sin atletas activos
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...TT} formatter={(v: number) => [`${v} atletas`, 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {data.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 text-foreground">{d.name}</span>
                  <span className="font-semibold tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CoachAthleteStatusTable() {
  const { data } = useQuery({
    queryKey: ['coach-athlete-status'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const midPoint      = new Date(Date.now() - 15 * 86400000).toISOString();
      const [athletesRes, attendanceRes, resultsRes] = await Promise.all([
        supabase.from('athletes').select('id, first_name, last_name').eq('status', 'active').limit(10),
        supabase.from('training_attendance').select('athlete_id, attended').gte('created_at', thirtyDaysAgo),
        supabase.from('competition_results')
          .select('athlete_id, time_seconds, created_at')
          .gte('created_at', thirtyDaysAgo)
          .not('time_seconds', 'is', null)
          .not('athlete_id', 'is', null)
          .order('created_at'),
      ]);
      return {
        athletes:   athletesRes.data ?? [],
        attendance: (attendanceRes.data ?? []) as { athlete_id: string; attended: boolean }[],
        results:    resultsRes.data ?? [],
      };
    },
  });

  const athletes   = data?.athletes   ?? [];
  const attendance = data?.attendance ?? [];
  const results    = data?.results    ?? [];

  const rows: AthleteStatus[] = athletes.map(a => {
    const aSessions    = attendance.filter(r => r.athlete_id === a.id);
    const attendedCnt  = aSessions.filter(r => r.attended).length;
    const pct          = aSessions.length > 0 ? Math.round((attendedCnt / aSessions.length) * 100) : 0;

    const aResults = results.filter(r => r.athlete_id === a.id);
    const recent   = aResults.filter(r => r.created_at >= midPoint);
    const older    = aResults.filter(r => r.created_at <  midPoint);
    const lastRes  = recent[recent.length - 1] ?? aResults[aResults.length - 1];
    const prevRes  = older[older.length - 1];

    let trend: AthleteStatus['trend'] = 'stable';
    if (lastRes?.time_seconds && prevRes?.time_seconds) {
      trend = lastRes.time_seconds < prevRes.time_seconds ? 'up'
            : lastRes.time_seconds > prevRes.time_seconds ? 'down'
            : 'stable';
    }

    const statusColor: AthleteStatus['status'] = pct >= 85 ? 'green' : pct >= 60 ? 'yellow' : 'red';

    return {
      id:         a.id,
      name:       `${a.first_name} ${a.last_name}`,
      attendance: pct,
      trend,
      lastTime:   lastRes?.time_seconds ? fmtSec(lastRes.time_seconds) : '—',
      status:     statusColor,
    };
  });

  return (
    <Card className="animate-fade-in delay-225">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold">Estado de Atletas</CardTitle>
          <CardDescription>Semáforo de rendimiento y asistencia</CardDescription>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Mejorando</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Estable</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> En riesgo</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Sin atletas activos
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                <TrafficLight status={a.status} />
                <span className="flex-1 text-sm font-medium truncate">{a.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{a.lastTime}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs tabular-nums font-medium ${a.attendance >= 85 ? 'text-emerald-600' : a.attendance >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                    {a.attendance > 0 ? `${a.attendance}%` : '—'}
                  </span>
                </div>
                <StatusIcon status={a.trend} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CoachTodaySession() {
  const today = new Date().toISOString().split('T')[0];

  const { data: sessions = [] } = useQuery({
    queryKey: ['coach-today-sessions', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('id, title, scheduled_at, max_athletes')
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .order('scheduled_at');
      return data ?? [];
    },
  });

  return (
    <Card className="animate-fade-in delay-300 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Zap className="h-4 w-4 text-orange-500" />
        <CardTitle className="text-sm font-semibold">Sesiones de Hoy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">Sin sesiones programadas hoy</p>
        ) : (
          sessions.map(s => {
            const time = new Date(s.scheduled_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
            return (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div>
                  <p className="text-xs font-bold text-orange-500">{time}</p>
                  <p className="text-sm font-medium">{s.title}</p>
                </div>
                {s.max_athletes && (
                  <Badge variant="secondary" className="text-xs">máx {s.max_athletes}</Badge>
                )}
              </div>
            );
          })
        )}
        <button className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg transition-colors">
          <QrCode className="h-3.5 w-3.5" />
          Generar QR de asistencia
        </button>
      </CardContent>
    </Card>
  );
}
