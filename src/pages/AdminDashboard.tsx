import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Calendar, Trophy, DollarSign, Target, TrendingUp, Award, AlertCircle,
  UserCog, Settings2, Plus, BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceCard from '@/components/dashboard/PerformanceCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import AthleteDistribution from '@/components/dashboard/AthleteDistribution';
import HighlightsSection from '@/components/dashboard/HighlightsSection';
import MedalPodium from '@/components/dashboard/MedalPodium';
import TrainingHeatmap from '@/components/dashboard/TrainingHeatmap';
import CompetitionTimeline from '@/components/dashboard/CompetitionTimeline';
import {
  AdminClubHealthRadar, AdminGenderDistribution,
  AdminMemberGrowth, AdminAuditFeed
} from '@/components/dashboard/AdminHealthChart';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

const TARGET_ATHLETES = 175;
const TARGET_REVENUE  = 52_000;
const TARGET_ATTENDANCE = 90;
const TARGET_RETENTION  = 95;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: profileLoading } = useUserProfile();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['admin-dashboard-kpis'],
    queryFn: async () => {
      const today        = new Date().toISOString().split('T')[0];
      const monthStart   = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];
      const prevMonthEnd   = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0];

      const [
        activeAthletesRes, totalAthletesRes,
        revenueRes, prevRevenueRes,
        attendanceRes,
        overdueRes, todaySessionsRes, nextCompRes,
      ] = await Promise.all([
        supabase.from('athletes').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('athletes').select('id', { count: 'exact' }),
        supabase.from('financial_transactions').select('amount').gte('transaction_date', monthStart),
        supabase.from('financial_transactions').select('amount').gte('transaction_date', prevMonthStart).lte('transaction_date', prevMonthEnd),
        (supabase
          .from('training_attendance' as never)
          .select('attended')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()) as unknown as Promise<{ data: { attended: boolean }[] | null }>),
        supabase.from('financial_transactions').select('id', { count: 'exact' }).eq('payment_status', 'pending'),
        supabase.from('training_sessions').select('id', { count: 'exact' }).gte('scheduled_at', today).lt('scheduled_at', today + 'T23:59:59'),
        supabase.from('competitions').select('name, start_date').gt('start_date', today).order('start_date').limit(1),
      ]);

      const activeAthletes = activeAthletesRes.count ?? 0;
      const totalAthletes  = totalAthletesRes.count  ?? 0;
      const retentionRate  = totalAthletes > 0 ? Math.round((activeAthletes / totalAthletes) * 100) : 0;

      const currentRevenue = revenueRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const prevRevenue    = prevRevenueRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const revenueChangePct = prevRevenue > 0
        ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
        : 0;

      const attended = attendanceRes.data ?? [];
      const attendanceRate = attended.length > 0
        ? Math.round((attended.filter(a => a.attended).length / attended.length) * 100)
        : 0;

      const nextComp = nextCompRes.data?.[0];

      return {
        activeAthletes,
        totalAthletes,
        retentionRate,
        currentRevenue,
        revenueChangePct,
        attendanceRate,
        overduePayments: overdueRes.count ?? 0,
        todaySessions:   todaySessionsRes.count ?? 0,
        nextCompDays: nextComp
          ? Math.ceil((new Date(nextComp.start_date).getTime() - Date.now()) / 86_400_000)
          : null,
        nextCompName: nextComp?.name ?? '',
      };
    },
    enabled: !profileLoading && !!isAdmin,
  });

  const metaPct = TARGET_ATHLETES > 0
    ? Math.round(((kpis?.activeAthletes ?? 0) / TARGET_ATHLETES) * 100)
    : 0;

  const quickActions = [
    { title: 'Gestionar Usuarios', description: 'Crear y administrar perfiles', icon: UserCog,   path: '/user-management' },
    { title: 'Configurar Club',    description: 'Logo, colores y datos',         icon: Settings2, path: '/club-config' },
    { title: 'Crear Competencia',  description: 'Nueva competencia',             icon: Plus,      path: '/competitions' },
    { title: 'Reportes',           description: 'Generar reportes',              icon: BarChart3, path: '/reports' },
  ];

  if (profileLoading) {
    return (
      <DashboardLayout title="Dashboard Administrador" userRole="Administrador">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout title="Dashboard Administrador" userRole="Administrador">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Acceso Denegado</h2>
          <p className="text-muted-foreground text-center">
            Solo los administradores pueden acceder a este dashboard.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard Administrador" userRole="Administrador">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard Administrador" userRole="Administrador">
      <div className="space-y-8">

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PerformanceCard
            title="Total Deportistas"
            value={kpis?.activeAthletes ?? 0}
            target={TARGET_ATHLETES}
            format="number"
            icon={Users}
          />
          <PerformanceCard
            title="Ingresos Mensuales"
            value={kpis?.currentRevenue ?? 0}
            target={TARGET_REVENUE}
            change={kpis?.revenueChangePct ?? 0}
            changeType={kpis?.revenueChangePct && kpis.revenueChangePct >= 0 ? 'increase' : 'decrease'}
            format="currency"
            icon={DollarSign}
          />
          <PerformanceCard
            title="Asistencia Promedio"
            value={kpis?.attendanceRate ?? 0}
            target={TARGET_ATTENDANCE}
            format="percentage"
            icon={TrendingUp}
          />
          <PerformanceCard
            title="Retención de Miembros"
            value={kpis?.retentionRate ?? 0}
            target={TARGET_RETENTION}
            format="percentage"
            icon={Target}
          />
        </div>

        {/* KPIs operacionales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Pagos Pendientes</span>
                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className={`text-2xl font-black ${(kpis?.overduePayments ?? 0) > 0 ? 'text-red-500' : 'text-foreground'}`}>
                {kpis?.overduePayments ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Transacciones sin pagar</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in delay-75">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Sesiones Hoy</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">{kpis?.todaySessions ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Entrenamientos programados</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in delay-150">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Próxima Competencia</span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {kpis?.nextCompDays !== null && kpis?.nextCompDays !== undefined
                  ? `${kpis.nextCompDays}d`
                  : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {kpis?.nextCompName || 'Sin competencias próximas'}
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in delay-225">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Meta de Atletas</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Award className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">{metaPct}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis?.activeAthletes ?? 0} / {TARGET_ATHLETES} atletas
              </p>
            </CardContent>
          </Card>
        </div>

        <RevenueChart />
        <AthleteDistribution />
        <MedalPodium />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TrainingHeatmap />
          <CompetitionTimeline />
        </div>

        <AdminClubHealthRadar />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminGenderDistribution />
          <AdminMemberGrowth />
        </div>

        <AdminAuditFeed />
        <HighlightsSection />

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Gestión rápida de las principales funciones del club</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-200"
                  onClick={() => navigate(action.path)}
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <action.icon className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
