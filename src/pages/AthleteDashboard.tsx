
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';

// Import tab components
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
  const { athlete, loading, error } = useCurrentAthlete();

  if (loading) {
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
            <CardDescription>
              {error || 'No se encontró información del deportista'}
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mi Perfil Deportivo" userRole="Deportista">
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  ¡Hola, {athlete.first_name} {athlete.last_name}!
                </CardTitle>
                <CardDescription>
                  {athlete.category} • {athlete.level}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
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

          <TabsContent value="profile">
            <ProfileTab athlete={athlete} />
          </TabsContent>

          <TabsContent value="training">
            <TrainingTab />
          </TabsContent>

          <TabsContent value="body">
            <BodyTab />
          </TabsContent>

          <TabsContent value="contact">
            <ContactTab athlete={athlete} />
          </TabsContent>

          <TabsContent value="studies">
            <StudiesTab />
          </TabsContent>

          <TabsContent value="files">
            <FilesTab />
          </TabsContent>

          <TabsContent value="family">
            <FamilyTab />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTab />
          </TabsContent>

          <TabsContent value="skates">
            <SkatesTab />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceTab />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>

          <TabsContent value="hobbies">
            <HobbiesTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AthleteDashboard;
