import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PaymentStatusPieChartProps {
  data: {
    paid: number;
    pending: number;
    overdue: number;
  };
}

const COLORS = {
  paid: "hsl(var(--success))",
  pending: "hsl(var(--warning))",
  overdue: "hsl(var(--destructive))",
};

export function PaymentStatusPieChart({ data }: PaymentStatusPieChartProps) {
  const chartData = [
    { name: "Pagados", value: data.paid, color: COLORS.paid },
    { name: "Pendientes", value: data.pending, color: COLORS.pending },
    { name: "En Mora", value: data.overdue, color: COLORS.overdue },
  ].filter(item => item.value > 0);

  const total = data.paid + data.pending + data.overdue;

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Estado de Pagos</CardTitle>
        <CardDescription>Distribución de atletas por estado de pago</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} atletas (${((value / total) * 100).toFixed(1)}%)`, ""]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
