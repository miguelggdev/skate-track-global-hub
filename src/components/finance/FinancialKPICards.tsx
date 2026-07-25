import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Users, UserCheck, UserX, Receipt } from "lucide-react";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import { formatCurrency } from "@/utils/currency";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  isPositiveTrend?: boolean;
  isPercentage?: boolean;
}

function KPICard({ title, value, change, changeLabel, icon, trend, isPositiveTrend, isPercentage }: KPICardProps) {
  const trendColor = trend === "up" 
    ? (isPositiveTrend ? "text-success" : "text-destructive")
    : trend === "down"
    ? (isPositiveTrend ? "text-destructive" : "text-success")
    : "text-muted-foreground";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {typeof value === "number" && !isPercentage ? (
              <AnimatedCounter end={value} />
            ) : (
              value
            )}
          </div>
          {change !== undefined && (
            <div className={`flex items-center text-xs ${trendColor}`}>
              {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
              <span className="font-medium">
                {change > 0 ? "+" : ""}{change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="ml-1 text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FinancialKPICardsProps {
  data: {
    currentMonthRevenue: number;
    currentMonthRevenuePrevChange: number;
    pendingPaymentsAmount: number;
    athletesUpToDatePercentage: number;
    athletesInArrearsPercentage: number;
    averageMonthlyIncome: number;
    paymentsThisMonthCount: number;
    paymentsThisMonthPrevChange: number;
  };
}

export function FinancialKPICards({ data }: FinancialKPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KPICard
        title="Ingresos del Mes"
        value={formatCurrency(data.currentMonthRevenue)}
        change={data.currentMonthRevenuePrevChange}
        changeLabel="vs mes anterior"
        icon={<DollarSign className="h-4 w-4 text-primary" />}
        trend={data.currentMonthRevenuePrevChange >= 0 ? "up" : "down"}
        isPositiveTrend={true}
      />
      
      <KPICard
        title="Pagos Pendientes"
        value={formatCurrency(data.pendingPaymentsAmount)}
        icon={<Receipt className="h-4 w-4 text-warning" />}
        trend="neutral"
      />
      
      <KPICard
        title="Atletas al Día"
        value={`${data.athletesUpToDatePercentage.toFixed(1)}%`}
        icon={<UserCheck className="h-4 w-4 text-success" />}
        trend={data.athletesUpToDatePercentage >= 80 ? "up" : "down"}
        isPositiveTrend={true}
        isPercentage={true}
      />
      
      <KPICard
        title="Atletas en Mora"
        value={`${data.athletesInArrearsPercentage.toFixed(1)}%`}
        icon={<UserX className="h-4 w-4 text-destructive" />}
        trend={data.athletesInArrearsPercentage > 20 ? "up" : "down"}
        isPositiveTrend={false}
        isPercentage={true}
      />
      
      <KPICard
        title="Ingreso Promedio Mensual"
        value={formatCurrency(data.averageMonthlyIncome)}
        changeLabel="últimos 12 meses"
        icon={<TrendingUp className="h-4 w-4 text-primary" />}
        trend="neutral"
      />
      
      <KPICard
        title="Pagos Este Mes"
        value={data.paymentsThisMonthCount}
        change={data.paymentsThisMonthPrevChange}
        changeLabel="vs mes anterior"
        icon={<Users className="h-4 w-4 text-primary" />}
        trend={data.paymentsThisMonthPrevChange >= 0 ? "up" : "down"}
        isPositiveTrend={true}
      />
    </div>
  );
}
