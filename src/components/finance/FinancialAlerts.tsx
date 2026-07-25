import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingDown, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface FinancialAlertsProps {
  data: {
    currentMonthRevenuePrevChange: number;
    athletesInArrearsPercentage: number;
    athletesInArrearsCount: number;
  };
}

export function FinancialAlerts({ data }: FinancialAlertsProps) {
  const hasRevenueDecline = data.currentMonthRevenuePrevChange < -15;
  const hasHighDelinquency = data.athletesInArrearsPercentage > 25;

  if (!hasRevenueDecline && !hasHighDelinquency) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {hasRevenueDecline && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <TrendingDown className="h-4 w-4" />
          <AlertTitle>Disminución de Ingresos</AlertTitle>
          <AlertDescription className="mt-2">
            Los ingresos han disminuido en {Math.abs(data.currentMonthRevenuePrevChange).toFixed(1)}% 
            comparado con el mes anterior. Considere revisar las estrategias de cobro y seguimiento.
          </AlertDescription>
        </Alert>
      )}

      {hasHighDelinquency && (
        <Alert variant="destructive" className="border-warning/50 bg-warning/10 text-warning-foreground">
          <UserX className="h-4 w-4" />
          <AlertTitle>Alta Morosidad Detectada</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between">
            <span>
              {data.athletesInArrearsPercentage.toFixed(1)}% de los atletas ({data.athletesInArrearsCount} atletas) 
              están en mora. Se recomienda acción inmediata.
            </span>
            <Button variant="outline" size="sm" asChild className="ml-4">
              <Link to="#delinquent">Ver Lista</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
