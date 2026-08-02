import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Users, Calendar, TrendingUp, Zap, Plus, Download,
  MessageSquare, FileText, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateTrainingDialog from '@/components/training/CreateTrainingDialog';
import {
  CoachPerformanceBar, CoachAttendanceArea,
  CoachCategoryPie, CoachAthleteStatusTable, CoachTodaySession
} from '@/components/dashboard/CoachCharts';
import { DashboardAgentPanel } from '@/components/agents/DashboardAgentPanel';
import { supabase } from '@/integrations/supabase/client';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserProfile();

  const { data: kpis } = useQuery({
    queryKey: ['coach-dashboard-kpis'],
    queryFn: async () => {
      const monthStart   = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const sevenDaysAgo  = new Date(Date.now() -  7 * 86_400_000).toISOString();

      const [
        athletesRes, sessionsRes, attendanceRes,
        recentAttendanceRes, newResultsRes, coachesRes,
        improvingRes,
      ] = await Promise.all([
        supabase.from('athletes').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('training_sessions').select('id', { count: 'exact' }).gte('scheduled_at', monthStart),
        supabase
          .from('training_attendance')
          .select('attended, athlete_id')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('training_attendance')
          .select('athlete_id')
          .gte('created_at', sevenDaysAgo)
          .eq('attended', true),
        supabase.from('competition_results').select('id', { count: 'exact' })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('user_roles').select('user_id', { count: 'exact' }).eq('role', 'coach'),
        supabase.from('competition_results').select('athlete_id').gte('created_at',
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      const attended    = attendanceRes.data ?? [];
      const attendanceRate = attended.length > 0
        ? Math.round((attended.filter(a => a.attended).length / attended.length) * 100)
        : 0;

      const totalAthletes   = athletesRes.count ?? 0;
      const recentAthleteIds = new Set((recentAttendanceRes.data ?? []).map(r => r.athlete_id));
      const noShowLast7 = Math.max(0, totalAthletes - recentAthleteIds.size);

      // Athletes with low attendance: attended < 50% of their sessions in last 30 days
      const byAthlete: Record<string, { total: number; attended: number }> = {};
      for (const row of attended) {
        if (!byAthlete[row.athlete_id]) byAthlete[row.athlete_id] = { total: 0, attended: 0 };
        byAthlete[row.athlete_id].total++;
        if (row.attended) byAthlete[row.athlete_id].attended++;
      }
      const atRisk = Object.values(byAthlete).filter(
        s => s.total >= 3 && (s.attended / s.total) < 0.5
      ).length;

      // Athletes with at least one competition result this month
      const competingAthletes = new Set((improvingRes.data ?? []).map(r => r.athlete_id)).size;

      return {
        athletes:    totalAthletes,
        sessions:    sessionsRes.count ?? 0,
        attendance:  attendanceRate,
        newPBs:      newResultsRes.count ?? 0,
        noShowLast7,
        atRisk,
        competing:   competingAthletes,
        coaches:     coachesRes.count ?? 1,
      };
    },
  });

  const PRIMARY_KPIS = [
    { title: 'Atletas Activos',        value: kpis?.athletes ?? 0,            icon: Users,      color: 'text-blue-500',    bg: 'bg-blue-500/10',    change: 'Total con membresía activa' },
    { title: 'Sesiones Este Mes',      value: kpis?.sessions ?? 0,            icon: Calendar,   color: 'text-orange-500',  bg: 'bg-orange-500/10',  change: 'Entrenamientos programados' },
    { title: 'Asistencia Promedio',    value: `${kpis?.attendance ?? 0}%`,    icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', change: 'Últimos 30 días' },
    { title: 'Resultados Registrados', value: kpis?.newPBs ?? 0,              icon: Zap,        color: 'text-violet-500',  bg: 'bg-violet-500/10',  change: 'Resultados competencia este mes' },
  ];

  const atRiskVal   = kpis?.atRisk   ?? 0;
  const noShowVal   = kpis?.noShowLast7 ?? 0;
  const competingVal = kpis?.competing ?? 0;
  const coachesVal  = kpis?.coaches  ?? 1;

  const SECONDARY_KPIS = [
    {
      title: 'Sin Actividad 7 días',
      value: noShowVal,
      icon: Clock,
      color: noShowVal > 3 ? 'text-red-500' : 'text-amber-500',
      bg:    noShowVal > 3 ? 'bg-red-500/10' : 'bg-amber-500/10',
      note:  'Atletas sin asistir esta semana',
    },
    {
      title: 'En Riesgo de Abandono',
      value: atRiskVal,
      icon:  AlertTriangle,
      color: atRiskVal > 0 ? 'text-amber-500' : 'text-emerald-500',
      bg:    'bg-amber-500/10',
      note:  'Asistencia < 50% últimos 30 días',
    },
    {
      title: 'Compitiendo Este Mes',
      value: competingVal,
      icon:  CheckCircle2,
      color: 'text-emerald-500',
      bg:    'bg-emerald-500/10',
      note:  'Atletas con resultado este mes',
    },
    {
      title: 'Entrenadores Activos',
      value: coachesVal,
      icon:  Users,
      color: 'text-blue-500',
      bg:    'bg-blue-500/10',
      note:  'Cuerpo técnico registrado',
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

        {/* AG-02 — Experto en Patinaje */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardAgentPanel
            agentId="skating"
            title="Entrenador IA — Patinaje (AG-02)"
            subtitle="Periodización, técnica, estrategia de carrera"
            accentColor="from-blue-500 to-indigo-500"
            suggestedQuestions={[
              '¿Qué ejercicios de viraje en pista recomiendas para categoría juvenil?',
              'Crea un plan semanal de entrenamiento de fuerza para pista',
              '¿Cómo periodizar la semana antes de una competencia importante?',
              '¿Qué errores técnicos son más comunes en Prejuvenil?',
            ]}
          />
          <DashboardAgentPanel
            agentId="psychology"
            title="Psicología Deportiva (AG-13)"
            subtitle="Motivación, manejo de presión, bienestar mental"
            accentColor="from-violet-500 to-purple-500"
            suggestedQuestions={[
              '¿Cómo preparar mentalmente a un atleta para su primera competencia?',
              'Técnicas de concentración antes de la carrera',
              '¿Cómo manejar un atleta con baja motivación?',
            ]}
          />
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
                <FileText className="h-4 w-4 text-blue-500" /> Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="sm" onClick={() => navigate('/documentos')}>
                Ver documentos
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow animate-fade-in delay-150">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-500" /> Mensajes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="sm" onClick={() => navigate('/mensajes')}>
                Abrir bandeja
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow animate-fade-in delay-225">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-violet-500" /> Reportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="sm" onClick={() => navigate('/reports')}>
                Ver reportes
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CoachDashboard;
