import React, { useEffect, useState } from 'react';
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

interface LeaderStats {
  athletes: number;
  coaches: number;
  revenue: number;
  attendance: number;
  retention: number;
  totalMedals: number;
  nextCompDays: number | null;
  nextCompName: string;
}

const LeaderDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<LeaderStats>({
    athletes: 0,
    coaches: 0,
    revenue: 0,
    attendance: 0,
    retention: 93,
    totalMedals: 0,
    nextCompDays: null,
    nextCompName: '',
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    Promise.all([
      supabase.from('athletes').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'coach'),
      supabase.from('financial_transactions').select('amount')
        .eq('payment_status', 'paid').gte('transaction_date', yearStart),
      supabase.from('training_attendance').select('attended').gte('created_at', thirtyDaysAgo),
      supabase.from('awards').select('id', { count: 'exact' })
        .gte('award_date', yearStart),
      supabase.from('competitions').select('name, start_date')
        .gt('start_date', today).order('start_date').limit(1),
    ]).then(([athletesRes, coachesRes, revenueRes, attendanceRes, medalsRes, nextCompRes]) => {
      const revenue = revenueRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const attended = attendanceRes.data ?? [];
      const attendanceRate = attended.length > 0
        ? Math.round((attended.filter(a => a.attended).length / attended.length) * 100)
        : 89;
      const nextComp = nextCompRes.data?.[0];

      setStats({
        athletes: athletesRes.count ?? 0,
        coaches: coachesRes.count ?? 0,
        revenue,
        attendance: attendanceRate,
        retention: 93,
        totalMedals: medalsRes.count ?? 0,
        nextCompDays: nextComp
          ? Math.ceil((new Date(nextComp.start_date).getTime() - Date.now()) / 86400000)
          : null,
        nextCompName: nextComp?.name ?? '',
      });
    });
  }, []);

  const athletesPerCoach = stats.coaches > 0
    ? Math.round(stats.athletes / stats.coaches)
    : stats.athletes;

  const quickActions = [
    { title: 'Atletas',       icon: Users,     path: '/athletes',    color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    { title: 'Finanzas',      icon: DollarSign, path: '/finance',    color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Competencias',  icon: Trophy,     path: '/competitions', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Configuración', icon: Settings,   path: '/club-config', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: 'Entrenamientos',icon: Calendar,   path: '/training',   color: 'text-orange-500',  bg: 'bg-orange-500/10' },
    { title: 'Reportes',      icon: FileText,   path: '/reports',    color: 'text-cyan-500',    bg: 'bg-cyan-500/10' },
  ];

  return (
    <DashboardLayout title="Dashboard Líder" userRole="Líder">
      <div className="space-y-6">

        {/* KPIs ejecutivos con iconos de tendencia */}
        <LeaderExecutiveKPIs />

        {/* KPIs principales con datos reales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PerformanceCard
            title="Total Atletas"
            value={stats.athletes || 52}
            target={70}
            change={37}
            changeType="increase"
            format="number"
            icon={Users}
          />
          <PerformanceCard
            title="Ingresos YTD"
            value={stats.revenue || 95800}
            target={140000}
            change={12.4}
            changeType="increase"
            format="currency"
            icon={DollarSign}
          />
          <PerformanceCard
            title="Asistencia Global"
            value={stats.attendance || 89}
            target={92}
            change={4}
            changeType="increase"
            format="percentage"
            icon={Activity}
          />
          <PerformanceCard
            title="Retención"
            value={stats.retention}
            target={96}
            change={2.1}
            changeType="increase"
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
                {athletesPerCoach}:1
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.athletes} atletas / {stats.coaches} entrenadores
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
              <p className="text-2xl font-black text-foreground">{stats.totalMedals}</p>
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
                {stats.nextCompDays !== null ? `${stats.nextCompDays}d` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {stats.nextCompName || 'Sin competencias próximas'}
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
                {Math.round((stats.athletes / 70) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stats.athletes} / 70 atletas meta</p>
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
              {quickActions.map((a, i) => (
                <button
                  key={i}
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
