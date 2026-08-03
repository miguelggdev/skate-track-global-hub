import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }
};

const CLUB_HEALTH = [
  { axis: 'Finanzas', score: 82 },
  { axis: 'Rendimiento', score: 78 },
  { axis: 'Asistencia', score: 91 },
  { axis: 'Documentos', score: 65 },
  { axis: 'Retención', score: 88 },
  { axis: 'Equipos', score: 74 },
];

const ANNUAL_TREND = [
  { mes: 'Ene', atletas: 38, ingresos: 11200, asistencia: 79 },
  { mes: 'Feb', atletas: 41, ingresos: 12400, asistencia: 82 },
  { mes: 'Mar', atletas: 44, ingresos: 13100, asistencia: 85 },
  { mes: 'Abr', atletas: 43, ingresos: 12800, asistencia: 88 },
  { mes: 'May', atletas: 47, ingresos: 14200, asistencia: 86 },
  { mes: 'Jun', atletas: 50, ingresos: 15100, asistencia: 91 },
  { mes: 'Jul', atletas: 52, ingresos: 15800, asistencia: 89 },
];

interface StrategicAlert {
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}

const ALERTS: StrategicAlert[] = [
  { level: 'high', title: 'Documentos vencidos', description: '8 atletas con documentación expirada', action: 'Ver atletas' },
  { level: 'medium', title: 'Cuotas pendientes', description: '4 atletas con +30 días de mora', action: 'Ver pagos' },
  { level: 'low', title: 'Equipos en mantenimiento', description: '3 pares de patines pendientes', action: 'Ver equipos' },
];

function AlertBadge({ level }: { level: StrategicAlert['level'] }) {
  const cfg = {
    high: { label: 'Alta', cls: 'bg-red-500/15 text-red-600 border-red-500/30' },
    medium: { label: 'Media', cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
    low: { label: 'Baja', cls: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  }[level];
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

export function LeaderClubHealthRadar() {
  const avg = Math.round(CLUB_HEALTH.reduce((s, d) => s + d.score, 0) / CLUB_HEALTH.length);

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
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={CLUB_HEALTH} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
              <Tooltip {...TT} formatter={(v: number) => [`${v}/100`, 'Puntaje']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaderAnnualTrend() {
  return (
    <Card className="animate-fade-in delay-75">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Tendencia Anual</CardTitle>
        <CardDescription>Crecimiento de atletas e ingresos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={ANNUAL_TREND} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="leaderArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
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
      </CardContent>
    </Card>
  );
}

export function LeaderStrategicAlerts() {
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
        {ALERTS.map((a, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
            <AlertBadge level={a.level} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
            </div>
            <button className="text-xs text-primary hover:underline whitespace-nowrap flex-shrink-0">{a.action}</button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function LeaderExecutiveKPIs() {
  const kpis = [
    { label: 'Crecimiento atletas', value: '+37%', trend: 'up', desc: 'vs mismo período año anterior' },
    { label: 'Retención anual', value: '93.2%', trend: 'up', desc: '↑ 2.1 puntos porcentuales' },
    { label: 'Tasa de participación', value: '89%', trend: 'stable', desc: 'Competencias vs inscritos' },
    { label: 'ROI de inversión', value: '1.8x', trend: 'up', desc: 'Ingresos / Gastos operativos' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k, i) => (
        <Card key={i} className={`animate-fade-in`} style={{ animationDelay: `${i * 60}ms` }}>
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
