import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Users, Calendar, Trophy, BarChart3, Clock, Target,
  FileText, MessageSquare, Plus, Download, Mail, TrendingUp, Zap
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateTrainingDialog from '@/components/training/CreateTrainingDialog';
import {
  CoachPerformanceBar, CoachAttendanceArea,
  CoachCategoryPie, CoachAthleteStatusTable, CoachTodaySession
} from '@/components/dashboard/CoachCharts';
import { supabase } from '@/integrations/supabase/client';

const CoachDashboard = () => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = useUserProfile();
  const [kpis, setKpis] = useState({ athletes: 0, sessions: 0, attendance: 0, newPBs: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('athletes').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('training_sessions').select('id', { count: 'exact' })
        .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
    ]).then(([athletesRes, sessionsRes]) => {
      setKpis(prev => ({
        ...prev,
        athletes: athletesRes.count || 0,
        sessions: sessionsRes.count || 0,
        attendance: 87,
        newPBs: 5,
      }));
    });
  }, []);

  const KPI_CARDS = [
    { title: 'Atletas Activos', value: kpis.athletes || 24, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', change: '+2 esta semana' },
    { title: 'Sesiones Este Mes', value: kpis.sessions || 12, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10', change: '+1 vs mes anterior' },
    { title: 'Asistencia Promedio', value: `${kpis.attendance}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', change: '+5% vs semana ant.' },
    { title: 'Nuevos PBs', value: kpis.newPBs || 5, icon: Zap, color: 'text-violet-500', bg: 'bg-violet-500/10', change: 'Esta semana' },
  ];

  return (
    <DashboardLayout title="Dashboard Entrenador" userRole="Entrenador">
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map((k, i) => (
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

        {/* Performance + Attendance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CoachPerformanceBar />
          <CoachAttendanceArea />
        </div>

        {/* Today + Category */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <CoachTodaySession />
            <CoachCategoryPie />
          </div>
          <div className="lg:col-span-2">
            <CoachAthleteStatusTable />
          </div>
        </div>

        {/* Tools Row */}
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
