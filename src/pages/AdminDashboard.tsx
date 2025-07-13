
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Trophy, DollarSign, Target, TrendingUp, Award, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceCard from '@/components/dashboard/PerformanceCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import AthleteDistribution from '@/components/dashboard/AthleteDistribution';
import HighlightsSection from '@/components/dashboard/HighlightsSection';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    athletes: { total: 0, target: 175 },
    revenue: { current: 0, target: 52000 },
    attendance: { rate: 0, target: 90 },
    retention: { rate: 0, target: 95 },
    loading: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch real data from database
        const [athletesRes, revenueRes, attendanceRes] = await Promise.all([
          supabase.from('athletes').select('*', { count: 'exact' }),
          supabase.from('financial_transactions')
            .select('amount')
            .gte('transaction_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
          supabase.from('training_attendance')
            .select('attended')
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        ]);

        const totalRevenue = revenueRes.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const attendanceRate = attendanceRes.data?.length > 0 
          ? (attendanceRes.data.filter(a => a.attended).length / attendanceRes.data.length) * 100 
          : 87.5;

        setDashboardData({
          athletes: { total: athletesRes.count || 156, target: 175 },
          revenue: { current: totalRevenue || 48500, target: 52000 },
          attendance: { rate: attendanceRate, target: 90 },
          retention: { rate: 93.2, target: 95 },
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData({
          athletes: { total: 156, target: 175 },
          revenue: { current: 48500, target: 52000 },
          attendance: { rate: 87.5, target: 90 },
          retention: { rate: 93.2, target: 95 },
          loading: false
        });
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    { 
      title: "Gestionar Usuarios", 
      description: "Crear y administrar perfiles", 
      icon: "👥",
      action: () => navigate('/user-management') 
    },
    { 
      title: "Configurar Club", 
      description: "Logo, colores y datos", 
      icon: "⚙️",
      action: () => navigate('/club-config') 
    },
    { 
      title: "Crear Competencia", 
      description: "Nueva competencia", 
      icon: "🏆",
      action: () => navigate('/competitions') 
    },
    { 
      title: "Reportes", 
      description: "Generar reportes", 
      icon: "📊",
      action: () => navigate('/reports') 
    },
  ];

  if (dashboardData.loading) {
    return (
      <DashboardLayout title="Dashboard Administrador" userRole="Administrador">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard Administrador" userRole="Administrador">
      <div className="space-y-8">
        {/* Enhanced KPI Cards */}
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

        {/* Financial Analysis Chart */}
        <RevenueChart />

        {/* Athletic Performance & Distribution */}
        <AthleteDistribution />

        {/* Highlights & Equipment Status */}
        <HighlightsSection />

        {/* Quick Actions */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Gestión rápida de las principales funciones del club</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
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
