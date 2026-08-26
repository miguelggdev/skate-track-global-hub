import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { FinancialReport } from '@/hooks/useFinancialReports';
import { formatCurrency } from '@/utils/currency';
import { generateHTMLTemplate } from '@/utils/reportTemplateGenerator';
import { useReportTemplate } from '@/hooks/useReportTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Receipt,
  PieChart,
  BarChart3,
  Download
} from 'lucide-react';

interface FinancialReportGeneratorProps {
  report: FinancialReport;
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const FinancialReportGenerator: React.FC<FinancialReportGeneratorProps> = ({ report }) => {
  const { clubInfo, reportSettings } = useReportTemplate();
  const { toast } = useToast();

  const formatDate = (date: Date) => date.toLocaleDateString('es-ES');

  const downloadPDF = async () => {
    const content = `
      <div style="margin-bottom: 40px;">
        <h1 style="font-size: 32px; font-weight: bold; text-align: center; margin-bottom: 20px; color: #1a1a1a;">
          Informe Financiero - ${report.type === 'income' ? 'Ingresos' : 
                                 report.type === 'expenses' ? 'Gastos' : 
                                 report.type === 'balance' ? 'Balance General' : 'Informe Completo'}
        </h1>
        <p style="text-align: center; font-size: 16px; color: #666; margin-bottom: 30px;">
          Período: ${formatDate(report.dateRange.startDate)} - ${formatDate(report.dateRange.endDate)}
        </p>
      </div>

      <!-- Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e;">
          <h3 style="margin: 0 0 10px 0; color: #16a34a; font-weight: bold;">Total Ingresos</h3>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">${formatCurrency(report.summary.totalIncome)}</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h3 style="margin: 0 0 10px 0; color: #dc2626; font-weight: bold;">Total Gastos</h3>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">${formatCurrency(report.summary.totalExpenses)}</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 10px 0; color: #2563eb; font-weight: bold;">Balance Neto</h3>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${report.summary.netBalance >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(report.summary.netBalance)}</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 10px 0; color: #d97706; font-weight: bold;">Pendientes</h3>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">${formatCurrency(report.summary.pendingAmount)}</p>
        </div>
      </div>

      <!-- Category Breakdown -->
      ${Object.keys(report.categoryBreakdown.income).length > 0 || Object.keys(report.categoryBreakdown.expenses).length > 0 ? `
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #1a1a1a;">Distribución por Categorías</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
            ${Object.keys(report.categoryBreakdown.income).length > 0 ? `
              <div>
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #16a34a;">Ingresos</h3>
                ${Object.entries(report.categoryBreakdown.income).map(([category, amount]) => {
                  const percentage = (amount / report.summary.totalIncome) * 100;
                  return `
                    <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-weight: 500;">${escapeHtml(category)}</span>
                        <span>${formatCurrency(amount)} (${percentage.toFixed(1)}%)</span>
                      </div>
                      <div style="background: #e5e5e5; height: 6px; border-radius: 3px;">
                        <div style="background: #22c55e; height: 100%; width: ${percentage}%; border-radius: 3px;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
            ${Object.keys(report.categoryBreakdown.expenses).length > 0 ? `
              <div>
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #dc2626;">Gastos</h3>
                ${Object.entries(report.categoryBreakdown.expenses).map(([category, amount]) => {
                  const percentage = (amount / report.summary.totalExpenses) * 100;
                  return `
                    <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-weight: 500;">${escapeHtml(category)}</span>
                        <span>${formatCurrency(amount)} (${percentage.toFixed(1)}%)</span>
                      </div>
                      <div style="background: #e5e5e5; height: 6px; border-radius: 3px;">
                        <div style="background: #ef4444; height: 100%; width: ${percentage}%; border-radius: 3px;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Transactions List -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #1a1a1a;">Transacciones (${report.transactions.length})</h2>
        ${report.transactions.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e5e5;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e5e5; font-weight: bold;">Descripción</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #e5e5e5; font-weight: bold;">Fecha</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #e5e5e5; font-weight: bold;">Tipo</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #e5e5e5; font-weight: bold;">Estado</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e5e5; font-weight: bold;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${report.transactions.slice(0, 20).map(transaction => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e5e5;">${escapeHtml(transaction.description)}${transaction.payer_name ? ` - ${escapeHtml(transaction.payer_name)}` : ''}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #e5e5e5;">${formatDate(new Date(transaction.transaction_date))}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #e5e5e5;">${getTransactionTypeLabel(transaction.transaction_type)}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #e5e5e5;">${getStatusLabel(transaction.payment_status)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #e5e5e5; color: ${['mensualidad', 'anualidad', 'registration_fee'].includes(transaction.transaction_type) ? '#16a34a' : '#dc2626'};">
                    ${['mensualidad', 'anualidad', 'registration_fee'].includes(transaction.transaction_type) ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${report.transactions.length > 20 ? `<p style="margin-top: 10px; font-size: 12px; color: #666; font-style: italic;">Mostrando las primeras 20 transacciones de ${report.transactions.length} total.</p>` : ''}
        ` : `
          <p style="text-align: center; color: #666; font-style: italic;">No hay transacciones en el período seleccionado</p>
        `}
      </div>
    `;

    const htmlContent = generateHTMLTemplate(clubInfo, reportSettings, content);

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px';
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `informe-financiero-${report.type}-${formatDate(report.dateRange.startDate).replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
    } catch (error: any) {
      toast({
        title: "Error al generar el PDF",
        description: error.message || "No se pudo generar el informe financiero",
        variant: "destructive",
      });
    } finally {
      document.body.removeChild(container);
    }
  };

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
            {report.monthlyTrends.map((month) => (
              <div key={month.month} className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
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
      
      <div className="mb-6 flex justify-end">
        <button 
          onClick={downloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </button>
      </div>
      {renderSummaryCards()}
      {renderCategoryBreakdown()}
      {renderTransactionsList()}
      {renderMonthlyTrends()}
    </div>
  );
};