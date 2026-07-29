
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import AddTransactionDialog from '@/components/finance/AddTransactionDialog';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import {
  DollarSign, TrendingUp, TrendingDown, Users, Calendar,
  FileText, CreditCard, PieChart, Calculator, AlertCircle, CheckCircle, Clock,
  BarChart3, Percent
} from 'lucide-react';

interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  pendingAmount: number;
  activeAthletes: number;
  paidCount: number;
  pendingCount: number;
  collectionRate: number;
  incomePerAthlete: number;
  loading: boolean;
}

const FinanceDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { currency } = useCurrency();

  const [summary, setSummary] = useState<FinanceSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    pendingAmount: 0,
    activeAthletes: 0,
    paidCount: 0,
    pendingCount: 0,
    collectionRate: 0,
    incomePerAthlete: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

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

      const totalIncome = incomeRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const totalExpenses = expensesRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const pendingAmount = pendingRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const activeAthletes = athletesRes.count ?? 0;
      const paidCount = paidCountRes.count ?? 0;
      const pendingCount = pendingCountRes.count ?? 0;
      const total = paidCount + pendingCount;
      const collectionRate = total > 0 ? Math.round((paidCount / total) * 100) : 0;
      const incomePerAthlete = activeAthletes > 0 ? Math.round(totalIncome / activeAthletes) : 0;

      setSummary({
        totalIncome, totalExpenses, pendingAmount, activeAthletes,
        paidCount, pendingCount, collectionRate, incomePerAthlete, loading: false,
      });
    };

    fetchSummary();
  }, []);

  const periodLabel = selectedPeriod === 'month' ? 'Este Mes'
    : selectedPeriod === 'quarter' ? 'Este Trimestre'
    : selectedPeriod === 'year' ? 'Este Año'
    : selectedPeriod === 'week' ? 'Esta Semana'
    : selectedPeriod;

  return (
    <DashboardLayout title="Panel Financiero" userRole="Gestor Financiero">
      <div className="space-y-6">

        {/* KPIs principales con datos reales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.loading ? '...' : formatCurrency(summary.totalIncome, currency)}
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
                {summary.loading ? '...' : formatCurrency(summary.totalExpenses, currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Balance: {summary.loading ? '...' : formatCurrency(summary.totalIncome - summary.totalExpenses, currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.pendingAmount > 0 ? 'text-amber-600' : ''}`}>
                {summary.loading ? '...' : formatCurrency(summary.pendingAmount, currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.pendingCount} pagos pendientes
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
                {summary.loading ? '...' : summary.activeAthletes}
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
              <p className={`text-2xl font-black ${summary.collectionRate >= 80 ? 'text-emerald-500' : summary.collectionRate >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                {summary.loading ? '...' : `${summary.collectionRate}%`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{summary.paidCount} pagados vs {summary.pendingCount} pendientes</p>
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
                {summary.loading ? '...' : formatCurrency(summary.incomePerAthlete, currency)}
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
                {summary.loading ? '...' : summary.paidCount}
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
                {summary.loading ? '...' : formatCurrency(summary.totalIncome + summary.pendingAmount, currency)}
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

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Gestión de Pagos
                </CardTitle>
                <CardDescription>Administra los pagos de cuotas y servicios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search-payment">Buscar Pago</Label>
                      <Input id="search-payment" placeholder="Buscar por nombre o concepto..." />
                    </div>
                    <div className="w-48">
                      <Label>Estado</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Todos los estados" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                          <SelectItem value="overdue">Vencido</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b text-sm">
                      <span>Miembro</span><span>Concepto</span><span>Cantidad</span><span>Estado</span><span>Acciones</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-4 border-b text-sm">
                      <span>Ana García</span><span>Cuota Mensual</span>
                      <span>{formatCurrency(85, currency)}</span>
                      <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" />Pagado</span>
                      <Button variant="outline" size="sm">Ver Detalles</Button>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-4 border-b text-sm">
                      <span>Carlos Ruiz</span><span>Cuota Mensual</span>
                      <span>{formatCurrency(85, currency)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-yellow-500" />Pendiente</span>
                      <Button variant="outline" size="sm">Recordatorio</Button>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-4 text-sm">
                      <span>María López</span><span>Competición</span>
                      <span>{formatCurrency(150, currency)}</span>
                      <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4 text-red-500" />Vencido</span>
                      <Button variant="destructive" size="sm">Gestionar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Gestión de Presupuestos</CardTitle>
                <CardDescription>Planifica y controla los presupuestos anuales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { t: 'Presupuesto Anual', v: 120000, pct: 45 },
                      { t: 'Gastos Operativos', v: 78500, pct: 62 },
                      { t: 'Inversiones', v: 25000, pct: 30 },
                    ].map(({ t, v, pct }) => (
                      <Card key={t}>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">{t}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatCurrency(v, currency)}</div>
                          <Progress value={pct} className="mt-2" />
                          <p className="text-xs text-muted-foreground mt-1">{pct}% ejecutado</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Desglose por Categorías</h3>
                    <div className="space-y-3">
                      {[
                        { l: 'Personal y Entrenadores', used: 45000, total: 60000, pct: 75 },
                        { l: 'Instalaciones y Mantenimiento', used: 18000, total: 25000, pct: 72 },
                        { l: 'Equipamiento Deportivo', used: 8500, total: 15000, pct: 57 },
                        { l: 'Competiciones y Viajes', used: 12000, total: 20000, pct: 60 },
                      ].map(({ l, used, total, pct }) => (
                        <div key={l} className="flex justify-between items-center p-3 border rounded">
                          <span className="text-sm">{l}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatCurrency(used, currency)} / {formatCurrency(total, currency)}</div>
                            <Progress value={pct} className="w-32 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                        totalIncome: summary.totalIncome,
                        totalExpenses: summary.totalExpenses,
                        pendingAmount: summary.pendingAmount,
                        transactions: [],
                        currency,
                      }}
                    />
                  </div>

                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informes Recientes</h3>
                    <div className="space-y-2">
                      {[
                        { t: 'Informe Mensual - Junio 2026', d: 'Generado el 01/07/2026' },
                        { t: 'Balance Trimestral Q2 2026', d: 'Generado el 30/06/2026' },
                        { t: 'Estado de Cuotas - Junio', d: 'Generado el 30/06/2026' },
                      ].map(({ t, d }) => (
                        <div key={t} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium text-sm">{t}</p>
                            <p className="text-xs text-muted-foreground">{d}</p>
                          </div>
                          <Button variant="outline" size="sm">Descargar</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" />Control de Gastos</CardTitle>
                <CardDescription>Registra y categoriza todos los gastos del club</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Registrar Nuevo Gasto</h3>
                    <AddTransactionDialog><Button>+ Nuevo Gasto</Button></AddTransactionDialog>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div><Label htmlFor="expense-concept">Concepto</Label><Input id="expense-concept" placeholder="Descripción del gasto" /></div>
                    <div><Label htmlFor="expense-amount">Cantidad</Label><Input id="expense-amount" type="number" placeholder="0.00" /></div>
                    <div>
                      <Label>Categoría</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Personal</SelectItem>
                          <SelectItem value="facilities">Instalaciones</SelectItem>
                          <SelectItem value="equipment">Equipamiento</SelectItem>
                          <SelectItem value="travel">Viajes</SelectItem>
                          <SelectItem value="admin">Administrativos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label htmlFor="expense-date">Fecha</Label><Input id="expense-date" type="date" /></div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Gastos Recientes</h3>
                    <div className="border rounded-lg">
                      <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b text-sm">
                        <span>Fecha</span><span>Concepto</span><span>Categoría</span><span>Cantidad</span><span>Acciones</span>
                      </div>
                      {[
                        { d: '15/07/2026', c: 'Mantenimiento pista', cat: 'Instalaciones', amt: 450 },
                        { d: '12/07/2026', c: 'Uniformes nuevos', cat: 'Equipamiento', amt: 1250 },
                        { d: '10/07/2026', c: 'Viaje competición', cat: 'Viajes', amt: 890 },
                      ].map(({ d, c, cat, amt }) => (
                        <div key={d + c} className="grid grid-cols-5 gap-4 p-4 border-b text-sm last:border-b-0">
                          <span>{d}</span><span>{c}</span><span>{cat}</span>
                          <span>{formatCurrency(amt, currency)}</span>
                          <Button variant="outline" size="sm">Editar</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración Financiera</CardTitle>
                <CardDescription>Ajusta la configuración del sistema financiero</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cuotas y Tarifas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><Label htmlFor="monthly-fee">Cuota Mensual</Label><Input id="monthly-fee" type="number" defaultValue="85" /></div>
                      <div><Label htmlFor="registration-fee">Cuota de Inscripción</Label><Input id="registration-fee" type="number" defaultValue="50" /></div>
                      <div><Label htmlFor="competition-fee">Tarifa Competición</Label><Input id="competition-fee" type="number" defaultValue="150" /></div>
                      <div><Label htmlFor="late-fee">Recargo por Retraso</Label><Input id="late-fee" type="number" defaultValue="10" /></div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Métodos de Pago</h3>
                    <div className="space-y-3">
                      {['Transferencia Bancaria', 'Domiciliación Bancaria', 'Tarjeta de Crédito', 'Nequi / Daviplata'].map(m => (
                        <div key={m} className="flex items-center justify-between p-3 border rounded">
                          <span className="text-sm">{m}</span>
                          <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notificaciones</h3>
                    <div className="space-y-3">
                      {[
                        { l: 'Recordatorios de pago automáticos', active: true },
                        { l: 'Alertas de pagos vencidos', active: true },
                        { l: 'Informes mensuales automáticos', active: false },
                      ].map(({ l, active }) => (
                        <div key={l} className="flex items-center justify-between">
                          <span className="text-sm">{l}</span>
                          <Button variant="outline" size="sm">{active ? 'Activado' : 'Desactivado'}</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>Guardar Configuración</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FinanceDashboard;
