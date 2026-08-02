import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Target, Calendar, Trophy, FileText,
  TrendingUp, DollarSign, Activity, Settings, Star, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceCard from '@/components/dashboard/PerformanceCard';
import {
  LeaderClubHealthRadar, LeaderAnnualTrend,
  LeaderStrategicAlerts, LeaderExecutiveKPIs
} from '@/components/dashboard/LeaderCharts';
import { supabase } from '@/integrations/supabase/client';

const TARGET_ATTENDANCE = 92;
const TARGET_RETENTION  = 96;

const LeaderDashboard = () => {
  const navigate = useNavigate();

  const { data: clubSettings } = useQuery({
    queryKey: ['club-settings-targets'],
    queryFn: async () => {
      const { data } = await supabase
        .from('club_settings')
        .select('target_athletes, target_revenue')
        .maybeSingle();
      return { targetAthletes: data?.target_athletes ?? 50, targetRevenue: data?.target_revenue ?? 10_000 };
    },
  });

  const TARGET_ATHLETES = clubSettings?.targetAthletes ?? 50;
  const TARGET_REVENUE  = clubSettings?.targetRevenue  ?? 10_000;

  const { data: stats } = useQuery({
    queryKey: ['leader-dashboard-stats'],
    queryFn: async () => {
      const today     = new Date().toISOString().split('T')[0];
      const yearStart = `${new Date().getFullYear()}-01-01`;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

      const [
        activeAthletesRes, totalAthletesRes,
        coachesRes, revenueRes,
        attendanceRes, medalsRes, nextCompRes,
      ] = await Promise.all([
        supabase.from('athletes').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('athletes').select('id', { count: 'exact' }),
        supabase.from('user_roles').select('user_id', { count: 'exact' }).eq('role', 'coach'),
        supabase.from('financial_transactions').select('amount')
          .eq('payment_status', 'paid').gte('transaction_date', yearStart),
        supabase
          .from('training_attendance')
          .select('attended')
          .gte('created_at', thirtyDaysAgo),
        supabase.from('awards').select('id', { count: 'exact' }).gte('award_date', yearStart),
        supabase.from('competitions').select('name, start_date')
          .gt('start_date', today).order('start_date').limit(1),
      ]);

      const activeAthletes = activeAthletesRes.count ?? 0;
      const totalAthletes  = totalAthletesRes.count  ?? 0;
      const retentionRate  = totalAthletes > 0 ? Math.round((activeAthletes / totalAthletes) * 100) : 0;

      const revenue  = revenueRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const attended = attendanceRes.data ?? [];
      const attendanceRate = attended.length > 0
        ? Math.round((attended.filter(a => a.attended).length / attended.length) * 100)
        : 0;

      const nextComp = nextCompRes.data?.[0];

      return {
        athletes:     activeAthletes,
        totalAthletes,
        coaches:      coachesRes.count ?? 0,
        revenue,
        attendance:   attendanceRate,
        retention:    retentionRate,
        totalMedals:  medalsRes.count ?? 0,
        nextCompDays: nextComp
          ? Math.ceil((new Date(nextComp.start_date).getTime() - Date.now()) / 86_400_000)
          : null,
        nextCompName: nextComp?.name ?? '',
      };
    },
  });

  const athletes         = stats?.athletes ?? 0;
  const coaches          = stats?.coaches  ?? 0;
  const athletesPerCoach = coaches > 0 ? Math.round(athletes / coaches) : athletes;

  const quickActions = [
    { title: 'Atletas',        icon: Users,     path: '/athletes',     color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    { title: 'Finanzas',       icon: DollarSign, path: '/finance',     color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Competencias',   icon: Trophy,     path: '/competitions', color: 'text-amber-500',  bg: 'bg-amber-500/10' },
    { title: 'Configuración',  icon: Settings,   path: '/club-config',  color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: 'Entrenamientos', icon: Calendar,   path: '/training',     color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Reportes',       icon: FileText,   path: '/reports',      color: 'text-cyan-500',   bg: 'bg-cyan-500/10' },
  ];

  return (
    <DashboardLayout title="Dashboard Líder" userRole="Líder">
      <div className="space-y-6">

        {/* KPIs ejecutivos */}
        <LeaderExecutiveKPIs />

        {/* KPIs principales con datos reales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PerformanceCard
            title="Total Atletas"
            value={athletes}
            target={TARGET_ATHLETES}
            format="number"
            icon={Users}
          />
          <PerformanceCard
            title="Ingresos YTD"
            value={stats?.revenue ?? 0}
            target={TARGET_REVENUE}
            format="currency"
            icon={DollarSign}
          />
          <PerformanceCard
            title="Asistencia Global"
            value={stats?.attendance ?? 0}
            target={TARGET_ATTENDANCE}
            format="percentage"
            icon={Activity}
          />
          <PerformanceCard
            title="Retención"
            value={stats?.retention ?? 0}
            target={TARGET_RETENTION}
            format="percentage"
            icon={TrendingUp}
          />
        </div>

        {/* KPIs de gestión de club */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Ratio Atletas/Entrenador</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className={`text-2xl font-black ${athletesPerCoach > 25 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {coaches > 0 ? `${athletesPerCoach}:1` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {athletes} atletas / {coaches} entrenadores
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in delay-75">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Medallas Este Año</span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">{stats?.totalMedals ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Premios y reconocimientos registrados</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in delay-150">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Próxima Competencia</span>
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-orange-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats?.nextCompDays !== null && stats?.nextCompDays !== undefined
                  ? `${stats.nextCompDays}d`
                  : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {stats?.nextCompName || 'Sin competencias próximas'}
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in delay-225">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Meta de Crecimiento</span>
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-violet-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {TARGET_ATHLETES > 0 ? Math.round((athletes / TARGET_ATHLETES) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">{athletes} / {TARGET_ATHLETES} atletas meta</p>
            </CardContent>
          </Card>
        </div>

        {/* Health Radar + Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LeaderClubHealthRadar />
          <LeaderAnnualTrend />
        </div>

        {/* Alerts + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <LeaderStrategicAlerts />
          </div>
          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Acceso Rápido</CardTitle>
              <CardDescription>Secciones frecuentes</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <button
                  key={a.title}
                  onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:bg-muted/50 transition-all hover:scale-105 text-center"
                >
                  <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center`}>
                    <a.icon className={`h-4 w-4 ${a.color}`} />
                  </div>
                  <span className="text-xs font-medium">{a.title}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default LeaderDashboard;
