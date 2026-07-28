import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const INCOME_PIE = [
  { name: 'Cuotas', value: 65, color: '#f97316' },
  { name: 'Competencias', value: 20, color: '#3b82f6' },
  { name: 'Patrocinios', value: 10, color: '#10b981' },
  { name: 'Otros', value: 5, color: '#8b5cf6' },
];

const CASHFLOW_DATA = [
  { mes: 'Abr', real: 12400, proyectado: 13000 },
  { mes: 'May', real: 14200, proyectado: 13500 },
  { mes: 'Jun', real: 11800, proyectado: 13500 },
  { mes: 'Jul', real: 15100, proyectado: 14000 },
  { mes: 'Ago', real: null, proyectado: 14500 },
  { mes: 'Sep', real: null, proyectado: 15000 },
];

const DELINQUENCY_DATA = [
  { mes: 'Feb', alDia: 88 },
  { mes: 'Mar', alDia: 91 },
  { mes: 'Abr', alDia: 85 },
  { mes: 'May', alDia: 93 },
  { mes: 'Jun', alDia: 89 },
  { mes: 'Jul', alDia: 94 },
];

interface Debtor {
  name: string;
  amount: number;
  daysOverdue: number;
  category: string;
}

const DEBTORS_MOCK: Debtor[] = [
  { name: 'Carlos Ruiz', amount: 170, daysOverdue: 32, category: 'Juvenil' },
  { name: 'María López', amount: 255, daysOverdue: 47, category: 'Menores' },
  { name: 'Pedro Soto', amount: 85, daysOverdue: 15, category: 'Mayores' },
  { name: 'Ana Vargas', amount: 340, daysOverdue: 61, category: 'Escuela' },
];

export function FinanceIncomePie() {
  const [data, setData] = useState(INCOME_PIE);

  useEffect(() => {
    supabase
      .from('financial_transactions')
      .select('transaction_type, amount')
      .eq('payment_status', 'paid')
      .then(({ data: rows }) => {
        if (!rows?.length) return;
        const totals: Record<string, number> = {};
        rows.forEach(r => { totals[r.transaction_type] = (totals[r.transaction_type] || 0) + Number(r.amount); });
        const grand = Object.values(totals).reduce((s, v) => s + v, 0);
        if (grand === 0) return;
        const cuotas = ((totals['mensualidad'] || 0) + (totals['anualidad'] || 0) + (totals['registration_fee'] || 0)) / grand * 100;
        const comps = ((totals['poliza_deportiva'] || 0)) / grand * 100;
        const otros = 100 - cuotas - comps;
        setData([
          { name: 'Cuotas', value: Math.round(cuotas), color: '#f97316' },
          { name: 'Competencias', value: Math.round(comps), color: '#3b82f6' },
          { name: 'Patrocinios', value: Math.round(Math.max(0, otros * 0.6)), color: '#10b981' },
          { name: 'Otros', value: Math.round(Math.max(0, otros * 0.4)), color: '#8b5cf6' },
        ]);
      });
  }, []);

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
  return (
    <Card className="animate-fade-in delay-75">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Flujo de Caja</CardTitle>
        <CardDescription>Real vs proyectado — próximos 2 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CASHFLOW_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
  return (
    <Card className="animate-fade-in delay-150">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Tasa de Pago Oportuno</CardTitle>
        <CardDescription>% atletas al día con sus cuotas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={DELINQUENCY_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[75, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip {...TT} formatter={(v: number) => [`${v}%`, 'Al día']} />
              <Line type="monotone" dataKey="alDia" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceDebtorsList() {
  const { currency } = useCurrency();

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
        <div className="divide-y divide-border">
          {DEBTORS_MOCK.map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.category} · {d.daysOverdue} días de mora</p>
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
      </CardContent>
    </Card>
  );
}
