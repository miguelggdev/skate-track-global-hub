import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';

const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  }
};

const PIE_COLORS = {
  cuotas: '#f97316',
  competencias: '#3b82f6',
  patrocinios: '#10b981',
  otros: '#8b5cf6',
};

function monthLabel(d: Date) {
  const s = d.toLocaleDateString('es-CO', { month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function last6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: monthLabel(d),
      start: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      end: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-31`,
    };
  });
}

export function FinanceIncomePie() {
  const { data: txData = [] } = useQuery({
    queryKey: ['finance-income-pie'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('status', 'paid');
      return data ?? [];
    },
  });

  const totals: Record<string, number> = {};
  for (const r of txData) {
    totals[r.type] = (totals[r.type] ?? 0) + Number(r.amount);
  }
  const grand = Object.values(totals).reduce((s, v) => s + v, 0);

  const data = grand > 0
    ? (() => {
        const cuotas = ((totals['mensualidad'] ?? 0) + (totals['anualidad'] ?? 0) + (totals['registration_fee'] ?? 0)) / grand * 100;
        const comps  = (totals['poliza_deportiva'] ?? 0) / grand * 100;
        const otros  = 100 - cuotas - comps;
        return [
          { name: 'Cuotas',       value: Math.round(cuotas),              color: PIE_COLORS.cuotas },
          { name: 'Competencias', value: Math.round(comps),               color: PIE_COLORS.competencias },
          { name: 'Patrocinios',  value: Math.round(Math.max(0, otros * 0.6)), color: PIE_COLORS.patrocinios },
          { name: 'Otros',        value: Math.round(Math.max(0, otros * 0.4)), color: PIE_COLORS.otros },
        ];
      })()
    : [
        { name: 'Cuotas', value: 65, color: PIE_COLORS.cuotas },
        { name: 'Competencias', value: 20, color: PIE_COLORS.competencias },
        { name: 'Patrocinios', value: 10, color: PIE_COLORS.patrocinios },
        { name: 'Otros', value: 5, color: PIE_COLORS.otros },
      ];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Distribución de Ingresos</CardTitle>
        <CardDescription>Por fuente — período actual</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-44 w-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip {...TT} formatter={(v: number) => [`${v}%`, 'Participación']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2.5">
            {data.map((d) => (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span>{d.name}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{d.value}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.value}%`, backgroundColor: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceCashFlowArea() {
  const months = last6Months();
  const sixMonthsAgo = months[0].start;

  const { data: txData = [] } = useQuery({
    queryKey: ['finance-cashflow'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('amount, paid_at, status')
        .gte('created_at', sixMonthsAgo);
      return data ?? [];
    },
  });

  const paid = txData.filter(r => r.status === 'paid' && r.paid_at);
  const chartData = months.map(m => {
    const monthPaid = paid
      .filter(r => r.paid_at!.startsWith(`${m.year}-${String(m.month).padStart(2, '0')}`))
      .reduce((s, r) => s + Number(r.amount), 0);
    return { mes: m.label, real: monthPaid > 0 ? monthPaid : null };
  });

  const realValues = chartData.map(d => d.real).filter((v): v is number => v !== null);
  const avg = realValues.length > 0 ? Math.round(realValues.reduce((s, v) => s + v, 0) / realValues.length) : 0;
  const withProjected = chartData.map((d, i) => ({
    ...d,
    proyectado: i >= chartData.length - 2 ? avg : undefined,
  }));

  return (
    <Card className="animate-fade-in delay-75">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Flujo de Caja</CardTitle>
        <CardDescription>Ingresos reales vs proyectado — últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={withProjected} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="cfReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="cfProy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip {...TT} formatter={(v: number, n: string) => [`$${v?.toLocaleString()}`, n === 'real' ? 'Real' : 'Proyectado']} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={v => v === 'real' ? 'Real' : 'Proyectado'} />
              <Area type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2.5} fill="url(#cfReal)" connectNulls dot={{ fill: '#10b981', r: 3 }} />
              <Area type="monotone" dataKey="proyectado" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" fill="url(#cfProy)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceDelinquencyLine() {
  const months = last6Months();
  const sixMonthsAgo = months[0].start;

  const { data: txData = [] } = useQuery({
    queryKey: ['finance-delinquency'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('status, created_at')
        .gte('created_at', sixMonthsAgo)
        .neq('status', 'cancelled');
      return data ?? [];
    },
  });

  const chartData = months.map(m => {
    const monthTx = txData.filter(r => {
      const d = r.created_at.slice(0, 7);
      return d === `${m.year}-${String(m.month).padStart(2, '0')}`;
    });
    const total = monthTx.length;
    const paid  = monthTx.filter(r => r.status === 'paid').length;
    const alDia = total > 0 ? Math.round((paid / total) * 100) : null;
    return { mes: m.label, alDia };
  });

  return (
    <Card className="animate-fade-in delay-150">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Tasa de Pago Oportuno</CardTitle>
        <CardDescription>% atletas al día con sus cuotas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip {...TT} formatter={(v: number) => [`${v}%`, 'Al día']} />
              <Line type="monotone" dataKey="alDia" stroke="#f97316" strokeWidth={2.5} connectNulls dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceDebtorsList() {
  const { currency } = useCurrency();
  const today = new Date().toISOString().split('T')[0];

  const { data } = useQuery({
    queryKey: ['finance-debtors'],
    queryFn: async () => {
      const [txRes, athletesRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('id, athlete_id, amount, due_date, status, payer_name')
          .in('status', ['overdue', 'pending'])
          .order('due_date')
          .limit(10),
        supabase.from('athletes').select('id, first_name, last_name, category'),
      ]);
      return {
        transactions: txRes.data ?? [],
        athletes: athletesRes.data ?? [],
      };
    },
  });

  const athleteMap = new Map((data?.athletes ?? []).map(a => [a.id, a]));

  const debtors = (data?.transactions ?? [])
    .filter(t => t.due_date && t.due_date <= today)
    .map(t => {
      const athlete = athleteMap.get(t.athlete_id);
      const name = t.payer_name
        || (athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Atleta');
      const category = athlete?.category ?? '';
      const daysOverdue = t.due_date
        ? Math.max(0, Math.round((Date.now() - new Date(t.due_date).getTime()) / 86400000))
        : 0;
      return { name, amount: Number(t.amount), daysOverdue, category };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 6);

  return (
    <Card className="animate-fade-in delay-225">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Atletas con Saldo Pendiente
          </CardTitle>
          <CardDescription>Ordenados por días de mora</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {debtors.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Sin pagos pendientes vencidos
          </div>
        ) : (
          <div className="divide-y divide-border">
            {debtors.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {d.category ? `${d.category} · ` : ''}{d.daysOverdue} días de mora
                  </p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${d.daysOverdue > 30 ? 'text-red-500' : 'text-amber-600'}`}>
                  {formatCurrency(d.amount, currency)}
                </span>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                  <Send className="h-3 w-3" /> Recordar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
