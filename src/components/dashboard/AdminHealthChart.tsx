import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts';
import { ShieldCheck } from 'lucide-react';

const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }
};

const HEALTH_DATA = [
  { axis: 'Finanzas', score: 82 },
  { axis: 'Rendimiento', score: 78 },
  { axis: 'Asistencia', score: 91 },
  { axis: 'Documentos', score: 65 },
  { axis: 'Retención', score: 88 },
  { axis: 'Equipos', score: 74 },
];

const GENDER_DIST_DATA = [
  { categoria: 'Escuela', masculino: 8, femenino: 6 },
  { categoria: 'Menores', masculino: 12, femenino: 9 },
  { categoria: 'Juvenil', masculino: 7, femenino: 11 },
  { categoria: 'Mayores', masculino: 6, femenino: 4 },
];

const GROWTH_DATA = [
  { mes: 'Ago', atletas: 38 },
  { mes: 'Sep', atletas: 41 },
  { mes: 'Oct', atletas: 43 },
  { mes: 'Nov', atletas: 45 },
  { mes: 'Dic', atletas: 44 },
  { mes: 'Ene', atletas: 47 },
  { mes: 'Feb', atletas: 49 },
  { mes: 'Mar', atletas: 50 },
  { mes: 'Abr', atletas: 51 },
  { mes: 'May', atletas: 53 },
  { mes: 'Jun', atletas: 54 },
  { mes: 'Jul', atletas: 56 },
];

const AUDIT_FEED = [
  { time: 'Hace 5 min', action: 'Atleta registrado', user: 'Admin', type: 'create' },
  { time: 'Hace 12 min', action: 'Competencia actualizada', user: 'Coach01', type: 'update' },
  { time: 'Hace 34 min', action: 'Documento vencido detectado', user: 'Sistema', type: 'alert' },
  { time: 'Hace 1h', action: 'Pago registrado: $85', user: 'Finance', type: 'finance' },
  { time: 'Hace 2h', action: 'Sesión de entrenamiento creada', user: 'Coach01', type: 'create' },
];

const typeIcon: Record<string, string> = {
  create: '✅', update: '✏️', alert: '⚠️', finance: '💰'
};

export function AdminClubHealthRadar() {
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
  return (
    <Card className="animate-slide-up delay-75">
      <CardHeader>
        <CardTitle className="text-base">Atletas por Categoría y Género</CardTitle>
        <CardDescription>Distribución demográfica del club</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={GENDER_DIST_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="categoria" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={v => v === 'masculino' ? 'Masculino' : 'Femenino'} />
              <Bar dataKey="masculino" name="masculino" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="femenino" name="femenino" fill="#ec4899" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminMemberGrowth() {
  return (
    <Card className="animate-slide-up delay-150">
      <CardHeader>
        <CardTitle className="text-base">Crecimiento de Miembros</CardTitle>
        <CardDescription>Últimos 12 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={GROWTH_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[30, 'auto']} />
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
  return (
    <Card className="animate-slide-up delay-225">
      <CardHeader>
        <CardTitle className="text-base">Actividad Reciente</CardTitle>
        <CardDescription>Últimas acciones del sistema</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {AUDIT_FEED.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
              <span className="text-base">{typeIcon[entry.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.action}</p>
                <p className="text-xs text-muted-foreground">{entry.user}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
