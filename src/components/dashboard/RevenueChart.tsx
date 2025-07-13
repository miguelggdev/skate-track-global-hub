import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';

const data = [
  { month: 'Ene', revenue: 42000, target: 45000, expenses: 28000 },
  { month: 'Feb', revenue: 48000, target: 47000, expenses: 31000 },
  { month: 'Mar', revenue: 52000, target: 50000, expenses: 33000 },
  { month: 'Abr', revenue: 49000, target: 52000, expenses: 29000 },
  { month: 'May', revenue: 58000, target: 55000, expenses: 35000 },
  { month: 'Jun', revenue: 61000, target: 58000, expenses: 37000 },
];

const RevenueChart: React.FC = () => {
  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle>Análisis Financiero</CardTitle>
        <CardDescription>Ingresos vs Objetivos y Gastos (6 meses)</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default RevenueChart;