import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, TrendingUp, Activity, Target, Zap } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAthleteSocials } from '@/hooks/useAthleteSocials';
import { useAthleteMedicalSessions } from '@/hooks/useAthleteMedicalSessions';
import { useAthleteKPIs } from '@/hooks/useAthleteKPIs';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// CV Components
import AthleteIdentityCard from '@/components/athletes/dashboard/cv/AthleteIdentityCard';
import AthleteSocialLinks from '@/components/athletes/dashboard/cv/AthleteSocialLinks';
import AthleteKPIDashboard from '@/components/athletes/dashboard/cv/AthleteKPIDashboard';
import AthleteMedicalSection from '@/components/athletes/dashboard/cv/AthleteMedicalSection';
import AthleteCompetitionsSection from '@/components/athletes/dashboard/cv/AthleteCompetitionsSection';
import AthleteSportsProfile from '@/components/athletes/dashboard/cv/AthleteSportsProfile';
import AthleteGallery from '@/components/athletes/dashboard/cv/AthleteGallery';
import AthletePDFExport from '@/components/athletes/dashboard/cv/AthletePDFExport';
import AthleteProfileEditDialog from '@/components/athletes/dashboard/cv/AthleteProfileEditDialog';
import { AthleteSkillsRadar, AthleteNextCompetition, AthleteAchievements } from '@/components/dashboard/AthleteCharts';
import { AthleteCVDownloadButton } from '@/lib/pdf/AthleteCVDocument';
import { DashboardAgentPanel } from '@/components/agents/DashboardAgentPanel';

// Navigation Component
import { AthleteTabNavigation } from '@/components/athletes/dashboard/AthleteTabNavigation';

// Tab Components
import { ProfileTab } from '@/components/athletes/dashboard/ProfileTab';
import { BodyTab } from '@/components/athletes/dashboard/BodyTab';
import { ContactTab } from '@/components/athletes/dashboard/ContactTab';
import { StudiesTab } from '@/components/athletes/dashboard/StudiesTab';
import { FamilyTab } from '@/components/athletes/dashboard/FamilyTab';
import { PaymentsTab } from '@/components/athletes/dashboard/PaymentsTab';
import { SkatesTab } from '@/components/athletes/dashboard/SkatesTab';
import { MaintenanceTab } from '@/components/athletes/dashboard/MaintenanceTab';
import { HistoryTab } from '@/components/athletes/dashboard/HistoryTab';
import { HobbiesTab } from '@/components/athletes/dashboard/HobbiesTab';
import { TrainingTab } from '@/components/athletes/dashboard/TrainingTab';
import { DocumentsTab } from '@/components/athletes/dashboard/DocumentsTab';
import { FilesTab } from '@/components/athletes/dashboard/FilesTab';
import { PerformanceTab } from '@/components/athletes/dashboard/PerformanceTab';
import { InternationalTab } from '@/components/athletes/dashboard/InternationalTab';
import { AttendanceHeatmapTab } from '@/components/athletes/dashboard/AttendanceHeatmapTab';

interface TrainingLoad {
  weeklyKm: number;
  consistencyPct: number;
  tssLoad: number;
  timeDeltaPct: number | null;
}

const AthleteDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { athlete, loading, error, refreshAthlete } = useCurrentAthlete();
  const { profile, loading: profileLoading } = useUserProfile();
  const { socials, refetch: refetchSocials } = useAthleteSocials(athlete?.id || null);
  const { sessions: medicalSessions, getSessionCounts } = useAthleteMedicalSessions(athlete?.id || null);
  const kpiData = useAthleteKPIs(athlete?.id || null);

  const { data: awards = [] } = useQuery({
    queryKey: ['athlete-awards', athlete?.id],
    queryFn: async () => {
      const { data, error: err } = await supabase.from('awards').select('*').eq('athlete_id', athlete!.id);
      if (err) throw err;
      return data ?? [];
    },
    enabled: !!athlete?.id,
  });

  const { data: bodyInfo } = useQuery({
    queryKey: ['athlete-body-info', athlete?.id],
    queryFn: async () => {
      const { data } = await supabase.from('athlete_body_info').select('*').eq('athlete_id', athlete!.id).maybeSingle();
      return data ?? null;
    },
    enabled: !!athlete?.id,
  });

  const { data: trainingLoad = { weeklyKm: 0, consistencyPct: 0, tssLoad: 0, timeDeltaPct: null } } = useQuery<TrainingLoad>({
    queryKey: ['athlete-training-load', athlete?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];
      const prevMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0];

      const [attRes, currTimeRes, prevTimeRes] = await Promise.all([
        supabase.from('training_attendance').select('attended').eq('athlete_id', athlete!.id).gte('created_at', thirtyDaysAgo),
        supabase.from('time_records').select('time_ms').eq('athlete_id', athlete!.id).gte('recorded_at', monthStart).order('time_ms').limit(1),
        supabase.from('time_records').select('time_ms').eq('athlete_id', athlete!.id).gte('recorded_at', prevMonthStart).lte('recorded_at', prevMonthEnd).order('time_ms').limit(1),
      ]);

      const attendance = (attRes.data ?? []) as { attended: boolean }[];
      const consistencyPct = attendance.length > 0
        ? Math.round((attendance.filter(a => a.attended).length / attendance.length) * 100) : 0;

      const weeklyKm = 0;

      const currTime = (currTimeRes.data?.[0] as { time_ms: number } | undefined)?.time_ms ?? null;
      const prevTime = (prevTimeRes.data?.[0] as { time_ms: number } | undefined)?.time_ms ?? null;
      const timeDeltaPct = (currTime !== null && prevTime !== null && prevTime > 0)
        ? Math.round(((prevTime - currTime) / prevTime) * 1000) / 10
        : null;

      const weeklySessions = attendance.filter(a => a.attended).length;
      const tssLoad = Math.min(100, Math.round((consistencyPct / 100) * weeklySessions * 12));

      return { weeklyKm, consistencyPct, tssLoad, timeDeltaPct };
    },
    enabled: !!athlete?.id,
  });

  // Redirect non-athletes
  if (!profileLoading && profile && profile.role !== 'athlete') {
    const redirectMap: Record<string, string> = {
      admin: '/admin-dashboard',
      coach: '/coach-dashboard',
      delegate: '/delegate-dashboard',
      leader: '/leader-dashboard',
      finance: '/finance-dashboard'
    };
    return <Navigate to={redirectMap[profile.role] || '/login'} replace />;
  }

  if (loading || profileLoading) {
    return (
      <DashboardLayout title="Mi Perfil Deportivo" userRole="Deportista">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !athlete) {
    return (
      <DashboardLayout title="Mi Perfil Deportivo" userRole="Deportista">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'No se encontró información del deportista'}</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  const handleProfileSave = () => {
    refreshAthlete();
    refetchSocials();
  };

  const medicalCounts = getSessionCounts(kpiData.dateFilter.year, kpiData.dateFilter.month);

  return (
    <DashboardLayout title="Mi Perfil Deportivo" userRole="Deportista">
      <div className="space-y-6">
        {/* 1. Identity Card with Social Links and Actions - FIRST */}
        <div className="space-y-3">
          <AthleteIdentityCard
            athlete={athlete}
            profile={profile}
            yearsExperience={athlete.years_experience ?? 0}
          />
          <div className="flex flex-wrap justify-between items-center gap-3">
            <AthleteSocialLinks 
              socials={socials} 
              email={athlete.email} 
              phone={profile?.phone}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
              <AthletePDFExport
                data={{
                  athlete: athlete,
                  profile,
                  kpis: kpiData,
                  competitions: kpiData.competitions,
                  medicalCounts,
                  socials
                }}
              />
              <AthleteCVDownloadButton
                data={{
                  athlete: athlete,
                  profile,
                  kpis: kpiData,
                  competitions: kpiData.competitions,
                }}
              />
            </div>
          </div>
        </div>

        {/* 2. Image Gallery - SECOND */}
        <AthleteGallery athleteId={athlete.id} editable={true} />

        {/* 3. Sports Profile (Bio, Values, Goals) - THIRD */}
        <AthleteSportsProfile
          athleteId={athlete.id}
          bio={athlete.bio}
          personalValues={athlete.personal_values}
          shortTermGoals={athlete.short_term_goals}
          longTermGoals={athlete.long_term_goals}
        />

        {/* CV Section */}
        <div className="space-y-4">

          {/* KPI Dashboard */}
          <AthleteKPIDashboard
            {...kpiData}
            onFilterChange={kpiData.setDateFilter}
          />

          {/* Training Performance KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="animate-fade-in">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Progresión Mensual</span>
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <p className={`text-2xl font-black ${
                  trainingLoad.timeDeltaPct === null ? 'text-muted-foreground' :
                  trainingLoad.timeDeltaPct > 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {trainingLoad.timeDeltaPct !== null
                    ? `${trainingLoad.timeDeltaPct > 0 ? '+' : ''}${trainingLoad.timeDeltaPct}%`
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Delta tiempo vs mes anterior</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in delay-75">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Volumen Semanal</span>
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-2xl font-black text-foreground">
                  {trainingLoad.weeklyKm > 0 ? `${trainingLoad.weeklyKm.toFixed(1)} km` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Distancia acumulada 7 días</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in delay-150">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Índice de Consistencia</span>
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-orange-500" />
                  </div>
                </div>
                <p className={`text-2xl font-black ${
                  trainingLoad.consistencyPct >= 80 ? 'text-emerald-500' :
                  trainingLoad.consistencyPct >= 60 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {trainingLoad.consistencyPct > 0 ? `${trainingLoad.consistencyPct}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Asistencia últimos 30 días</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in delay-225">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Carga de Entrenamiento</span>
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-violet-500" />
                  </div>
                </div>
                <p className={`text-2xl font-black ${
                  trainingLoad.tssLoad > 80 ? 'text-amber-500' :
                  trainingLoad.tssLoad > 50 ? 'text-emerald-500' : 'text-blue-500'
                }`}>
                  {trainingLoad.tssLoad > 0 ? trainingLoad.tssLoad : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">TSS estimado (0-100)</p>
              </CardContent>
            </Card>
          </div>

          {/* Medical Section */}
          <AthleteMedicalSection 
            sessionCounts={medicalCounts}
            injuries={bodyInfo?.injuries}
            year={kpiData.dateFilter.year}
            month={kpiData.dateFilter.month}
          />

          {/* Skills Radar + Next Competition + Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AthleteSkillsRadar athleteId={athlete.id} />
            <AthleteNextCompetition athleteId={athlete.id} />
            <AthleteAchievements awards={awards} />
          </div>

          {/* Competitions & Achievements */}
          <AthleteCompetitionsSection
            competitions={kpiData.competitions}
            awards={awards}
          />

          {/* Asistentes IA del atleta */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <DashboardAgentPanel
              agentId="skating"
              title="Entrenador IA (AG-02)"
              subtitle="Técnica, estrategia y periodización"
              accentColor="from-blue-500 to-indigo-500"
              suggestedQuestions={[
                '¿Cómo mejorar mi técnica de empuje?',
                '¿Cómo prepararme para mi próxima competencia?',
                '¿Qué ejercicios de pista recomiendas para esta semana?',
              ]}
            />
            <DashboardAgentPanel
              agentId="nutrition"
              title="Nutricionista IA (AG-04)"
              subtitle="Alimentación y hidratación para el rendimiento"
              accentColor="from-green-500 to-emerald-500"
              suggestedQuestions={[
                '¿Qué debo comer el día antes de competir?',
                '¿Cómo hidratarme durante un entrenamiento largo?',
                '¿Qué desayuno es ideal para entrenar en la mañana?',
              ]}
            />
            <DashboardAgentPanel
              agentId="psychology"
              title="Psicología Deportiva (AG-13)"
              subtitle="Motivación, concentración y bienestar mental"
              accentColor="from-violet-500 to-purple-500"
              suggestedQuestions={[
                '¿Cómo manejar los nervios antes de una carrera?',
                'Técnicas de visualización para competir mejor',
                '¿Cómo recuperarme mentalmente después de una caída?',
              ]}
            />
          </div>
        </div>

        {/* Existing Tabs */}
        {/* Tab Navigation */}
        <AthleteTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Contents */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsContent value="profile"><ProfileTab athlete={athlete} /></TabsContent>
          <TabsContent value="training"><TrainingTab /></TabsContent>
          <TabsContent value="attendance"><AttendanceHeatmapTab /></TabsContent>
          <TabsContent value="performance"><PerformanceTab /></TabsContent>
          <TabsContent value="competitions"><AthleteCompetitionsSection competitions={kpiData.competitions} awards={awards} /></TabsContent>
          <TabsContent value="international"><InternationalTab /></TabsContent>
          <TabsContent value="body"><BodyTab /></TabsContent>
          <TabsContent value="contact"><ContactTab athlete={athlete} /></TabsContent>
          <TabsContent value="studies"><StudiesTab /></TabsContent>
          <TabsContent value="documents"><DocumentsTab /></TabsContent>
          <TabsContent value="files"><FilesTab /></TabsContent>
          <TabsContent value="family"><FamilyTab /></TabsContent>
          <TabsContent value="payments"><PaymentsTab /></TabsContent>
          <TabsContent value="skates"><SkatesTab /></TabsContent>
          <TabsContent value="maintenance"><MaintenanceTab /></TabsContent>
          <TabsContent value="history"><HistoryTab /></TabsContent>
          <TabsContent value="hobbies"><HobbiesTab /></TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <AthleteProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          athlete={athlete}
          profile={profile}
          socials={socials}
          onSave={handleProfileSave}
        />
      </div>
    </DashboardLayout>
  );
};

export default AthleteDashboard;
