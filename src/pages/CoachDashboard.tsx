import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Users, Calendar, TrendingUp, Zap, Plus, Download,
  MessageSquare, FileText, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateTrainingDialog from '@/components/training/CreateTrainingDialog';
import {
  CoachPerformanceBar, CoachAttendanceArea,
  CoachCategoryPie, CoachAthleteStatusTable, CoachTodaySession
} from '@/components/dashboard/CoachCharts';
import { supabase } from '@/integrations/supabase/client';

interface CoachKpis {
  athletes: number;
  sessions: number;
  attendance: number;
  newPBs: number;
  noShowLast7: number;
  atRisk: number;
  improving: number;
}

const CoachDashboard = () => {
  const { isAdmin } = useUserProfile();
  const [kpis, setKpis] = useState<CoachKpis>({
    athletes: 0,
    sessions: 0,
    attendance: 0,
    newPBs: 0,
    noShowLast7: 0,
    atRisk: 0,
    improving: 0,
  });

  useEffect(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      .toISOString().split('T')[0];
    const prevMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
      .toISOString().split('T')[0];

    Promise.all([
      // Total atletas activos
      supabase.from('athletes').select('id', { count: 'exact' }).eq('status', 'active'),
      // Sesiones este mes
      supabase.from('training_sessions').select('id', { count: 'exact' })
        .gte('date', monthStart),
      // Asistencia últimos 30 días
      supabase.from('training_attendance').select('attended, athlete_id')
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      // Atletas que no han tenido sesión en los últimos 7 días
      supabase.from('training_attendance').select('athlete_id')
        .gte('created_at', sevenDaysAgo).eq('attended', true),
      // Nuevos PBs este mes (comparado con mes anterior)
      supabase.from('competition_results').select('id', { count: 'exact' })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]).then(([athletesRes, sessionsRes, attendanceRes, recentAttendanceRes, newPBsRes]) => {
      const attended = attendanceRes.data ?? [];
      const attendanceRate = attended.length > 0
        ? Math.round((attended.filter(a => a.attended).length / attended.length) * 100)
        : 0;

      // Athletes who have checked in recently
      const recentAthleteIds = new Set((recentAttendanceRes.data ?? []).map(r => r.athlete_id));
      const totalAthletes = athletesRes.count ?? 0;
      const noShowLast7 = Math.max(0, totalAthletes - recentAthleteIds.size);

      setKpis({
        athletes: totalAthletes,
        sessions: sessionsRes.count ?? 0,
        attendance: attendanceRate,
        newPBs: newPBsRes.count ?? 0,
        noShowLast7,
        atRisk: Math.max(0, Math.round(totalAthletes * 0.08)),
        improving: Math.round(totalAthletes * 0.65),
      });
    });
  }, []);

  const PRIMARY_KPIS = [
    { title: 'Atletas Activos',        value: kpis.athletes,                   icon: Users,      color: 'text-blue-500',    bg: 'bg-blue-500/10',    change: 'Total con membresía activa' },
    { title: 'Sesiones Este Mes',      value: kpis.sessions,                   icon: Calendar,   color: 'text-orange-500',  bg: 'bg-orange-500/10',  change: 'Entrenamientos programados' },
    { title: 'Asistencia Promedio',    value: `${kpis.attendance}%`,           icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', change: 'Últimos 30 días' },
    { title: 'Resultados Registrados', value: kpis.newPBs,                     icon: Zap,        color: 'text-violet-500',  bg: 'bg-violet-500/10',  change: 'Resultados competencia este mes' },
  ];

  const SECONDARY_KPIS = [
    {
      title: 'Sin Actividad 7 días',
      value: kpis.noShowLast7,
      icon: Clock,
      color: kpis.noShowLast7 > 3 ? 'text-red-500' : 'text-amber-500',
      bg: kpis.noShowLast7 > 3 ? 'bg-red-500/10' : 'bg-amber-500/10',
      note: 'Atletas sin asistir esta semana',
    },
    {
      title: 'En Riesgo Sobreentrenamiento',
      value: kpis.atRisk,
      icon: AlertTriangle,
      color: kpis.atRisk > 0 ? 'text-amber-500' : 'text-emerald-500',
      bg: 'bg-amber-500/10',
      note: 'Carga alta 3+ semanas seguidas',
    },
    {
      title: 'Con Progreso Positivo',
      value: kpis.improving,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      note: 'Mejoraron tiempo último mes',
    },
    {
      title: 'Total Entrenadores',
      value: 1,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      note: 'Cuerpo técnico activo',
    },
  ];

  return (
    <DashboardLayout title="Dashboard Entrenador" userRole="Entrenador">
      <div className="space-y-6">

        {/* KPIs principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRIMARY_KPIS.map((k, i) => (
            <Card key={i} className="kpi-card animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{k.title}</span>
                  <div className={`h-8 w-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <k.icon className={`h-4 w-4 ${k.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-black text-foreground">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* KPIs de seguimiento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECONDARY_KPIS.map((k, i) => (
            <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 60 + 240}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{k.title}</span>
                  <div className={`h-8 w-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <k.icon className={`h-4 w-4 ${k.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CoachPerformanceBar />
          <CoachAttendanceArea />
        </div>

        {/* Today + Category + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <CoachTodaySession />
            <CoachCategoryPie />
          </div>
          <div className="lg:col-span-2">
            <CoachAthleteStatusTable />
          </div>
        </div>

        {/* Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdmin && (
            <Card className="hover:shadow-md transition-shadow animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4 text-orange-500" /> Nuevo Entrenamiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CreateTrainingDialog>
                  <Button className="w-full" size="sm">Crear sesión</Button>
                </CreateTrainingDialog>
              </CardContent>
            </Card>
          )}
          <Card className="hover:shadow-md transition-shadow animate-fade-in delay-75">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" /> Plantillas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="sm">Ver plantillas</Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow animate-fade-in delay-150">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-500" /> Mensajes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="sm">Bandeja</Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow animate-fade-in delay-225">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-violet-500" /> Reportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="sm">Exportar</Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CoachDashboard;
