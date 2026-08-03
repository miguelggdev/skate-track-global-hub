import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Users, Trophy, CreditCard, Calendar } from 'lucide-react';
import { useDelegateStats } from '@/hooks/useDelegateStats';
import { useDelegateAthletes } from '@/hooks/useDelegateAthletes';
import { useDelegatePayments, DELEGATE_TRANSACTION_TYPES } from '@/hooks/useDelegatePayments';
import { useCompetitions } from '@/hooks/useCompetitions';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORY_LABELS: Record<string, string> = {
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

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  active: 'Activo',
  inactive: 'Inactivo',
  upcoming: 'Próxima',
  ongoing: 'En curso',
  completed: 'Finalizada',
};

const TRANS_TYPE_MAP = Object.fromEntries(
  DELEGATE_TRANSACTION_TYPES.map(t => [t.value, t.label])
);

const fmtDate = (d: string | null | undefined) =>
  d ? format(parseISO(d), 'dd/MM/yyyy', { locale: es }) : '';

// ─── Simple jsPDF table renderer ───────────────────────────────────────────

function drawTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number,
) {
  const margin = 12;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const colW = (pageW - margin * 2) / headers.length;
  const rowH = 7;

  doc.setFillColor(30, 64, 175);
  doc.rect(margin, startY - 4, pageW - margin * 2, rowH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, margin + i * colW + 1, startY));

  let y = startY + rowH;
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');

  rows.forEach((row, ri) => {
    if (y > pageH - margin) {
      doc.addPage();
      y = 20;
    }
    if (ri % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y - 4, pageW - margin * 2, rowH, 'F');
    }
    row.forEach((cell, ci) => {
      doc.text(String(cell ?? '').slice(0, 32), margin + ci * colW + 1, y);
    });
    y += rowH;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

const DelegateReports = () => {
  const { currency } = useCurrency();
  const { data: stats } = useDelegateStats();
  const { data: athletes } = useDelegateAthletes();
  const { data: payments } = useDelegatePayments();
  const { data: competitions } = useCompetitions();

  const [reportType, setReportType] = useState('athletes');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const inRange = (d: string | null | undefined) => {
    if (!d) return true;
    const s = d.slice(0, 10);
    if (dateFrom && s < dateFrom) return false;
    if (dateTo && s > dateTo) return false;
    return true;
  };

  const handleGenerateReport = (outputFormat: 'pdf' | 'excel') => {
    if (reportType === 'attendance') {
      toast.error('Reporte de asistencia próximamente disponible');
      return;
    }

    const now = format(new Date(), 'yyyy-MM-dd');

    if (outputFormat === 'excel') {
      let sheetData: Record<string, string>[] = [];
      let sheetName = 'Reporte';
      let filename = 'reporte.xlsx';

      if (reportType === 'athletes') {
        sheetData = (athletes ?? []).map(a => ({
          'Nombre': `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim(),
          'Número': a.athlete_number ?? '',
          'Categoría': CATEGORY_LABELS[a.category] || a.category,
          'Nivel': a.level ?? '',
          'Género': a.gender === 'masculino' ? 'Masculino' : a.gender === 'femenino' ? 'Femenino' : '',
          'F. Nacimiento': fmtDate(a.date_of_birth),
          'Email': a.email ?? '',
          'Estado': STATUS_LABELS[a.status] || a.status,
          'Contacto emergencia': a.emergency_contact_name ?? '',
          'Tel. emergencia': a.emergency_contact_phone ?? '',
          'F. Ingreso': fmtDate(a.join_date),
        }));
        sheetName = 'Atletas';
        filename = `atletas-${now}.xlsx`;
      } else if (reportType === 'competitions') {
        sheetData = (competitions ?? []).map(c => ({
          'Nombre': c.name,
          'Inicio': fmtDate(c.start_date),
          'Fin': fmtDate(c.end_date),
          'Sede': c.location,
          'Categoría': CATEGORY_LABELS[c.category ?? ''] || (c.category ?? ''),
          'Estado': STATUS_LABELS[c.status] || c.status,
          'Inscripción hasta': fmtDate(c.registration_deadline),
          'Cuota': c.entry_fee != null ? String(c.entry_fee) : '',
        }));
        sheetName = 'Competencias';
        filename = `competencias-${now}.xlsx`;
      } else if (reportType === 'payments') {
        sheetData = (payments ?? [])
          .filter(p => inRange(p.transaction_date))
          .map(p => ({
            'Atleta': p.athletes
              ? `${p.athletes.first_name ?? ''} ${p.athletes.last_name ?? ''}`.trim()
              : '',
            'Categoría': p.athletes
              ? CATEGORY_LABELS[p.athletes.category] || p.athletes.category
              : '',
            'Tipo': TRANS_TYPE_MAP[p.transaction_type] || p.transaction_type,
            'Monto': String(p.amount),
            'Estado': STATUS_LABELS[p.payment_status] || p.payment_status,
            'Fecha': fmtDate(p.transaction_date),
            'Descripción': p.description ?? '',
            'Vencimiento': fmtDate(p.due_date),
          }));
        sheetName = 'Pagos';
        filename = `pagos-${now}.xlsx`;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, filename);
      toast.success(`Excel generado: ${filename}`);
      return;
    }

    // ── PDF ──
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const margin = 12;

    const titles: Record<string, string> = {
      athletes: 'Reporte de Atletas',
      competitions: 'Reporte de Competencias',
      payments: 'Reporte de Pagos de Competencias',
    };

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(titles[reportType] || 'Reporte', margin, 15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
      margin, 22,
    );
    if (dateFrom || dateTo) {
      doc.text(
        `Período: ${dateFrom ? fmtDate(dateFrom) : '—'} → ${dateTo ? fmtDate(dateTo) : '—'}`,
        margin, 28,
      );
    }
    doc.setTextColor(0, 0, 0);

    let filename = 'reporte.pdf';

    if (reportType === 'athletes') {
      const headers = ['Nombre', '#', 'Categoría', 'Nivel', 'Género', 'F. Nac.', 'Estado'];
      const rows = (athletes ?? []).map(a => [
        `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim(),
        a.athlete_number ?? '',
        CATEGORY_LABELS[a.category] || a.category,
        a.level ?? '',
        a.gender === 'masculino' ? 'M' : a.gender === 'femenino' ? 'F' : '',
        fmtDate(a.date_of_birth),
        STATUS_LABELS[a.status] || a.status,
      ]);
      drawTable(doc, headers, rows, 34);
      filename = `atletas-${now}.pdf`;
    } else if (reportType === 'competitions') {
      const headers = ['Nombre', 'Inicio', 'Fin', 'Sede', 'Categoría', 'Estado', 'Cuota'];
      const rows = (competitions ?? []).map(c => [
        c.name,
        fmtDate(c.start_date),
        fmtDate(c.end_date),
        c.location,
        CATEGORY_LABELS[c.category ?? ''] || (c.category ?? ''),
        STATUS_LABELS[c.status] || c.status,
        c.entry_fee != null ? `$${c.entry_fee}` : '',
      ]);
      drawTable(doc, headers, rows, 34);
      filename = `competencias-${now}.pdf`;
    } else if (reportType === 'payments') {
      const filtered = (payments ?? []).filter(p => inRange(p.transaction_date));
      const headers = ['Atleta', 'Tipo', 'Monto', 'Estado', 'Fecha', 'Vencimiento'];
      const rows = filtered.map(p => [
        p.athletes
          ? `${p.athletes.first_name ?? ''} ${p.athletes.last_name ?? ''}`.trim()
          : '',
        TRANS_TYPE_MAP[p.transaction_type] || p.transaction_type,
        formatCurrency(p.amount, currency),
        STATUS_LABELS[p.payment_status] || p.payment_status,
        fmtDate(p.transaction_date),
        fmtDate(p.due_date),
      ]);
      drawTable(doc, headers, rows, 34);
      filename = `pagos-${now}.pdf`;
    }

    doc.save(filename);
    toast.success(`PDF generado: ${filename}`);
  };

  const ReportCard = ({
    icon: Icon,
    title,
    description,
    value,
    onClick,
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
            value={`${athletes?.length ?? 0} atletas`}
            onClick={() => setReportType('athletes')}
          />
          <ReportCard
            icon={Trophy}
            title="Competencias"
            description="Historial de competencias y resultados"
            value={`${competitions?.length ?? 0} competencias`}
            onClick={() => setReportType('competitions')}
          />
          <ReportCard
            icon={CreditCard}
            title="Pagos de Competencias"
            description="Resumen de pagos externos recibidos"
            value={formatCurrency(stats?.completedPaymentsAmount ?? 0, currency)}
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
                      <p className="text-sm text-muted-foreground">{CATEGORY_LABELS[category] || category}</p>
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
                        currency,
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

            {reportType === 'attendance' && (
              <div className="border rounded-lg p-4 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Reporte de asistencia próximamente disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DelegateReports;
