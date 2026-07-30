import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Users, Trophy, CreditCard, Calendar, Printer } from 'lucide-react';
import { useDelegateStats } from '@/hooks/useDelegateStats';
import { useDelegateAthletes } from '@/hooks/useDelegateAthletes';
import { useDelegatePayments } from '@/hooks/useDelegatePayments';
import { useCompetitions } from '@/hooks/useCompetitions';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const categoryLabels: Record<string, string> = {
  escuela: 'Escuela',
  menores: 'Menores',
  transicion: 'Transición',
  prejuvenil: 'Pre-Juvenil',
  juvenil: 'Juvenil',
  mayores: 'Mayores',
  youth: 'Youth',
  junior: 'Junior',
  senior: 'Senior',
  masters: 'Masters',
};

const DelegateReports = () => {
  const { currency } = useCurrency();
  const { data: stats } = useDelegateStats();
  const { data: athletes } = useDelegateAthletes();
  const { data: payments } = useDelegatePayments();
  const { data: competitions } = useCompetitions();

  const [reportType, setReportType] = useState('athletes');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleGenerateReport = (format: 'pdf' | 'excel') => {
    // TODO: Implement actual PDF/Excel generation
    alert(`Generando reporte ${format.toUpperCase()} de ${reportType}...`);
  };

  const ReportCard = ({ 
    icon: Icon, 
    title, 
    description, 
    value, 
    onClick 
  }: { 
    icon: React.ElementType; 
    title: string; 
    description: string; 
    value: string | number; 
    onClick: () => void;
  }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Icon className="h-8 w-8 text-primary" />
          <Badge variant="outline">{value}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <Button className="mt-4 w-full" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Generar Reporte
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Reportes" userRole="delegate">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Reportes
            </h2>
            <p className="text-muted-foreground">
              Genera reportes de atletas, competencias y pagos
            </p>
          </div>
        </div>

        {/* Quick Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportCard
            icon={Users}
            title="Atletas por Categoría"
            description="Lista de atletas agrupados por categoría"
            value={`${athletes?.length || 0} atletas`}
            onClick={() => setReportType('athletes')}
          />
          <ReportCard
            icon={Trophy}
            title="Competencias"
            description="Historial de competencias y resultados"
            value={`${competitions?.length || 0} competencias`}
            onClick={() => setReportType('competitions')}
          />
          <ReportCard
            icon={CreditCard}
            title="Pagos de Competencias"
            description="Resumen de pagos externos recibidos"
            value={formatCurrency(stats?.completedPaymentsAmount || 0, currency)}
            onClick={() => setReportType('payments')}
          />
          <ReportCard
            icon={Calendar}
            title="Asistencia"
            description="Resumen de asistencia a entrenamientos"
            value="Ver detalle"
            onClick={() => setReportType('attendance')}
          />
        </div>

        {/* Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generador de Reportes</CardTitle>
            <CardDescription>
              Selecciona el tipo de reporte y rango de fechas para generar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Reporte</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="athletes">Atletas por Categoría</SelectItem>
                    <SelectItem value="competitions">Competencias</SelectItem>
                    <SelectItem value="payments">Pagos de Competencias</SelectItem>
                    <SelectItem value="attendance">Asistencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => handleGenerateReport('pdf')} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={() => handleGenerateReport('excel')} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>

            {/* Preview Section */}
            {reportType === 'athletes' && stats?.athletesByCategory && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-4">Vista Previa: Atletas por Categoría</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.athletesByCategory).map(([category, count]) => (
                    <div key={category} className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{categoryLabels[category] || category}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportType === 'payments' && payments && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-4">Vista Previa: Pagos de Competencias</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{payments.filter(p => p.payment_status === 'paid').length}</p>
                    <p className="text-sm text-muted-foreground">Pagos Completados</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{payments.filter(p => p.payment_status === 'pending').length}</p>
                    <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        payments.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
                        currency
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Recaudado</p>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'competitions' && competitions && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-4">Vista Previa: Competencias</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{competitions.length}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{competitions.filter(c => c.status === 'upcoming').length}</p>
                    <p className="text-sm text-muted-foreground">Próximas</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{competitions.filter(c => c.status === 'completed').length}</p>
                    <p className="text-sm text-muted-foreground">Finalizadas</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{competitions.filter(c => c.status === 'ongoing').length}</p>
                    <p className="text-sm text-muted-foreground">En Curso</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DelegateReports;
