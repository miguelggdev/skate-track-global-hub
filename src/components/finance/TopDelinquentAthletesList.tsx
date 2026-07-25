import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TopDelinquentAthletesListProps {
  data: Array<{
    id: string;
    name: string;
    monthsOverdue: number;
    totalPending: number;
    lastPaymentDate: string | null;
  }>;
  onGenerateLetter?: (athleteId: string) => void;
}

export function TopDelinquentAthletesList({ data, onGenerateLetter }: TopDelinquentAthletesListProps) {
  if (data.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Atletas en Mora</CardTitle>
          <CardDescription>Top 10 atletas con más pagos pendientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-success/10 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg font-semibold text-foreground">¡Excelente!</p>
            <p className="text-sm text-muted-foreground">No hay atletas en mora actualmente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Atletas en Mora
        </CardTitle>
        <CardDescription>Top 10 atletas con más pagos pendientes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((athlete, index) => {
            const severityColor = athlete.monthsOverdue > 3 ? "destructive" : "warning";
            
            return (
              <div
                key={athlete.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {athlete.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {athlete.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`bg-${severityColor}/10 text-${severityColor} border-${severityColor}/20`}>
                        {athlete.monthsOverdue} {athlete.monthsOverdue === 1 ? "mes" : "meses"} en mora
                      </Badge>
                      {athlete.lastPaymentDate && (
                        <span className="text-xs text-muted-foreground">
                          Último pago: {format(new Date(athlete.lastPaymentDate), "dd MMM yyyy", { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Pendiente</p>
                    <p className="text-lg font-bold text-destructive">
                      {formatCurrency(athlete.totalPending)}
                    </p>
                  </div>
                  
                  {onGenerateLetter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGenerateLetter(athlete.id)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Generar Carta
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
