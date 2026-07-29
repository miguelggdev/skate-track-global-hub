import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Calendar, Trophy, DollarSign, Target, TrendingUp, Award, AlertCircle
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

interface DashboardState {
  athletes: { total: number; target: number };
  revenue: { current: number; target: number };
  attendance: { rate: number; target: number };
  retention: { rate: number; target: number };
  loading: boolean;
}

interface OperationalKpis {
  overduePayments: number;
  todaySessions: number;
  nextCompDays: number | null;
  nextCompName: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: profileLoading } = useUserProfile();

  const [dashboardData, setDashboardData] = useState<DashboardState>({
    athletes: { total: 0, target: 175 },
    revenue: { current: 0, target: 52000 },
    attendance: { rate: 0, target: 90 },
    retention: { rate: 93.2, target: 95 },
    loading: true,
  });

  const [ops, setOps] = useState<OperationalKpis>({
    overduePayments: 0,
    todaySessions: 0,
    nextCompDays: null,
    nextCompName: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true }));

        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString().split('T')[0];

        const [athletesRes, revenueRes, attendanceRes, overdueRes, todaySessionsRes, nextCompRes] =
          await Promise.all([
            supabase.from('athletes').select('*', { count: 'exact' }),
            supabase.from('financial_transactions').select('amount').gte('transaction_date', monthStart),
            supabase.from('training_attendance').select('attended')
              .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
            supabase.from('financial_transactions').select('id', { count: 'exact' })
              .eq('payment_status', 'pending'),
            supabase.from('training_sessions').select('id', { count: 'exact' }).eq('date', today),
            supabase.from('competitions').select('name, start_date')
              .gt('start_date', today).order('start_date').limit(1),
          ]);

        const totalRevenue = revenueRes.data?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
        const attendedRows = attendanceRes.data ?? [];
        const attendanceRate = attendedRows.length > 0
          ? (attendedRows.filter(a => a.attended).length / attendedRows.length) * 100
          : 87.5;

        setDashboardData({
          athletes: { total: athletesRes.count ?? 0, target: 175 },
          revenue: { current: totalRevenue, target: 52000 },
          attendance: { rate: attendanceRate, target: 90 },
          retention: { rate: 93.2, target: 95 },
          loading: false,
        });

        const nextComp = nextCompRes.data?.[0];
        setOps({
          overduePayments: overdueRes.count ?? 0,
          todaySessions: todaySessionsRes.count ?? 0,
          nextCompDays: nextComp
            ? Math.ceil((new Date(nextComp.start_date).getTime() - Date.now()) / 86400000)
            : null,
          nextCompName: nextComp?.name ?? '',
        });
      } catch {
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };

    fetch();
  }, []);

  const quickActions = [
    { title: 'Gestionar Usuarios', description: 'Crear y administrar perfiles', icon: '👥', action: () => navigate('/user-management') },
    { title: 'Configurar Club',    description: 'Logo, colores y datos',       icon: '⚙️', action: () => navigate('/club-config') },
    { title: 'Crear Competencia', description: 'Nueva competencia',            icon: '🏆', action: () => navigate('/competitions') },
    { title: 'Reportes',          description: 'Generar reportes',             icon: '📊', action: () => navigate('/reports') },
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

  if (dashboardData.loading) {
    return (
      <DashboardLayout title="Dashboard Administrador" userRole="Administrador">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const metaPct = dashboardData.athletes.target > 0
    ? Math.round((dashboardData.athletes.total / dashboardData.athletes.target) * 100)
    : 0;

  return (
    <DashboardLayout title="Dashboard Administrador" userRole="Administrador">
      <div className="space-y-8">

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PerformanceCard
            title="Total Deportistas"
            value={dashboardData.athletes.total}
            target={dashboardData.athletes.target}
            change={8.3}
            changeType="increase"
            format="number"
            icon={Users}
          />
          <PerformanceCard
            title="Ingresos Mensuales"
            value={dashboardData.revenue.current}
            target={dashboardData.revenue.target}
            change={12.5}
            changeType="increase"
            format="currency"
            icon={DollarSign}
          />
          <PerformanceCard
            title="Asistencia Promedio"
            value={dashboardData.attendance.rate}
            target={dashboardData.attendance.target}
            change={2.8}
            changeType="increase"
            format="percentage"
            icon={TrendingUp}
          />
          <PerformanceCard
            title="Retención de Miembros"
            value={dashboardData.retention.rate}
            target={dashboardData.retention.target}
            change={1.2}
            changeType="increase"
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
              <p className={`text-2xl font-black ${ops.overduePayments > 0 ? 'text-red-500' : 'text-foreground'}`}>
                {ops.overduePayments}
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
              <p className="text-2xl font-black text-foreground">{ops.todaySessions}</p>
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
                {ops.nextCompDays !== null ? `${ops.nextCompDays}d` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {ops.nextCompName || 'Sin competencias próximas'}
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
                {dashboardData.athletes.total} / {dashboardData.athletes.target} atletas
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
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-200"
                  onClick={action.action}
                >
                  <div className="text-2xl">{action.icon}</div>
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
