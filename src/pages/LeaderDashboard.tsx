import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Target, Calendar, BarChart3, Trophy, FileText,
  MessageSquare, Settings, TrendingUp, DollarSign, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceCard from '@/components/dashboard/PerformanceCard';
import {
  LeaderClubHealthRadar, LeaderAnnualTrend,
  LeaderStrategicAlerts, LeaderExecutiveKPIs
} from '@/components/dashboard/LeaderCharts';
import { supabase } from '@/integrations/supabase/client';

const LeaderDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ athletes: 0, revenue: 0, attendance: 0, retention: 93 });

  useEffect(() => {
    Promise.all([
      supabase.from('athletes').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('financial_transactions').select('amount')
        .eq('payment_status', 'paid')
        .gte('transaction_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]),
    ]).then(([athletesRes, revenueRes]) => {
      const revenue = revenueRes.data?.reduce((s, t) => s + Number(t.amount), 0) || 0;
      setStats(prev => ({ ...prev, athletes: athletesRes.count || 0, revenue }));
    });
  }, []);

  const quickActions = [
    { title: 'Atletas', icon: Users, path: '/athletes', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Finanzas', icon: DollarSign, path: '/finance', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Competencias', icon: Trophy, path: '/competitions', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Configuración', icon: Settings, path: '/club-config', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: 'Entrenamientos', icon: Calendar, path: '/training', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Reportes', icon: FileText, path: '/reports', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  return (
    <DashboardLayout title="Dashboard Líder" userRole="Líder">
      <div className="space-y-6">
        {/* Executive KPIs */}
        <LeaderExecutiveKPIs />

        {/* Main KPI Cards */}
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
            value={89}
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

        {/* Health Radar + Trend Chart */}
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
