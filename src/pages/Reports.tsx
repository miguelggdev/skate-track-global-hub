import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, FileText, TrendingUp, Users, DollarSign, Trophy, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/currency';

const INCOME_TYPES = ['mensualidad', 'registration_fee', 'poliza_deportiva', 'anualidad'];
const EXPENSE_TYPES = ['equipment', 'travel', 'coaching', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
  escuela: 'Escuela',
  menores: 'Menores',
  transicion: 'Transición',
  juvenil: 'Juvenil',
  mayores: 'Mayores',
};

const TYPE_LABELS: Record<string, string> = {
  mensualidad: 'Mensualidad',
  registration_fee: 'Inscripción',
  poliza_deportiva: 'Póliza deportiva',
  anualidad: 'Anualidad',
  equipment: 'Equipamiento',
  travel: 'Viáticos',
  coaching: 'Coaching',
  other: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

const getPeriodRange = (period: string): { start: string; end: string } => {
  const now = new Date();
  switch (period) {
    case 'week':
      return {
        start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      };
    case 'quarter':
      return {
        start: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    case 'year':
      return {
        start: format(startOfYear(now), 'yyyy-MM-dd'),
        end: format(endOfYear(now), 'yyyy-MM-dd'),
      };
    default: // 'month'
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
  }
};

const reportTypes = [
  { title: 'Reporte Financiero',        description: 'Ingresos, gastos y balance general',       icon: DollarSign, category: 'financial' },
  { title: 'Reporte de Deportistas',    description: 'Estadísticas y rendimiento de atletas',     icon: Users,      category: 'athletes' },
  { title: 'Reporte de Competencias',   description: 'Resultados y participación en eventos',      icon: Trophy,     category: 'competitions' },
  { title: 'Reporte de Entrenamientos', description: 'Asistencia y progreso en entrenamientos',   icon: Calendar,   category: 'training' },
];

const Reports = () => {
  const { toast } = useToast();
  const { currency } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['reports-financial-kpis', selectedPeriod],
    queryFn: async () => {
      const { start, end } = getPeriodRange(selectedPeriod);

      const [incomeRes, pendingRes, expenseRes] = await Promise.all([
        supabase
          .from('financial_transactions')
          .select('amount')
          .eq('payment_status', 'paid')
          .in('transaction_type', INCOME_TYPES)
          .gte('transaction_date', start)
          .lte('transaction_date', end),
        supabase
          .from('financial_transactions')
          .select('amount')
          .eq('payment_status', 'pending')
          .gte('transaction_date', start)
          .lte('transaction_date', end),
        supabase
          .from('financial_transactions')
          .select('amount')
          .eq('payment_status', 'paid')
          .in('transaction_type', EXPENSE_TYPES)
          .gte('transaction_date', start)
          .lte('transaction_date', end),
      ]);

      const income   = (incomeRes.data  ?? []).reduce((s, t) => s + Number(t.amount), 0);
      const pending  = (pendingRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0);
      const expenses = (expenseRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0);

      return { income, pending, expenses, net: income - expenses };
    },
  });

  const { data: recentTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['reports-recent-transactions', selectedPeriod],
    queryFn: async () => {
      const { start, end } = getPeriodRange(selectedPeriod);
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('id, amount, transaction_type, payment_status, transaction_date, description, athletes(first_name, last_name)')
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .order('transaction_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: athleteStats, isLoading: athletesLoading } = useQuery({
    queryKey: ['reports-athlete-stats'],
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      const [activeRes, newRes, categoryRes] = await Promise.all([
        supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('athletes').select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('created_at', monthStart),
        supabase.from('athletes').select('category').eq('status', 'active'),
      ]);

      const counts: Record<string, number> = {};
      for (const a of categoryRes.data ?? []) {
        counts[a.category] = (counts[a.category] ?? 0) + 1;
      }

      return {
        total: activeRes.count ?? 0,
        newThisMonth: newRes.count ?? 0,
        categoryCounts: counts,
      };
    },
  });

  const handleDownloadReport = (reportType: string) => {
    toast({
      title: 'Descargando reporte',
      description: `El reporte de ${reportType} se está generando...`,
    });
  };

  const financialStats = [
    { title: 'Ingresos Totales',   value: kpisLoading ? '...' : formatCurrency(kpis?.income   ?? 0, currency), icon: DollarSign, positive: true },
    { title: 'Pagos Pendientes',   value: kpisLoading ? '...' : formatCurrency(kpis?.pending   ?? 0, currency), icon: Clock,      positive: false },
    { title: 'Gastos del Período', value: kpisLoading ? '...' : formatCurrency(kpis?.expenses  ?? 0, currency), icon: FileText,   positive: false },
    { title: 'Balance Neto',       value: kpisLoading ? '...' : formatCurrency(kpis?.net       ?? 0, currency), icon: TrendingUp, positive: (kpis?.net ?? 0) >= 0 },
  ];

  return (
    <DashboardLayout title="Reportes" userRole="Administrador">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Reportes y Análisis</h2>
            <p className="text-muted-foreground">Genera y descarga reportes del sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
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
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="financial">Financiero</TabsTrigger>
            <TabsTrigger value="athletes">Deportistas</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {financialStats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stat.positive ? 'text-green-600' : ''}`}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reportes Rápidos</CardTitle>
                <CardDescription>Genera reportes predefinidos del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reportTypes.map((report, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <report.icon className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownloadReport(report.title)}
                        className="w-full"
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen del Período</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {kpisLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex justify-between animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                          <div className="h-4 bg-gray-200 rounded w-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ingresos</span>
                        <span className="font-semibold text-green-600">{formatCurrency(kpis?.income ?? 0, currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gastos</span>
                        <span className="font-semibold text-red-500">{formatCurrency(kpis?.expenses ?? 0, currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pendiente de cobro</span>
                        <span className="font-semibold text-yellow-600">{formatCurrency(kpis?.pending ?? 0, currency)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-3">
                        <span className="font-medium">Balance Neto</span>
                        <span className={`font-bold ${(kpis?.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {formatCurrency(kpis?.net ?? 0, currency)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Gráfico de distribución de gastos
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {txLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between py-2 border-b animate-pulse">
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-48" />
                          <div className="h-3 bg-gray-200 rounded w-24" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16" />
                      </div>
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No hay transacciones en este período.</p>
                ) : (
                  <div className="space-y-4">
                    {recentTransactions.map((tx) => {
                      const ath = tx.athletes as unknown as { first_name: string; last_name: string } | null;
                      const athleteName = ath ? `${ath.first_name} ${ath.last_name}` : '';
                      const label = TYPE_LABELS[tx.transaction_type] ?? tx.transaction_type;
                      const isExpense = EXPENSE_TYPES.includes(tx.transaction_type);
                      return (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">{label}{athleteName ? ` — ${athleteName}` : ''}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.transaction_date), "d 'de' MMMM", { locale: es })}
                              {' · '}
                              {STATUS_LABELS[tx.payment_status] ?? tx.payment_status}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${isExpense ? 'text-red-500' : 'text-green-600'}`}>
                              {isExpense ? '-' : '+'}{formatCurrency(Number(tx.amount), currency)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="athletes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Deportistas</CardTitle>
                </CardHeader>
                <CardContent>
                  {athletesLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                          <div className="h-4 bg-gray-200 rounded w-12" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Activos</span>
                        <span className="font-semibold">{athleteStats?.total ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nuevos este mes</span>
                        <span className="font-semibold text-green-600">+{athleteStats?.newThisMonth ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Por categoría:</span>
                      </div>
                      <div className="ml-4 space-y-2">
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                          const count = athleteStats?.categoryCounts?.[key] ?? 0;
                          if (count === 0) return null;
                          return (
                            <div key={key} className="flex justify-between text-sm">
                              <span>{label}</span>
                              <span>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Nivel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Gráfico de rendimiento por nivel
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asistencia a Entrenamientos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Gráfico de asistencia mensual
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resultados de Competencias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Gráfico de resultados por competencia
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
