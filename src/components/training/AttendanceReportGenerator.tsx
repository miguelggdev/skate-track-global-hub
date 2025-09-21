import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, FileDown, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateAttendanceReportPDF, type AttendanceReport } from '@/utils/pdfGenerator';

interface AttendanceReportData {
  athlete_id: string;
  athlete_name: string;
  category: string;
  level: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_rate: number;
  last_attendance?: string;
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'annual';
type CategoryFilter = 'all' | 'escuela' | 'menores' | 'transicion' | 'prejuvenil' | 'juvenil' | 'mayores';

const AttendanceReportGenerator: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate date range based on period and selected date
  const dateRange = useMemo(() => {
    const date = selectedDate;
    switch (reportPeriod) {
      case 'daily':
        return {
          start: format(date, 'yyyy-MM-dd'),
          end: format(date, 'yyyy-MM-dd')
        };
      case 'weekly':
        return {
          start: format(startOfWeek(date, { locale: es }), 'yyyy-MM-dd'),
          end: format(endOfWeek(date, { locale: es }), 'yyyy-MM-dd')
        };
      case 'monthly':
        return {
          start: format(startOfMonth(date), 'yyyy-MM-dd'),
          end: format(endOfMonth(date), 'yyyy-MM-dd')
        };
      case 'annual':
        return {
          start: format(startOfYear(date), 'yyyy-MM-dd'),
          end: format(endOfYear(date), 'yyyy-MM-dd')
        };
      default:
        return {
          start: format(startOfMonth(date), 'yyyy-MM-dd'),
          end: format(endOfMonth(date), 'yyyy-MM-dd')
        };
    }
  }, [reportPeriod, selectedDate]);

  // Fetch attendance report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['attendance-report', selectedCategory, reportPeriod, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('training_attendance')
        .select(`
          athlete_id,
          attended,
          created_at,
          training_sessions!inner(
            date,
            name
          ),
          athletes!inner(
            first_name,
            last_name,
            category,
            level
          )
        `)
        .gte('training_sessions.date', dateRange.start)
        .lte('training_sessions.date', dateRange.end);

      if (selectedCategory !== 'all') {
        query = query.eq('athletes.category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching attendance report:', error);
        throw error;
      }

      // Process data to calculate attendance statistics
      const athleteStats = new Map<string, {
        athlete_id: string;
        athlete_name: string;
        category: string;
        level: string;
        total_sessions: number;
        attended_sessions: number;
        last_attendance?: string;
      }>();

      data?.forEach((record: any) => {
        const athleteId = record.athlete_id;
        const athleteName = `${record.athletes.first_name} ${record.athletes.last_name}`;
        const category = record.athletes.category;
        const level = record.athletes.level;

        if (!athleteStats.has(athleteId)) {
          athleteStats.set(athleteId, {
            athlete_id: athleteId,
            athlete_name: athleteName,
            category,
            level,
            total_sessions: 0,
            attended_sessions: 0,
            last_attendance: undefined
          });
        }

        const stats = athleteStats.get(athleteId)!;
        stats.total_sessions++;
        if (record.attended) {
          stats.attended_sessions++;
          if (!stats.last_attendance || record.created_at > stats.last_attendance) {
            stats.last_attendance = record.created_at;
          }
        }
      });

