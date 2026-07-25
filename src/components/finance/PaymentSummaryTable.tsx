import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/utils/currency";
import { Badge } from "@/components/ui/badge";

interface PaymentSummaryTableProps {
  data: Array<{
    category: string;
    monthlyFee: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    percentageCollected: number;
    totalCollected: number;
    totalPending: number;
  }>;
}

export function PaymentSummaryTable({ data }: PaymentSummaryTableProps) {
  const totals = data.reduce(
    (acc, row) => ({
      paidCount: acc.paidCount + row.paidCount,
      pendingCount: acc.pendingCount + row.pendingCount,
      overdueCount: acc.overdueCount + row.overdueCount,
      totalCollected: acc.totalCollected + row.totalCollected,
      totalPending: acc.totalPending + row.totalPending,
    }),
    { paidCount: 0, pendingCount: 0, overdueCount: 0, totalCollected: 0, totalPending: 0 }
  );

  const totalAthletes = totals.paidCount + totals.pendingCount + totals.overdueCount;
  const overallPercentage = totalAthletes > 0 ? (totals.paidCount / totalAthletes) * 100 : 0;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Resumen de Pagos por Categoría</CardTitle>
        <CardDescription>Estado de cobros y recaudación por categoría de atletas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Cuota Mensual</TableHead>
                <TableHead className="text-center">Pagados</TableHead>
                <TableHead className="text-center">Pendientes</TableHead>
                <TableHead className="text-center">En Mora</TableHead>
                <TableHead className="text-center">% Recaudado</TableHead>
                <TableHead className="text-right">Total Cobrado</TableHead>
                <TableHead className="text-right">Total Pendiente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="font-medium">{row.category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.monthlyFee)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {row.paidCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      {row.pendingCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      {row.overdueCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${
                      row.percentageCollected >= 80 ? "text-success" :
                      row.percentageCollected >= 60 ? "text-warning" :
                      "text-destructive"
                    }`}>
                      {row.percentageCollected.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-success">
                    {formatCurrency(row.totalCollected)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {formatCurrency(row.totalPending)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">TOTALES</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{totals.paidCount}</TableCell>
                <TableCell className="text-center font-bold">{totals.pendingCount}</TableCell>
                <TableCell className="text-center font-bold">{totals.overdueCount}</TableCell>
                <TableCell className="text-center font-bold">
                  {overallPercentage.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right font-bold text-success">
                  {formatCurrency(totals.totalCollected)}
                </TableCell>
                <TableCell className="text-right font-bold text-destructive">
                  {formatCurrency(totals.totalPending)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
