
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ToggleButtonGroup, ToggleButton } from '@/components/ui/toggle-button-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import AddTransactionDialog from '@/components/finance/AddTransactionDialog';
import { TransactionReceiptGenerator } from '@/components/finance/TransactionReceiptGenerator';
import { AthleteLetterGenerator } from '@/components/finance/AthleteLetterGenerator';
import { FinancialReportGenerator } from '@/components/finance/FinancialReportGenerator';
import { ReportPreviewDialog } from '@/components/finance/ReportPreviewDialog';
import { useTransactions, useFinancialStats, useUpdateTransaction } from '@/hooks/useTransactions';
import { useFinancialReports, type ReportType, type ReportPeriod } from '@/hooks/useFinancialReports';
import { generateFinancialReportPDF } from '@/utils/pdfGenerator';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  FileText,
  CreditCard,
  PieChart,
  Calculator,
  AlertCircle,
  CheckCircle,
  Clock,
  Euro,
  Wallet,
  Receipt,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react';

const Finance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState('all');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('complete');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Use real data from hooks
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: financialStats, isLoading: statsLoading } = useFinancialStats();
  const updateTransactionMutation = useUpdateTransaction();
  const { data: reportData, isLoading: reportLoading } = useFinancialReports(selectedReportType, selectedPeriod);

  // Filter transactions based on search and type
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.payer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.athletes?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.athletes?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedTransactionType === 'all' || 
                       (selectedTransactionType === 'income' && ['mensualidad', 'anualidad', 'registration_fee'].includes(transaction.transaction_type)) ||
                       (selectedTransactionType === 'expense' && ['equipment', 'travel', 'coaching', 'other', 'poliza_deportiva', 'psicologia'].includes(transaction.transaction_type));
    
    return matchesSearch && matchesType;
  });

  // Format stats for display with dynamic currency
  const { currency } = useCurrency();
  
  const stats = [
    { 
      title: "INGRESOS TOTALES", 
      value: financialStats ? formatCurrency(financialStats.totalIncome, currency) : formatCurrency(0, currency), 
      change: financialStats?.incomeChange ? `${financialStats.incomeChange > 0 ? '+' : ''}${financialStats.incomeChange.toFixed(1)}%` : "0%", 
      period: "desde el mes pasado",
      icon: DollarSign,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    { 
      title: "GASTOS TOTALES", 
      value: financialStats ? formatCurrency(Math.abs(financialStats.totalExpenses), currency) : formatCurrency(0, currency), 
      change: financialStats?.expensesChange ? `${financialStats.expensesChange > 0 ? '+' : ''}${financialStats.expensesChange.toFixed(1)}%` : "0%", 
      period: "desde el mes pasado",
      icon: TrendingDown,
      bgColor: "argon-gradient-red",
      isPositive: financialStats ? financialStats.expensesChange <= 0 : true
    },
    { 
      title: "PAGOS PENDIENTES", 
      value: financialStats ? formatCurrency(financialStats.pendingPayments, currency) : formatCurrency(0, currency), 
      change: "Pendientes", 
      period: "por cobrar",
      icon: AlertCircle,
      bgColor: "argon-gradient-orange",
      isPositive: false
    },
    { 
      title: "BENEFICIO NETO", 
      value: financialStats ? formatCurrency(financialStats.netProfit, currency) : formatCurrency(0, currency), 
      change: financialStats?.netProfit > 0 ? "+Positivo" : "Negativo", 
      period: "balance actual",
      icon: TrendingUp,
      bgColor: "argon-gradient-green",
      isPositive: financialStats ? financialStats.netProfit > 0 : false
    },
  ];

  const handleReceiptGenerated = async (transactionId: string, receiptUrl: string) => {
    try {
      await updateTransactionMutation.mutateAsync({
        id: transactionId,
        updates: { receipt_url: receiptUrl }
      });
    } catch (error) {
      console.error('Error updating transaction with receipt URL:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportData) {
      toast({
        title: "Error",
        description: "No hay datos disponibles para generar el informe",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    try {
      setGeneratedReport(reportData);
      toast({
        title: "Éxito",
        description: "Informe generado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el informe",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePreviewReport = () => {
    if (!reportData) {
      toast({
        title: "Error",
        description: "No hay datos disponibles para mostrar la vista previa",
        variant: "destructive",
      });
      return;
    }
    setShowPreviewDialog(true);
  };

  const handleExportPDF = async () => {
    if (!reportData) {
      toast({
        title: "Error",
        description: "No hay datos disponibles para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateFinancialReportPDF(reportData, currency);
      toast({
        title: "Éxito",
        description: "PDF generado y descargado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el PDF",
        variant: "destructive",
      });
    }
  };

  const budgetCategories = [
    { name: 'Personal y Entrenadores', budget: 60000, spent: 45000, color: 'bg-blue-500' },
    { name: 'Instalaciones', budget: 25000, spent: 18000, color: 'bg-green-500' },
    { name: 'Equipamiento', budget: 15000, spent: 8500, color: 'bg-purple-500' },
    { name: 'Competiciones', budget: 20000, spent: 12000, color: 'bg-orange-500' },
  ];

  return (
    <DashboardLayout title="Gestión Financiera" userRole="Gestor Financiero">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end gap-3">
          <AddTransactionDialog>
            <Button variant="toggle-primary" className="rounded-full px-6">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Transacción
            </Button>
          </AddTransactionDialog>
          <Button variant="toggle-secondary" className="rounded-full px-6">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardDescription className="text-xs font-medium uppercase tracking-wider">
                    {stat.title}
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {stat.value}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <span className={`font-semibold ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>{' '}
                  {stat.period}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
            <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
            <TabsTrigger value="reports">Informes</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="letters">Cartas</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribución de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cuotas de Socios</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <Progress value={65} className="h-3" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Competiciones</span>
                      <span className="font-medium">20%</span>
                    </div>
                    <Progress value={20} className="h-3" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Patrocinios</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <Progress value={15} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximos Vencimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Cuotas Enero</p>
                      <p className="text-sm text-gray-500">Vence: 31/01/2024</p>
                    </div>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(2450, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Alquiler Instalaciones</p>
                      <p className="text-sm text-gray-500">Vence: 15/01/2024</p>
                    </div>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(1200, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Seguros</p>
                      <p className="text-sm text-gray-500">Vence: 20/01/2024</p>
                    </div>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(850, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Historial de Transacciones
              </CardTitle>
              <CardDescription>
                Registro completo de ingresos y gastos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input 
                      placeholder="Buscar transacciones..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <ToggleButtonGroup value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
                    <ToggleButton value="all">Todas</ToggleButton>
                    <ToggleButton value="income">Ingresos</ToggleButton>
                    <ToggleButton value="expense">Gastos</ToggleButton>
                  </ToggleButtonGroup>
                  <Button variant="outline">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-gray-50">
                    <span>Fecha</span>
                    <span>Concepto</span>
                    <span>Pagador</span>
                    <span>Tipo</span>
                    <span>Cantidad</span>
                    <span>Estado</span>
                    <span>Acciones</span>
                  </div>
                  
                  {transactionsLoading ? (
                    <div className="p-8 text-center">Cargando transacciones...</div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      {searchTerm || selectedTransactionType !== 'all' ? 'No se encontraron transacciones con los filtros aplicados' : 'No hay transacciones registradas'}
                    </div>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="grid grid-cols-7 gap-4 p-4 border-b hover:bg-gray-50">
                        <span className="text-sm">{new Date(transaction.transaction_date).toLocaleDateString('es-ES')}</span>
                        <div className="space-y-1">
                          <span className="font-medium block">{transaction.description}</span>
                          {transaction.athletes && (
                            <span className="text-xs text-muted-foreground block">
                              {transaction.athletes.first_name} {transaction.athletes.last_name}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {transaction.payer_name && <span className="text-sm block">{transaction.payer_name}</span>}
                          {transaction.payer_identification && <span className="text-xs text-muted-foreground block">{transaction.payer_identification}</span>}
                        </div>
                        <Badge variant={['mensualidad', 'anualidad', 'registration_fee'].includes(transaction.transaction_type) ? 'default' : 'secondary'}>
                          {['mensualidad', 'anualidad', 'registration_fee'].includes(transaction.transaction_type) ? 'Ingreso' : 'Gasto'}
                        </Badge>
                        <span className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(transaction.amount), currency)}
                        </span>
                        <div className="flex items-center gap-1">
                          {transaction.payment_status === 'paid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {transaction.payment_status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                          {transaction.payment_status === 'overdue' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          <span className="text-sm capitalize">{transaction.payment_status}</span>
                        </div>
                        <TransactionReceiptGenerator 
                          transaction={transaction}
                          onReceiptGenerated={(receiptUrl) => handleReceiptGenerated(transaction.id, receiptUrl)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="space-y-6">
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Control de Presupuestos
              </CardTitle>
              <CardDescription>
                Seguimiento del presupuesto anual por categorías
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Presupuesto Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">€120,000</div>
                      <Progress value={45} className="mt-2" />
                      <p className="text-xs text-gray-500 mt-1">45% ejecutado</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Gastado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">€83,500</div>
                      <Progress value={69} className="mt-2" />
                      <p className="text-xs text-gray-500 mt-1">69% del presupuesto</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Disponible</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">€36,500</div>
                      <Progress value={31} className="mt-2" />
                      <p className="text-xs text-gray-500 mt-1">31% restante</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Desglose por Categorías</h3>
                  <div className="space-y-4">
                    {budgetCategories.map((category, index) => (
                      <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${category.color}`}></div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            €{category.spent.toLocaleString()} / €{category.budget.toLocaleString()}
                          </div>
                          <Progress value={(category.spent / category.budget) * 100} className="w-32 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informes Financieros
                </CardTitle>
                <CardDescription>
                  Genera informes detallados de la situación financiera
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="report-period">Período del Informe</Label>
                      <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as ReportPeriod)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Esta Semana</SelectItem>
                          <SelectItem value="month">Este Mes</SelectItem>
                          <SelectItem value="quarter">Este Trimestre</SelectItem>
                          <SelectItem value="year">Este Año</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="report-type">Tipo de Informe</Label>
                      <Select value={selectedReportType} onValueChange={(value) => setSelectedReportType(value as ReportType)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Ingresos</SelectItem>
                          <SelectItem value="expenses">Gastos</SelectItem>
                          <SelectItem value="balance">Balance General</SelectItem>
                          <SelectItem value="complete">Informe Completo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleGenerateReport}
                      disabled={isGeneratingReport || reportLoading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isGeneratingReport ? 'Generando...' : 'Generar Informe'}
                    </Button>
                    <Button variant="outline" onClick={handlePreviewReport} disabled={!reportData}>
                      Vista Previa
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF} disabled={!reportData}>
                      Exportar PDF
                    </Button>
                  </div>

                  {reportLoading && (
                    <div className="text-center py-4">
                      <div className="text-muted-foreground">Cargando datos del informe...</div>
                    </div>
                  )}

                  {generatedReport && (
                    <div className="mt-6">
                      <FinancialReportGenerator report={generatedReport} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gestión de Pagos
              </CardTitle>
              <CardDescription>
                Control de cuotas y pagos de miembros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">€24,680</div>
                        <p className="text-sm text-gray-500">Pagos Recibidos</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">€8,924</div>
                        <p className="text-sm text-gray-500">Pagos Pendientes</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">€2,150</div>
                        <p className="text-sm text-gray-500">Pagos Vencidos</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Estado de Cuotas</h3>
                  <Button className="argon-gradient-blue text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Cargo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* Letters Tab */}
          <TabsContent value="letters" className="space-y-6">
            <AthleteLetterGenerator />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
            <CardHeader>
              <CardTitle>Configuración Financiera</CardTitle>
              <CardDescription>
                Configura tarifas, métodos de pago y notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tarifas y Cuotas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monthly-fee">Cuota Mensual (€)</Label>
                      <Input id="monthly-fee" type="number" defaultValue="85" />
                    </div>
                    <div>
                      <Label htmlFor="registration-fee">Cuota de Inscripción (€)</Label>
                      <Input id="registration-fee" type="number" defaultValue="50" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="argon-gradient-blue text-white">Guardar Configuración</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

        {/* Report Preview Dialog */}
        <ReportPreviewDialog 
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          report={reportData}
        />
      </div>
    </DashboardLayout>
  );
};

export default Finance;
