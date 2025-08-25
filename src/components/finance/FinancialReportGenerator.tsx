import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { FinancialReport } from '@/hooks/useFinancialReports';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Receipt,
  PieChart,
  BarChart3
} from 'lucide-react';

interface FinancialReportGeneratorProps {
  report: FinancialReport;
}

export const FinancialReportGenerator: React.FC<FinancialReportGeneratorProps> = ({ report }) => {
  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleDateString('es-ES');

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      mensualidad: 'Cuota Mensual',
      anualidad: 'Cuota Anual',
      registration_fee: 'Cuota de Inscripción',
      equipment: 'Equipamiento',
      travel: 'Viajes',
      coaching: 'Entrenamiento',
      poliza_deportiva: 'Póliza Deportiva',
      psicologia: 'Psicología',
      other: 'Otros'
    };
    return labels[type] || type;
  };

  const renderReportHeader = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Informe Financiero - {report.type === 'income' ? 'Ingresos' : 
                                   report.type === 'expenses' ? 'Gastos' : 
                                   report.type === 'balance' ? 'Balance General' : 'Informe Completo'}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Período: {formatDate(report.dateRange.startDate)} - {formatDate(report.dateRange.endDate)}
            </p>
          </div>
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>
  );

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-muted-foreground">INGRESOS TOTALES</span>
          </div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(report.summary.totalIncome)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-muted-foreground">GASTOS TOTALES</span>
          </div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {formatCurrency(report.summary.totalExpenses)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-muted-foreground">BALANCE NETO</span>
          </div>
          <div className={`text-2xl font-bold mt-2 ${report.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(report.summary.netBalance)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Receipt className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-muted-foreground">PENDIENTES</span>
          </div>
          <div className="text-2xl font-bold text-orange-600 mt-2">
            {formatCurrency(report.summary.pendingAmount)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCategoryBreakdown = () => {
    const hasIncomeData = Object.keys(report.categoryBreakdown.income).length > 0;
    const hasExpenseData = Object.keys(report.categoryBreakdown.expenses).length > 0;

    if (!hasIncomeData && !hasExpenseData) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {hasIncomeData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-green-600" />
                Distribución de Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(report.categoryBreakdown.income).map(([category, amount]) => {
                  const percentage = (amount / report.summary.totalIncome) * 100;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category}</span>
                        <div className="text-right">
                          <span className="font-bold">{formatCurrency(amount)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {hasExpenseData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-red-600" />
                Distribución de Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(report.categoryBreakdown.expenses).map(([category, amount]) => {
                  const percentage = (amount / report.summary.totalExpenses) * 100;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category}</span>
                        <div className="text-right">
                          <span className="font-bold">{formatCurrency(amount)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderTransactionsList = () => {
    if (report.transactions.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No hay transacciones en el período seleccionado
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Transacciones ({report.transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.transactions.map((transaction, index) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{transaction.description}</div>
                    <Badge variant={getStatusBadgeVariant(transaction.payment_status)}>
                      {getStatusLabel(transaction.payment_status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatDate(new Date(transaction.transaction_date))} • {getTransactionTypeLabel(transaction.transaction_type)}
                    {transaction.payer_name && ` • ${transaction.payer_name}`}
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  ['mensualidad', 'anualidad', 'registration_fee'].includes(transaction.transaction_type) 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {['mensualidad', 'anualidad', 'registration_fee'].includes(transaction.transaction_type) ? '+' : '-'}
                  {formatCurrency(Math.abs(transaction.amount))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMonthlyTrends = () => {
    if (report.type !== 'complete' && report.type !== 'balance') return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tendencias Mensuales (Últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.monthlyTrends.map((month, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                <div className="font-medium">{month.month}</div>
                <div className="text-green-600 font-medium">
                  +{formatCurrency(month.income)}
                </div>
                <div className="text-red-600 font-medium">
                  -{formatCurrency(month.expenses)}
                </div>
                <div className={`font-bold ${month.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(month.balance)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {renderReportHeader()}
      {renderSummaryCards()}
      {renderCategoryBreakdown()}
      {renderTransactionsList()}
      {renderMonthlyTrends()}
    </div>
  );
};