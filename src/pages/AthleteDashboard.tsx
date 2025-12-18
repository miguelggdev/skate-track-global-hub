import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Edit } from 'lucide-react';
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
import AthleteProfileSummary from '@/components/athletes/dashboard/cv/AthleteProfileSummary';
import AthletePDFExport from '@/components/athletes/dashboard/cv/AthletePDFExport';
import AthleteProfileEditDialog from '@/components/athletes/dashboard/cv/AthleteProfileEditDialog';

// Tab Components
import { ProfileTab } from '@/components/athletes/dashboard/ProfileTab';
import { BodyTab } from '@/components/athletes/dashboard/BodyTab';
import { ContactTab } from '@/components/athletes/dashboard/ContactTab';
import { StudiesTab } from '@/components/athletes/dashboard/StudiesTab';
import { FilesTab } from '@/components/athletes/dashboard/FilesTab';
import { FamilyTab } from '@/components/athletes/dashboard/FamilyTab';
import { PaymentsTab } from '@/components/athletes/dashboard/PaymentsTab';
import { SkatesTab } from '@/components/athletes/dashboard/SkatesTab';
import { MaintenanceTab } from '@/components/athletes/dashboard/MaintenanceTab';
import { HistoryTab } from '@/components/athletes/dashboard/HistoryTab';
import { HobbiesTab } from '@/components/athletes/dashboard/HobbiesTab';
import { TrainingTab } from '@/components/athletes/dashboard/TrainingTab';

const AthleteDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [awards, setAwards] = useState<any[]>([]);
  const [bodyInfo, setBodyInfo] = useState<any>(null);
  
  const { athlete, loading, error, refreshAthlete } = useCurrentAthlete();
  const { profile, loading: profileLoading } = useUserProfile();
  const { socials, refetch: refetchSocials } = useAthleteSocials(athlete?.id || null);
  const { sessions: medicalSessions, getSessionCounts } = useAthleteMedicalSessions(athlete?.id || null);
  const kpiData = useAthleteKPIs(athlete?.id || null);

  // Fetch awards and body info
  useEffect(() => {
    if (athlete?.id) {
      supabase.from('awards').select('*').eq('athlete_id', athlete.id).then(({ data }) => setAwards(data || []));
      supabase.from('athlete_body_info').select('*').eq('athlete_id', athlete.id).maybeSingle().then(({ data }) => setBodyInfo(data));
    }
  }, [athlete?.id]);

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
        {/* CV Header Section */}
        <div className="space-y-4">
          {/* Identity Card with Social Links */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <AthleteIdentityCard 
                athlete={athlete as any} 
                profile={profile}
                yearsExperience={(athlete as any).years_experience || 0}
              />
            </div>
            <div className="flex flex-col justify-center gap-3">
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
                    athlete: athlete as any,
                    profile,
                    kpis: kpiData,
                    competitions: kpiData.competitions,
                    medicalCounts,
                    socials
                  }}
                />
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <AthleteKPIDashboard 
            {...kpiData}
            onFilterChange={kpiData.setDateFilter}
          />

          {/* Medical Section */}
          <AthleteMedicalSection 
            sessionCounts={medicalCounts}
            injuries={bodyInfo?.injuries}
            year={kpiData.dateFilter.year}
            month={kpiData.dateFilter.month}
          />

          {/* Competitions & Achievements */}
          <AthleteCompetitionsSection 
            competitions={kpiData.competitions}
            awards={awards}
          />

          {/* Profile Summary */}
          <AthleteProfileSummary 
            bio={(athlete as any).bio}
            personalValues={(athlete as any).personal_values}
            shortTermGoals={(athlete as any).short_term_goals}
            longTermGoals={(athlete as any).long_term_goals}
          />
        </div>

        {/* Existing Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="training">Entrenamientos</TabsTrigger>
            <TabsTrigger value="body">Mi Cuerpo</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="studies">Estudios</TabsTrigger>
            <TabsTrigger value="files">Archivos</TabsTrigger>
            <TabsTrigger value="family">Familia</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="skates">Patines</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="hobbies">Hobbys</TabsTrigger>
          </TabsList>

          <TabsContent value="profile"><ProfileTab athlete={athlete} /></TabsContent>
          <TabsContent value="training"><TrainingTab /></TabsContent>
          <TabsContent value="body"><BodyTab /></TabsContent>
          <TabsContent value="contact"><ContactTab athlete={athlete} /></TabsContent>
          <TabsContent value="studies"><StudiesTab /></TabsContent>
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