      return Array.from(athleteStats.values()).map(stats => ({
        ...stats,
        attendance_rate: stats.total_sessions > 0 ? (stats.attended_sessions / stats.total_sessions) * 100 : 0
      })).sort((a, b) => b.attendance_rate - a.attendance_rate);
    },
  });

  const handleExportReport = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const csvContent = [
      ['Atleta', 'Categoría', 'Nivel', 'Sesiones Totales', 'Sesiones Asistidas', 'Porcentaje de Asistencia', 'Última Asistencia'].join(','),
      ...reportData.map(row => [
        row.athlete_name,
        row.category,
        row.level,
        row.total_sessions,
        row.attended_sessions,
        `${row.attendance_rate.toFixed(1)}%`,
        row.last_attendance ? format(parseISO(row.last_attendance), 'dd/MM/yyyy', { locale: es }) : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte-asistencia-${reportPeriod}-${format(selectedDate, 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast.success('Reporte exportado exitosamente');
  };

  const handleExportPDF = async () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      const summaryStats = {
        totalAthletes: reportData.length,
        totalSessions: reportData.reduce((sum, athlete) => sum + athlete.total_sessions, 0),
        averageAttendance: reportData.reduce((sum, athlete) => sum + athlete.attendance_rate, 0) / reportData.length || 0,
        highAttendanceCount: reportData.filter(athlete => athlete.attendance_rate >= 80).length
      };

      const attendanceReport: AttendanceReport = {
        data: reportData,
        summary: summaryStats,
        period: reportPeriod,
        dateRange: {
          startDate: parseISO(dateRange.start),
          endDate: parseISO(dateRange.end)
        },
        category: selectedCategory
      };

      await generateAttendanceReportPDF(attendanceReport);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF. Inténtalo de nuevo.');
    }
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 75) return 'bg-yellow-500';
    if (rate >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPeriodLabel = () => {
    switch (reportPeriod) {
      case 'daily':
        return format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es });
      case 'weekly':
        return `Semana del ${format(startOfWeek(selectedDate, { locale: es }), 'dd/MM', { locale: es })} al ${format(endOfWeek(selectedDate, { locale: es }), 'dd/MM/yyyy', { locale: es })}`;
      case 'monthly':
        return format(selectedDate, "MMMM 'de' yyyy", { locale: es });
      case 'annual':
        return format(selectedDate, 'yyyy');
      default:
        return '';
    }
  };

  const totalAthletes = reportData?.length || 0;
  const averageAttendance = reportData?.length ? 
    reportData.reduce((sum, athlete) => sum + athlete.attendance_rate, 0) / reportData.length : 0;
  const totalSessions = reportData?.reduce((sum, athlete) => sum + athlete.total_sessions, 0) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Generador de Reportes de Asistencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Categoría</label>
              <Select value={selectedCategory} onValueChange={(value: CategoryFilter) => setSelectedCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="escuela">Escuela</SelectItem>
                  <SelectItem value="menores">Menores</SelectItem>
                  <SelectItem value="transicion">Transición</SelectItem>
                  <SelectItem value="prejuvenil">Pre-juvenil</SelectItem>
                  <SelectItem value="juvenil">Juvenil</SelectItem>
                  <SelectItem value="mayores">Mayores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={reportPeriod} onValueChange={(value: ReportPeriod) => setReportPeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fecha de referencia</label>
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => refetch()} disabled={isLoading}>
              <Calendar className="h-4 w-4 mr-2" />
              {isLoading ? 'Generando...' : 'Generar Reporte'}
            </Button>
            <Button variant="outline" onClick={handleExportReport} disabled={!reportData || reportData.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={handleExportPDF} disabled={!reportData || reportData.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{totalAthletes}</div>
                <p className="text-sm text-muted-foreground">Atletas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{totalSessions}</div>
                <p className="text-sm text-muted-foreground">Sesiones Totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{averageAttendance.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Asistencia Promedio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{reportData.filter(a => a.attendance_rate >= 80).length}</div>
                <p className="text-sm text-muted-foreground">Con +80% Asistencia</p>
              </CardContent>
            </Card>
          </div>

          {/* Report Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reporte de Asistencia - {getPeriodLabel()}</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalAthletes} atletas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Atleta</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead className="text-center">Sesiones Totales</TableHead>
                      <TableHead className="text-center">Asistidas</TableHead>
                      <TableHead className="text-center">% Asistencia</TableHead>
                      <TableHead>Última Asistencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((athlete) => (
                      <TableRow key={athlete.athlete_id}>
                        <TableCell className="font-medium">{athlete.athlete_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {athlete.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{athlete.level.replace('_', ' ')}</TableCell>
                        <TableCell className="text-center">{athlete.total_sessions}</TableCell>
                        <TableCell className="text-center">{athlete.attended_sessions}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${getAttendanceRateColor(athlete.attendance_rate)}`}
                            />
                            {athlete.attendance_rate.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell>
                          {athlete.last_attendance ? 
                            format(parseISO(athlete.last_attendance), 'dd/MM/yyyy', { locale: es }) : 
                            'Sin asistencias'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceReportGenerator;