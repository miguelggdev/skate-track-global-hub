import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, FileText, TrendingUp, Users, DollarSign, Trophy, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/currency';

const INCOME_TYPES = ['mensualidad', 'anualidad', 'registration_fee', 'league_registration_renewal', 'federation_registration_renewal', 'inscripcion_competencia'];
const EXPENSE_TYPES = ['poliza_deportiva', 'psicologia', 'prendas_deportivas', 'equipment', 'travel', 'accident_insurance', 'otro', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
  escuela: 'Escuela',
  menores: 'Menores',
  transicion: 'Transición',
  juvenil: 'Juvenil',
  mayores: 'Mayores',
};

const TYPE_LABELS: Record<string, string> = {
  mensualidad: 'Mensualidad',
  anualidad: 'Anualidad',
  registration_fee: 'Inscripción',
  poliza_deportiva: 'Póliza deportiva',
  psicologia: 'Psicología',
  prendas_deportivas: 'Prendas deportivas',
  inscripcion_competencia: 'Inscripción competencia',
  equipment: 'Equipamiento',
  travel: 'Viáticos',
  accident_insurance: 'Seguro de accidentes',
  league_registration_renewal: 'Renovación Liga',
  federation_registration_renewal: 'Renovación Federación',
  competition_district: 'Competencia Distrital',
  competition_departmental: 'Competencia Departamental',
  competition_marathon: 'Competencia Maratón',
  competition_panamerican: 'Competencia Panamericana',
  competition_interleague: 'Competencia Interligas',
  otro: 'Otros',
  other: 'Otros',
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

  const handleDownloadReport = async (reportCategory: string) => {
    const { start, end } = getPeriodRange(selectedPeriod);
    const now = format(new Date(), 'yyyy-MM-dd');
    const periodLabel = { week: 'semana', month: 'mes', quarter: 'trimestre', year: 'año' }[selectedPeriod] ?? selectedPeriod;

    try {
      if (reportCategory === 'financial') {
        const { data, error } = await supabase
          .from('financial_transactions')
          .select('id, amount, transaction_type, payment_status, transaction_date, description, athletes(first_name, last_name)')
          .gte('transaction_date', start)
          .lte('transaction_date', end)
          .order('transaction_date', { ascending: false });
        if (error) throw error;

        const rows = (data ?? []).map(tx => {
          const ath = tx.athletes as unknown as { first_name: string; last_name: string } | null;
          return {
            'Fecha': tx.transaction_date,
            'Tipo': TYPE_LABELS[tx.transaction_type] ?? tx.transaction_type,
            'Atleta': ath ? `${ath.first_name} ${ath.last_name}` : '—',
            'Descripción': tx.description ?? '',
            'Estado': STATUS_LABELS[tx.payment_status] ?? tx.payment_status,
            'Monto': Number(tx.amount),
          };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Financiero');
        XLSX.writeFile(wb, `reporte-financiero-${now}.xlsx`);
        toast.success(`Reporte financiero del ${periodLabel} generado`);

      } else if (reportCategory === 'athletes') {
        const { data, error } = await supabase
          .from('athletes')
          .select('first_name, last_name, category, level, gender, date_of_birth, status, email, athlete_number, join_date')
          .order('last_name');
        if (error) throw error;

        const rows = (data ?? []).map(a => ({
          'Nombre': a.first_name,
          'Apellido': a.last_name,
          'Número': a.athlete_number ?? '',
          'Categoría': CATEGORY_LABELS[a.category] ?? a.category,
          'Nivel': a.level ?? '',
          'Género': a.gender ?? '',
          'F. Nacimiento': a.date_of_birth ?? '',
          'Estado': STATUS_LABELS[a.status] ?? a.status,
          'Email': a.email ?? '',
          'F. Ingreso': a.join_date ?? '',
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Deportistas');
        XLSX.writeFile(wb, `reporte-deportistas-${now}.xlsx`);
        toast.success('Reporte de deportistas generado');

      } else if (reportCategory === 'competitions') {
        const { data, error } = await supabase
          .from('competitions')
          .select('name, start_date, end_date, location, category, status, registration_deadline, entry_fee, description')
          .order('start_date', { ascending: false });
        if (error) throw error;

        const rows = (data ?? []).map(c => ({
          'Nombre': c.name,
          'Inicio': c.start_date,
          'Fin': c.end_date ?? '',
          'Sede': c.location,
          'Categoría': CATEGORY_LABELS[c.category ?? ''] ?? c.category ?? '',
          'Estado': STATUS_LABELS[c.status] ?? c.status,
          'Inscripción hasta': c.registration_deadline ?? '',
          'Cuota': c.entry_fee != null ? Number(c.entry_fee) : '',
          'Descripción': c.description ?? '',
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Competencias');
        XLSX.writeFile(wb, `reporte-competencias-${now}.xlsx`);
        toast.success('Reporte de competencias generado');

      } else if (reportCategory === 'training') {
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const margin = 12;
        const pageW = doc.internal.pageSize.getWidth();

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Reporte de Entrenamientos', margin, 15);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Período: ${start} → ${end}  ·  Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, margin, 22);
        doc.setTextColor(0, 0, 0);

        const { data: sessions } = await supabase
          .from('training_sessions')
          .select('id, name, date, start_time, end_time, training_type, location')
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false });

        const headers = ['Nombre', 'Fecha', 'Hora inicio', 'Hora fin', 'Tipo', 'Sede'];
        const rows = (sessions ?? []).map(s => [
          s.name,
          s.date,
          s.start_time ?? '',
          s.end_time ?? '',
          s.training_type ?? '',
          s.location ?? '',
        ]);

        const colW = (pageW - margin * 2) / headers.length;
        const rowH = 7;
        let y = 34;

        doc.setFillColor(30, 64, 175);
        doc.rect(margin, y - 4, pageW - margin * 2, rowH, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        headers.forEach((h, i) => doc.text(h, margin + i * colW + 1, y));
        y += rowH;

        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        rows.forEach((row, ri) => {
          if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = 20; }
          if (ri % 2 === 1) {
            doc.setFillColor(245, 247, 250);
            doc.rect(margin, y - 4, pageW - margin * 2, rowH, 'F');
          }
          row.forEach((cell, ci) => doc.text(String(cell).slice(0, 32), margin + ci * colW + 1, y));
          y += rowH;
        });

        doc.save(`reporte-entrenamientos-${now}.pdf`);
        toast.success(`Reporte de entrenamientos del ${periodLabel} generado`);
      }
    } catch {
      toast.error('Error generando el reporte');
    }
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
                        onClick={() => handleDownloadReport(report.category)}
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
                <CardContent className="space-y-3">
                  {txLoading ? (
                    <div className="space-y-2 animate-pulse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 bg-muted rounded w-32" />
                          <div className="h-4 bg-muted rounded w-20" />
                        </div>
                      ))}
                    </div>
                  ) : recentTransactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">Sin transacciones en este período.</p>
                  ) : (
                    (() => {
                      const grouped: Record<string, number> = {};
                      recentTransactions.forEach(tx => {
                        const label = TYPE_LABELS[tx.transaction_type] ?? tx.transaction_type;
                        grouped[label] = (grouped[label] ?? 0) + Number(tx.amount);
                      });
                      const total = Object.values(grouped).reduce((a, b) => a + b, 0);
                      return (
                        <div className="space-y-3">
                          {Object.entries(grouped).map(([label, amount]) => (
                            <div key={label}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{label}</span>
                                <span className="font-medium">{formatCurrency(amount, currency)}</span>
                              </div>
                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${total > 0 ? (amount / total) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
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
                  <CardTitle>Atletas por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {athletesLoading ? (
                    <div className="space-y-2 animate-pulse">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 bg-muted rounded w-28" />
                          <div className="h-4 bg-muted rounded w-8" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    (() => {
                      const counts = athleteStats?.categoryCounts ?? {};
                      const total = Object.values(counts).reduce((a, b) => a + b, 0);
                      if (total === 0) return <p className="text-sm text-muted-foreground py-4">Sin atletas activos.</p>;
                      return (
                        <div className="space-y-3">
                          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                            const count = counts[key] ?? 0;
                            if (count === 0) return null;
                            return (
                              <div key={key}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{label}</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${(count / total) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40">
                    <span className="text-sm text-muted-foreground">Atletas activos</span>
                    <span className="font-bold">{athleteStats?.total ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40">
                    <span className="text-sm text-muted-foreground">Incorporaciones este mes</span>
                    <span className="font-bold text-green-600">+{athleteStats?.newThisMonth ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40">
                    <span className="text-sm text-muted-foreground">Ingresos del período</span>
                    <span className="font-bold text-green-600">{formatCurrency(kpis?.income ?? 0, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/40">
                    <span className="text-sm text-muted-foreground">Balance neto</span>
                    <span className={`font-bold ${(kpis?.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(kpis?.net ?? 0, currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Descargar Reportes Completos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reportTypes.map((r) => (
                    <div key={r.category} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <r.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{r.title}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadReport(r.category)}>
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Descargar
                      </Button>
                    </div>
                  ))}
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
