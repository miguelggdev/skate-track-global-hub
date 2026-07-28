import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, defs, linearGradient
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, CheckCircle2, QrCode } from 'lucide-react';
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

const PERFORMANCE_DATA = [
  { name: 'J. Pérez', actual: 95.4, anterior: 97.1 },
  { name: 'M. García', actual: 102.3, anterior: 104.8 },
  { name: 'C. López', actual: 88.7, anterior: 91.2 },
  { name: 'A. Ruiz', actual: 110.5, anterior: 108.9 },
  { name: 'L. Torres', actual: 78.4, anterior: 82.1 },
  { name: 'S. Mora', actual: 93.1, anterior: 94.7 },
];

const ATTENDANCE_DATA = [
  { mes: 'Feb', porcentaje: 78 },
  { mes: 'Mar', porcentaje: 82 },
  { mes: 'Abr', porcentaje: 86 },
  { mes: 'May', porcentaje: 80 },
  { mes: 'Jun', porcentaje: 88 },
  { mes: 'Jul', porcentaje: 91 },
];

const CATEGORY_DATA = [
  { name: 'Escuela', value: 0, color: CATEGORY_COLORS[0] },
  { name: 'Menores', value: 0, color: CATEGORY_COLORS[1] },
  { name: 'Juvenil', value: 0, color: CATEGORY_COLORS[2] },
  { name: 'Mayores', value: 0, color: CATEGORY_COLORS[3] },
  { name: 'Masters', value: 0, color: CATEGORY_COLORS[4] },
];

interface AthleteStatus {
  id: string;
  name: string;
  attendance: number;
  trend: 'up' | 'down' | 'stable';
  lastTime: string;
  status: 'green' | 'yellow' | 'red';
}

const ATHLETE_STATUS_MOCK: AthleteStatus[] = [
  { id: '1', name: 'Juan Pérez', attendance: 95, trend: 'up', lastTime: '0:38.241', status: 'green' },
  { id: '2', name: 'María García', attendance: 82, trend: 'stable', lastTime: '0:41.512', status: 'yellow' },
  { id: '3', name: 'Carlos López', attendance: 91, trend: 'up', lastTime: '0:36.887', status: 'green' },
  { id: '4', name: 'Ana Ruiz', attendance: 63, trend: 'down', lastTime: '0:45.102', status: 'red' },
  { id: '5', name: 'Luis Torres', attendance: 88, trend: 'up', lastTime: '0:39.774', status: 'green' },
  { id: '6', name: 'Sara Mora', attendance: 74, trend: 'down', lastTime: '0:42.330', status: 'yellow' },
];

function StatusIcon({ status }: { status: AthleteStatus['trend'] }) {
  if (status === 'up') return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === 'down') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function TrafficLight({ status }: { status: AthleteStatus['status'] }) {
  const cls = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  }[status];
  return <div className={`w-2.5 h-2.5 rounded-full ${cls} flex-shrink-0`} />;
}

export function CoachPerformanceBar() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Rendimiento Comparativo (300m)</CardTitle>
        <CardDescription>Esta semana vs semana anterior — menor es mejor</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PERFORMANCE_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `${v}s`} />
              <Tooltip {...TT} formatter={(v: number, n: string) => [`${v}s`, n === 'actual' ? 'Esta semana' : 'Sem. anterior']} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => v === 'actual' ? 'Esta semana' : 'Sem. anterior'} />
              <Bar dataKey="anterior" fill="hsl(var(--chart-2))" radius={[4,4,0,0]} opacity={0.45} />
              <Bar dataKey="actual" fill="hsl(var(--chart-1))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CoachAttendanceArea() {
  return (
    <Card className="animate-fade-in delay-75">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Asistencia Grupal</CardTitle>
        <CardDescription>Tendencia de los últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ATTENDANCE_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[60, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip {...TT} formatter={(v: number) => [`${v}%`, 'Asistencia']} />
              <Area type="monotone" dataKey="porcentaje" stroke="hsl(var(--chart-1))" strokeWidth={2.5} fill="url(#attendanceGrad)" dot={{ fill: 'hsl(var(--chart-1))', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CoachCategoryPie() {
  const [data, setData] = useState(CATEGORY_DATA);

  useEffect(() => {
    supabase.from('athletes').select('category').eq('status', 'active').then(({ data: rows }) => {
      if (!rows?.length) return;
      const counts = rows.reduce((acc: Record<string, number>, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {});
      setData(prev => prev.map(d => ({
        ...d,
        value: counts[d.name.toLowerCase()] || counts[d.name] || 0
      })));
    });
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="animate-fade-in delay-150">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Distribución por Categoría</CardTitle>
        <CardDescription>Atletas activos por grupo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-44 w-44 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={total > 0 ? data : data.map(d => ({ ...d, value: 1 }))} cx="50%" cy="50%" innerRadius={38} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
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
                <span className="font-semibold tabular-nums">{total > 0 ? d.value : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CoachAthleteStatusTable() {
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
        <div className="divide-y divide-border">
          {ATHLETE_STATUS_MOCK.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
              <TrafficLight status={a.status} />
              <span className="flex-1 text-sm font-medium truncate">{a.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{a.lastTime}</span>
              <div className="flex items-center gap-1">
                <span className={`text-xs tabular-nums font-medium ${a.attendance >= 85 ? 'text-emerald-600' : a.attendance >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                  {a.attendance}%
                </span>
              </div>
              <StatusIcon status={a.trend} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CoachTodaySession() {
  const sessions = [
    { time: '16:00', type: 'Técnica de patinaje', participants: 12, status: 'upcoming' },
    { time: '17:30', type: 'Resistencia aeróbica', participants: 8, status: 'upcoming' },
  ];

  return (
    <Card className="animate-fade-in delay-300 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Zap className="h-4 w-4 text-orange-500" />
        <CardTitle className="text-sm font-semibold">Sesiones de Hoy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
            <div>
              <p className="text-xs font-bold text-orange-500">{s.time}</p>
              <p className="text-sm font-medium">{s.type}</p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="text-xs">{s.participants} atletas</Badge>
            </div>
          </div>
        ))}
        <button className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg transition-colors">
          <QrCode className="h-3.5 w-3.5" />
          Generar QR de asistencia
        </button>
      </CardContent>
    </Card>
  );
}
