import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }
};

const RESULTS_DATA = [
  { comp: 'Nacional Feb', oro: 3, plata: 2, bronce: 4 },
  { comp: 'Regional Mar', oro: 1, plata: 4, bronce: 2 },
  { comp: 'Copa Abr', oro: 5, plata: 1, bronce: 3 },
  { comp: 'Zonal May', oro: 2, plata: 3, bronce: 5 },
  { comp: 'Abierto Jun', oro: 4, plata: 2, bronce: 2 },
];

const MEDALS_PIE = [
  { name: 'Oro', value: 15, color: '#f59e0b' },
  { name: 'Plata', value: 12, color: '#94a3b8' },
  { name: 'Bronce', value: 16, color: '#cd7c2f' },
];

const INSCRIPTIONS_DATA = [
  { comp: 'Nacional', confirmadas: 18, pendientes: 4 },
  { comp: 'Regional', confirmadas: 24, pendientes: 2 },
  { comp: 'Copa Jul', confirmadas: 12, pendientes: 8 },
  { comp: 'Zonal Ago', confirmadas: 8, pendientes: 14 },
];

export function DelegateResultsBar() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Medallero por Competencia</CardTitle>
        <CardDescription>Distribución de medallas obtenidas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={RESULTS_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="comp" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="oro" name="Oro" fill="#f59e0b" radius={[4,4,0,0]} stackId="medals" />
              <Bar dataKey="plata" name="Plata" fill="#94a3b8" stackId="medals" />
              <Bar dataKey="bronce" name="Bronce" fill="#cd7c2f" radius={[0,0,4,4]} stackId="medals" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function DelegateMedalsPie() {
  const total = MEDALS_PIE.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="animate-fade-in delay-75">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Medallero Acumulado</CardTitle>
        <CardDescription>{total} medallas en la temporada</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="h-40 w-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={MEDALS_PIE} cx="50%" cy="50%" innerRadius={32} outerRadius={65} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {MEDALS_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip {...TT} formatter={(v: number) => [`${v} medallas`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {MEDALS_PIE.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.value/total)*100}%`, backgroundColor: d.color }} />
                  </div>
                  <span className="text-sm font-bold tabular-nums w-6 text-right">{d.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DelegateInscriptionsBar() {
  return (
    <Card className="animate-fade-in delay-150">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Inscripciones por Competencia</CardTitle>
        <CardDescription>Confirmadas vs pendientes de pago</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={INSCRIPTIONS_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="comp" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={v => v === 'confirmadas' ? 'Confirmadas' : 'Pendientes'} />
              <Bar dataKey="confirmadas" name="confirmadas" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="pendientes" name="pendientes" fill="#f97316" radius={[4,4,0,0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
