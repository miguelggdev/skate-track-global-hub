import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }
};

function useMedalsByCompetition() {
  return useQuery({
    queryKey: ['delegate-medals-by-competition'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_results')
        .select('medal_type, competitions(name)')
        .not('medal_type', 'is', null);
      if (error) throw error;

      const byComp = new Map<string, { comp: string; oro: number; plata: number; bronce: number }>();
      for (const row of data ?? []) {
        const name = (row as { competitions?: { name?: string } }).competitions?.name ?? 'Sin competencia';
        const entry = byComp.get(name) ?? { comp: name, oro: 0, plata: 0, bronce: 0 };
        if (row.medal_type === 'gold') entry.oro++;
        else if (row.medal_type === 'silver') entry.plata++;
        else if (row.medal_type === 'bronze') entry.bronce++;
        byComp.set(name, entry);
      }
      return Array.from(byComp.values());
    },
  });
}

function useMedalsTotal() {
  return useQuery({
    queryKey: ['delegate-medals-total'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_results')
        .select('medal_type')
        .not('medal_type', 'is', null);
      if (error) throw error;

      let oro = 0, plata = 0, bronce = 0;
      for (const row of data ?? []) {
        if (row.medal_type === 'gold') oro++;
        else if (row.medal_type === 'silver') plata++;
        else if (row.medal_type === 'bronze') bronce++;
      }
      return [
        { name: 'Oro', value: oro, color: '#f59e0b' },
        { name: 'Plata', value: plata, color: '#94a3b8' },
        { name: 'Bronce', value: bronce, color: '#cd7c2f' },
      ].filter(d => d.value > 0);
    },
  });
}

function useInscriptionsByCompetition() {
  return useQuery({
    queryKey: ['delegate-inscriptions-by-competition'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_registrations')
        .select('payment_status, competitions(name)');
      if (error) throw error;

      const byComp = new Map<string, { comp: string; confirmadas: number; pendientes: number }>();
      for (const row of data ?? []) {
        const name = (row as { competitions?: { name?: string } }).competitions?.name ?? 'Sin competencia';
        const entry = byComp.get(name) ?? { comp: name, confirmadas: 0, pendientes: 0 };
        if (row.payment_status === 'paid') entry.confirmadas++;
        else entry.pendientes++;
        byComp.set(name, entry);
      }
      return Array.from(byComp.values());
    },
  });
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground text-center py-10">{label}</p>;
}

export function DelegateResultsBar() {
  const { data = [], isLoading } = useMedalsByCompetition();
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Medallero por Competencia</CardTitle>
        <CardDescription>Distribución de medallas obtenidas</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-60 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <EmptyState label="Sin medallas registradas todavía" />
        ) : (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="comp" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="oro" name="Oro" fill="#f59e0b" radius={[4,4,0,0]} stackId="medals" />
                <Bar dataKey="plata" name="Plata" fill="#94a3b8" stackId="medals" />
                <Bar dataKey="bronce" name="Bronce" fill="#cd7c2f" radius={[0,0,4,4]} stackId="medals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DelegateMedalsPie() {
  const { data = [], isLoading } = useMedalsTotal();
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="animate-fade-in delay-75">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Medallero Acumulado</CardTitle>
        <CardDescription>{total} medallas en la temporada</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : total === 0 ? (
          <EmptyState label="Sin medallas registradas todavía" />
        ) : (
          <div className="flex items-center gap-6">
            <div className="h-40 w-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={65} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...TT} formatter={(v: number) => [`${v} medallas`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {data.map((d) => (
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
        )}
      </CardContent>
    </Card>
  );
}

export function DelegateInscriptionsBar() {
  const { data = [], isLoading } = useInscriptionsByCompetition();
  return (
    <Card className="animate-fade-in delay-150">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Inscripciones por Competencia</CardTitle>
        <CardDescription>Confirmadas vs pendientes de pago</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-52 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <EmptyState label="Sin inscripciones registradas todavía" />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="comp" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={v => v === 'confirmadas' ? 'Confirmadas' : 'Pendientes'} />
                <Bar dataKey="confirmadas" name="confirmadas" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="pendientes" name="pendientes" fill="#f97316" radius={[4,4,0,0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
