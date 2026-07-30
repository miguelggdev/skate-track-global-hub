
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PaymentSettings from '@/components/club-config/PaymentSettings';
import { SystemSetting } from '@/pages/ClubConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FinanceIncomePie, FinanceCashFlowArea,
  FinanceDelinquencyLine, FinanceDebtorsList
} from '@/components/dashboard/FinanceCharts';
import RevenueChart from '@/components/dashboard/RevenueChart';
import { ExportExcelButton } from '@/components/ui/ExportExcelButton';
import { exportFinanceTransactions } from '@/utils/exportExcel';
import { FinanceReportDownloadButton } from '@/lib/pdf/FinanceReportDocument';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AddTransactionDialog from '@/components/finance/AddTransactionDialog';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import {
  DollarSign, TrendingUp, TrendingDown, Users, FileText, CreditCard,
  PieChart, Calculator, AlertCircle, CheckCircle, Clock, BarChart3, Percent
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  payment_status: string;
  transaction_date: string;
  notes?: string | null;
  category?: string | null;
  athlete_id?: string | null;
  athletes?: { first_name: string; last_name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  if (status === 'paid')      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1 text-xs"><CheckCircle className="h-3 w-3" />Pagado</Badge>;
  if (status === 'pending')   return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1 text-xs"><Clock className="h-3 w-3" />Pendiente</Badge>;
  if (status === 'overdue')   return <Badge className="bg-red-500/10 text-red-600 border-red-200 gap-1 text-xs"><AlertCircle className="h-3 w-3" />Vencido</Badge>;
  if (status === 'cancelled') return <Badge variant="secondary" className="text-xs">Cancelado</Badge>;
  return <Badge variant="outline" className="text-xs">{status}</Badge>;
}

const PERIOD_DATES: Record<string, string> = {
  week:    new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0],
  month:   new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  quarter: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString().split('T')[0],
  year:    `${new Date().getFullYear()}-01-01`,
};

// ─── Component ────────────────────────────────────────────────────────────────

const FinanceDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [searchPayment, setSearchPayment] = useState('');
  const { currency } = useCurrency();
  const queryClient = useQueryClient();

  const { data: paymentSettings = [] } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_settings').select('*').order('category');
      if (error) throw error;
      return (data ?? []) as SystemSetting[];
    },
  });

  const handlePaymentSettingsUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['system-settings'] });
  };

  const paymentCategorySettings = paymentSettings.filter(s => s.category === 'payment');

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const { data: summary, isLoading } = useQuery({
    queryKey: ['finance-summary', monthStart],
    queryFn: async () => {
      const [incomeRes, expensesRes, pendingRes, athletesRes, paidCountRes, pendingCountRes] =
        await Promise.all([
          supabase.from('financial_transactions').select('amount')
            .eq('transaction_type', 'income').gte('transaction_date', monthStart),
          supabase.from('financial_transactions').select('amount')
            .eq('transaction_type', 'expense').gte('transaction_date', monthStart),
          supabase.from('financial_transactions').select('amount')
            .eq('payment_status', 'pending'),
          supabase.from('athletes').select('id', { count: 'exact' }).eq('status', 'active'),
          supabase.from('financial_transactions').select('id', { count: 'exact' })
            .eq('payment_status', 'paid').gte('transaction_date', monthStart),
          supabase.from('financial_transactions').select('id', { count: 'exact' })
            .eq('payment_status', 'pending').gte('transaction_date', monthStart),
        ]);

      const totalIncome    = incomeRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const totalExpenses  = expensesRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const pendingAmount  = pendingRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const activeAthletes = athletesRes.count ?? 0;
      const paidCount      = paidCountRes.count ?? 0;
      const pendingCount   = pendingCountRes.count ?? 0;
      const total          = paidCount + pendingCount;
      const collectionRate = total > 0 ? Math.round((paidCount / total) * 100) : 0;
      const incomePerAthlete = activeAthletes > 0 ? Math.round(totalIncome / activeAthletes) : 0;

      return {
        totalIncome, totalExpenses, pendingAmount, activeAthletes,
        paidCount, pendingCount, collectionRate, incomePerAthlete,
      };
    },
  });

  const periodStart = PERIOD_DATES[selectedPeriod] ?? monthStart;

  const { data: recentTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['finance-recent-transactions', selectedPeriod, paymentStatusFilter],
    queryFn: async () => {
      let query = supabase
        .from('financial_transactions')
        .select('id, amount, transaction_type, payment_status, transaction_date, notes, category, athlete_id, athletes(first_name, last_name)')
        .gte('transaction_date', periodStart)
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (paymentStatusFilter !== 'all') {
        query = query.eq('payment_status', paymentStatusFilter);
      }
      const { data } = await query;
      return (data ?? []) as unknown as Transaction[];
    },
  });

  const payments  = recentTransactions.filter(t => t.transaction_type === 'income');
  const expenses  = recentTransactions.filter(t => t.transaction_type === 'expense');

  const filteredPayments = payments.filter(t => {
    if (!searchPayment.trim()) return true;
    const s = searchPayment.toLowerCase();
    const name = t.athletes ? `${t.athletes.first_name} ${t.athletes.last_name}`.toLowerCase() : '';
    return name.includes(s) || (t.notes ?? '').toLowerCase().includes(s) || (t.category ?? '').toLowerCase().includes(s);
  });

  const periodLabel = { week: 'Esta Semana', month: 'Este Mes', quarter: 'Este Trimestre', year: 'Este Año' }[selectedPeriod] ?? selectedPeriod;

  return (
    <DashboardLayout title="Panel Financiero" userRole="Gestor Financiero">
      <div className="space-y-6">

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '…' : formatCurrency(summary?.totalIncome ?? 0, currency)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                Ingresos reales este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '…' : formatCurrency(summary?.totalExpenses ?? 0, currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Balance: {isLoading ? '…' : formatCurrency((summary?.totalIncome ?? 0) - (summary?.totalExpenses ?? 0), currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(summary?.pendingAmount ?? 0) > 0 ? 'text-amber-600' : ''}`}>
                {isLoading ? '…' : formatCurrency(summary?.pendingAmount ?? 0, currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.pendingCount ?? 0} pagos pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atletas Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '…' : (summary?.activeAthletes ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Deportistas con membresía</p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs de gestión */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Tasa de Cobro</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Percent className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className={`text-2xl font-black ${
                (summary?.collectionRate ?? 0) >= 80 ? 'text-emerald-500'
                : (summary?.collectionRate ?? 0) >= 60 ? 'text-amber-500'
                : 'text-red-500'
              }`}>
                {isLoading ? '…' : `${summary?.collectionRate ?? 0}%`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.paidCount ?? 0} pagados vs {summary?.pendingCount ?? 0} pendientes
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in delay-75">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Ingreso por Atleta</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {isLoading ? '…' : formatCurrency(summary?.incomePerAthlete ?? 0, currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Promedio mensual por atleta activo</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in delay-150">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Pagos Confirmados</span>
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-green-600">
                {isLoading ? '…' : (summary?.paidCount ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Cobros exitosos este mes</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in delay-225">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Proyección de Cobro</span>
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {isLoading ? '…' : formatCurrency((summary?.totalIncome ?? 0) + (summary?.pendingAmount ?? 0), currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Si se cobra todo lo pendiente</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
            <TabsTrigger value="reports">Informes</TabsTrigger>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <RevenueChart />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FinanceIncomePie />
              <FinanceCashFlowArea />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FinanceDelinquencyLine />
              <FinanceDebtorsList />
            </div>
          </TabsContent>

          {/* ── Payments ── */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Gestión de Pagos
                </CardTitle>
                <CardDescription>Ingresos y pagos de cuotas del período seleccionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Label htmlFor="search-payment">Buscar</Label>
                      <Input
                        id="search-payment"
                        value={searchPayment}
                        onChange={(e) => setSearchPayment(e.target.value)}
                        placeholder="Nombre del atleta o concepto…"
                      />
                    </div>
                    <div className="w-full sm:w-44">
                      <Label>Estado</Label>
                      <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="overdue">Vencido</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-44">
                      <Label>Período</Label>
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Esta Semana</SelectItem>
                          <SelectItem value="month">Este Mes</SelectItem>
                          <SelectItem value="quarter">Este Trimestre</SelectItem>
                          <SelectItem value="year">Este Año</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-5 gap-4 p-3 font-medium border-b text-xs text-muted-foreground uppercase tracking-wide bg-muted/40">
                      <span>Miembro / Concepto</span>
                      <span>Fecha</span>
                      <span>Categoría</span>
                      <span>Monto</span>
                      <span>Estado</span>
                    </div>
                    {txLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
                      </div>
                    ) : filteredPayments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                        <CreditCard className="h-10 w-10 text-muted-foreground/25" />
                        <p className="text-sm text-muted-foreground">
                          {searchPayment ? 'Sin resultados para esta búsqueda' : `Sin ingresos en ${periodLabel}`}
                        </p>
                      </div>
                    ) : (
                      filteredPayments.map((t) => (
                        <div key={t.id} className="grid grid-cols-5 gap-4 p-3 border-b last:border-b-0 text-sm hover:bg-muted/30 transition-colors">
                          <span className="truncate font-medium">
                            {t.athletes
                              ? `${t.athletes.first_name} ${t.athletes.last_name}`
                              : (t.notes ?? 'Sin descripción')}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(t.transaction_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-muted-foreground truncate">{t.category ?? '—'}</span>
                          <span className="font-medium">{formatCurrency(Number(t.amount), currency)}</span>
                          <span>{statusBadge(t.payment_status)}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {filteredPayments.length > 0 && (
                    <p className="text-xs text-muted-foreground text-right">
                      Mostrando {filteredPayments.length} registros — {periodLabel}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Budgets ── */}
          <TabsContent value="budgets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Gestión de Presupuestos
                </CardTitle>
                <CardDescription>Planifica y controla los presupuestos anuales del club</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    <Calculator className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-muted-foreground">Módulo de presupuestos en desarrollo</p>
                    <p className="text-sm text-muted-foreground/70 max-w-sm">
                      Aquí podrás definir presupuestos anuales por categoría, hacer seguimiento de la ejecución y comparar con los gastos reales. Disponible en una próxima versión.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Reports ── */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Informes Financieros</CardTitle>
                <CardDescription>Genera y descarga informes financieros detallados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Período del Informe</Label>
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Esta Semana</SelectItem>
                          <SelectItem value="month">Este Mes</SelectItem>
                          <SelectItem value="quarter">Este Trimestre</SelectItem>
                          <SelectItem value="year">Este Año</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo de Informe</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Ingresos</SelectItem>
                          <SelectItem value="expenses">Gastos</SelectItem>
                          <SelectItem value="balance">Balance General</SelectItem>
                          <SelectItem value="members">Estado de Cuotas</SelectItem>
                          <SelectItem value="complete">Informe Completo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ExportExcelButton
                      label="Exportar Excel"
                      onExport={async () => {
                        const { data } = await supabase.from('financial_transactions').select('*').limit(500);
                        exportFinanceTransactions(data ?? []);
                      }}
                    />
                    <FinanceReportDownloadButton
                      data={{
                        period: periodLabel,
                        totalIncome: summary?.totalIncome ?? 0,
                        totalExpenses: summary?.totalExpenses ?? 0,
                        pendingAmount: summary?.pendingAmount ?? 0,
                        transactions: [],
                        currency,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Expenses ── */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" />Control de Gastos</CardTitle>
                <CardDescription>Gastos registrados del período seleccionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Registrar Nuevo Gasto</h3>
                    <AddTransactionDialog><Button size="sm">+ Nuevo Gasto</Button></AddTransactionDialog>
                  </div>
                  <Separator />

                  {/* Real expenses table */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{periodLabel}</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 gap-4 p-3 font-medium border-b text-xs text-muted-foreground uppercase tracking-wide bg-muted/40">
                        <span>Fecha</span>
                        <span>Concepto</span>
                        <span>Categoría</span>
                        <span>Monto</span>
                      </div>
                      {txLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
                        </div>
                      ) : expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                          <TrendingDown className="h-10 w-10 text-muted-foreground/25" />
                          <p className="text-sm text-muted-foreground">Sin gastos en {periodLabel}</p>
                        </div>
                      ) : (
                        expenses.map((t) => (
                          <div key={t.id} className="grid grid-cols-4 gap-4 p-3 border-b last:border-b-0 text-sm hover:bg-muted/30 transition-colors">
                            <span className="text-muted-foreground">
                              {new Date(t.transaction_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </span>
                            <span className="truncate">{t.notes ?? '—'}</span>
                            <span className="text-muted-foreground truncate">{t.category ?? '—'}</span>
                            <span className="font-medium text-red-600">{formatCurrency(Number(t.amount), currency)}</span>
                          </div>
                        ))
                      )}
                    </div>
                    {expenses.length > 0 && (
                      <p className="text-xs text-muted-foreground text-right mt-2">
                        {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} — Total: {formatCurrency(expenses.reduce((s, t) => s + Number(t.amount), 0), currency)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Settings ── */}
          <TabsContent value="settings" className="space-y-4">
            <PaymentSettings
              settings={paymentCategorySettings}
              onUpdate={handlePaymentSettingsUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FinanceDashboard;
