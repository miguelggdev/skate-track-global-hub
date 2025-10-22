import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface AthleteComplianceChartProps {
  data: Array<{
    month: string;
    paid: number;
    unpaid: number;
  }>;
}

export function AthleteComplianceChart({ data }: AthleteComplianceChartProps) {
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Cumplimiento de Pagos</CardTitle>
        <CardDescription>Atletas al día vs. en mora (últimos 12 meses)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} atletas`, ""]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="paid" 
              stackId="1"
              stroke="hsl(var(--success))" 
              fill="hsl(var(--success))"
              fillOpacity={0.6}
              name="Pagados"
            />
            <Area 
              type="monotone" 
              dataKey="unpaid" 
              stackId="1"
              stroke="hsl(var(--destructive))" 
              fill="hsl(var(--destructive))"
              fillOpacity={0.6}
              name="En Mora"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
