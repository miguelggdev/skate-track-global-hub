import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';

const MONTHS = 6;
const INCOME_TYPES = ['mensualidad', 'registration_fee', 'poliza_deportiva', 'anualidad'];
const EXPENSE_TYPES = ['equipment', 'travel', 'coaching', 'other'];

const RevenueChart: React.FC = () => {
  const { currency } = useCurrency();

  const { data = [], isLoading } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: async () => {
      const now = new Date();

      // Build date ranges for all 6 months
      const ranges = Array.from({ length: MONTHS }, (_, i) => {
        const month = subMonths(now, MONTHS - 1 - i);
        return {
          label: format(startOfMonth(month), 'MMM', { locale: es }),
          start: startOfMonth(month).toISOString().split('T')[0],
          end:   endOfMonth(month).toISOString().split('T')[0],
        };
      });

      // Fetch all transactions in one query covering the full 6-month window
      const windowStart = ranges[0].start;
      const windowEnd   = ranges[MONTHS - 1].end;

      const [incomeRes, expenseRes] = await Promise.all([
        supabase
          .from('financial_transactions')
          .select('amount, transaction_date')
          .eq('payment_status', 'paid')
          .in('transaction_type', INCOME_TYPES)
          .gte('transaction_date', windowStart)
          .lte('transaction_date', windowEnd),
        supabase
          .from('financial_transactions')
          .select('amount, transaction_date')
          .eq('payment_status', 'paid')
          .in('transaction_type', EXPENSE_TYPES)
          .gte('transaction_date', windowStart)
          .lte('transaction_date', windowEnd),
      ]);

      // Group by month label
      const incomeByMonth: Record<string, number> = {};
      const expenseByMonth: Record<string, number> = {};
      for (const r of ranges) { incomeByMonth[r.label] = 0; expenseByMonth[r.label] = 0; }

      for (const t of incomeRes.data ?? []) {
        const label = format(new Date(t.transaction_date), 'MMM', { locale: es });
        incomeByMonth[label] = (incomeByMonth[label] ?? 0) + Number(t.amount);
      }
      for (const t of expenseRes.data ?? []) {
        const label = format(new Date(t.transaction_date), 'MMM', { locale: es });
        expenseByMonth[label] = (expenseByMonth[label] ?? 0) + Number(t.amount);
      }

      return ranges.map(({ label }) => {
        const revenue  = Math.round(incomeByMonth[label]  ?? 0);
        const expenses = Math.round(expenseByMonth[label] ?? 0);
        return { month: label, revenue, expenses, target: Math.max(Math.round(revenue * 1.1), 30_000) };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Análisis Financiero</CardTitle>
          <CardDescription>Cargando datos financieros...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Cargando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle>Análisis Financiero</CardTitle>
        <CardDescription>
          {data.length > 0
            ? `Ingresos vs Objetivos y Gastos (últimos ${data.length} meses)`
            : 'No hay datos financieros disponibles'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.every(d => d.revenue === 0 && d.expenses === 0) ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No hay transacciones financieras registradas
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis
                  axisLine={false} tickLine={false} className="text-xs"
                  tickFormatter={v => `${getCurrencySymbol(currency)}${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value, currency),
                    name === 'revenue' ? 'Ingresos' : name === 'target' ? 'Objetivo' : 'Gastos',
                  ]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue"  fill="hsl(var(--dashboard-primary))"   radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="expenses" fill="hsl(var(--dashboard-danger))"    radius={[4, 4, 0, 0]} opacity={0.6} />
                <Line type="monotone" dataKey="target" stroke="hsl(var(--dashboard-accent))" strokeWidth={3}
                  dot={{ fill: 'hsl(var(--dashboard-accent))', strokeWidth: 2, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
