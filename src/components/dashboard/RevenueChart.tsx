import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const RevenueChart: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const monthsToFetch = 6;
        const monthlyData = [];
        const currentDate = new Date();

        for (let i = monthsToFetch - 1; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(currentDate, i));
          const monthEnd = endOfMonth(subMonths(currentDate, i));
          const monthName = format(monthStart, 'MMM', { locale: es });

          // Get revenue data (income types: mensualidad, registration_fee, poliza_deportiva, anualidad)
          const { data: revenueTransactions, error: revenueError } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('payment_status', 'paid')
            .in('transaction_type', ['mensualidad', 'registration_fee', 'poliza_deportiva', 'anualidad'])
            .gte('transaction_date', monthStart.toISOString().split('T')[0])
            .lte('transaction_date', monthEnd.toISOString().split('T')[0]);

          if (revenueError) throw revenueError;

          // Get expense data (expense types: equipment, travel, coaching, other)
          const { data: expenseTransactions, error: expenseError } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('payment_status', 'paid')
            .in('transaction_type', ['equipment', 'travel', 'coaching', 'other'])
            .gte('transaction_date', monthStart.toISOString().split('T')[0])
            .lte('transaction_date', monthEnd.toISOString().split('T')[0]);

          if (expenseError) throw expenseError;

          // Calculate totals
          const revenue = revenueTransactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
          const expenses = expenseTransactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

          // Set a reasonable target (10% above current revenue or minimum 30000)
          const target = Math.max(revenue * 1.1, 30000);

          monthlyData.push({
            month: monthName,
            revenue: Math.round(revenue),
            expenses: Math.round(expenses),
            target: Math.round(target)
          });
        }

        setData(monthlyData);
      } catch (error) {
        console.error('Error fetching financial data:', error);
        // Fallback to sample data if real data fails
        setData([
          { month: 'Ene', revenue: 0, target: 30000, expenses: 0 },
          { month: 'Feb', revenue: 0, target: 30000, expenses: 0 },
          { month: 'Mar', revenue: 0, target: 30000, expenses: 0 },
          { month: 'Abr', revenue: 0, target: 30000, expenses: 0 },
          { month: 'May', revenue: 0, target: 30000, expenses: 0 },
          { month: 'Jun', revenue: 0, target: 30000, expenses: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();

    // Set up real-time subscription for financial transactions
    const channel = supabase
      .channel('financial-transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, fetchFinancialData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  if (loading) {
    return (
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Análisis Financiero</CardTitle>
          <CardDescription>Cargando datos financieros...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse">Cargando gráfico...</div>
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
            : 'No hay datos financieros disponibles'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No hay transacciones financieras registradas
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `€${value.toLocaleString()}`,
                    name === 'revenue' ? 'Ingresos' : name === 'target' ? 'Objetivo' : 'Gastos'
                  ]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--dashboard-primary))" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Bar 
                  dataKey="expenses" 
                  fill="hsl(var(--dashboard-danger))" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.6}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="hsl(var(--dashboard-accent))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--dashboard-accent))', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueChart;