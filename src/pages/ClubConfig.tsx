import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import ClubInfoSettings from '@/components/club-config/ClubInfoSettings';
import SystemSettings from '@/components/club-config/SystemSettings';
import PaymentSettings from '@/components/club-config/PaymentSettings';
import TrainingSettings from '@/components/club-config/TrainingSettings';
import NotificationSettings from '@/components/club-config/NotificationSettings';
import { Settings, Building2, CreditCard, Dumbbell, Bell, ShieldAlert } from 'lucide-react';

export interface ClubSettings {
  id: string;
  club_name: string;
  club_logo_url?: string;
  club_description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website_url?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_twitter?: string;
  timezone: string;
  currency: string;
  language: string;
  delegate_name?: string;
  delegate_phone?: string;
  delegate_email?: string;
  president_name?: string;
  president_phone?: string;
  president_email?: string;
  president_id?: string;
  doctor_name?: string;
  doctor_phone?: string;
  physiotherapist_name?: string;
  physiotherapist_phone?: string;
  league?: string;
  country?: string;
  coach_name?: string;
  coach_phone?: string;
  coach_email?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const ClubConfig = () => {
  const [clubSettings, setClubSettings] = useState<ClubSettings | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin, loading: profileLoading } = useUserProfile();

  console.log('ClubConfig: Component rendering', { 
    isAdmin, 
    profileLoading, 
    pathname: window.location.pathname 
  });

  const fetchClubSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('club_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setClubSettings(data);
    } catch (error) {
      console.error('Error fetching club settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los ajustes del club",
        variant: "destructive",
      });
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSystemSettings(data || []);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los ajustes del sistema",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      await Promise.all([fetchClubSettings(), fetchSystemSettings()]);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleClubSettingsUpdate = () => {
    fetchClubSettings();
    toast({
      title: "Éxito",
      description: "Configuración del club actualizada correctamente",
    });
  };

  const handleSystemSettingsUpdate = () => {
    fetchSystemSettings();
    toast({
      title: "Éxito",
      description: "Configuración del sistema actualizada correctamente",
    });
  };

  const getSettingsByCategory = (category: string) => {
    return systemSettings.filter(setting => setting.category === category);
  };

  if (profileLoading) {
    console.log('ClubConfig: Profile still loading...');
    return (
      <DashboardLayout title="Configurar Club">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <span className="ml-2">Cargando perfil...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    console.log('ClubConfig: Access denied - user is not admin');
    return (
      <DashboardLayout title="Configurar Club">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <ShieldAlert className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Acceso Denegado</h2>
          <p className="text-muted-foreground text-center">
            Solo los administradores pueden acceder a la configuración del club.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    console.log('ClubConfig: Settings data still loading...');
    return (
      <DashboardLayout title="Configurar Club">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <span className="ml-2">Cargando configuración...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Configurar Club">
      <div className="space-y-6 max-w-none">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Configuración del Club</h1>
        </div>

        <Tabs defaultValue="club-info" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="club-info" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Club
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Entrenamientos
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="club-info" className="space-y-6">
            <ClubInfoSettings 
              clubSettings={clubSettings}
              onUpdate={handleClubSettingsUpdate}
            />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemSettings 
              settings={getSettingsByCategory('general')}
              onUpdate={handleSystemSettingsUpdate}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <PaymentSettings 
              settings={getSettingsByCategory('payments')}
              onUpdate={handleSystemSettingsUpdate}
            />
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <TrainingSettings 
              settings={getSettingsByCategory('training')}
              onUpdate={handleSystemSettingsUpdate}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings 
              settings={getSettingsByCategory('notifications')}
              onUpdate={handleSystemSettingsUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClubConfig;