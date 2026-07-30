import React from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { ClubSettings } from '@/pages/ClubConfig';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Building2, ShieldAlert } from 'lucide-react';
import BasicClubInfo from './sections/BasicClubInfo';
import ClubConfiguration from './sections/ClubConfiguration';
import DelegateInfo from './sections/DelegateInfo';
import PresidentInfo from './sections/PresidentInfo';
import MedicalStaff from './sections/MedicalStaff';
import LeagueCountryInfo from './sections/LeagueCountryInfo';
import CoachInfo from './sections/CoachInfo';
import SocialMediaLinks from './sections/SocialMediaLinks';
import ReportTemplateSettings from './sections/ReportTemplateSettings';
import LogoUpload from './LogoUpload';

interface ClubInfoSettingsProps {
  clubSettings: ClubSettings | null;
  onUpdate: () => void;
}

const ClubInfoSettings = ({ clubSettings, onUpdate }: ClubInfoSettingsProps) => {
  const [logoUrl, setLogoUrl] = React.useState(clubSettings?.club_logo_url || '');
  const { isAdmin, loading: profileLoading } = useUserProfile();
  const { toast } = useToast();

  React.useEffect(() => {
    setLogoUrl(clubSettings?.club_logo_url || '');
  }, [clubSettings?.club_logo_url]);

  const handleLogoUpdate = (newLogoUrl: string) => {
    setLogoUrl(newLogoUrl);
    onUpdate();
  };

  const form = useForm({
    defaultValues: {
      club_name: clubSettings?.club_name || '',
      club_description: clubSettings?.club_description || '',
      contact_email: clubSettings?.contact_email || '',
      contact_phone: clubSettings?.contact_phone || '',
      address: clubSettings?.address || '',
      website_url: clubSettings?.website_url || '',
      social_facebook: clubSettings?.social_facebook || '',
      social_instagram: clubSettings?.social_instagram || '',
      social_twitter: clubSettings?.social_twitter || '',
      timezone: clubSettings?.timezone || 'Europe/Madrid',
      currency: clubSettings?.currency || 'EUR',
      language: clubSettings?.language || 'es',
      delegate_name: clubSettings?.delegate_name || '',
      delegate_phone: clubSettings?.delegate_phone || '',
      delegate_email: clubSettings?.delegate_email || '',
      president_name: clubSettings?.president_name || '',
      president_phone: clubSettings?.president_phone || '',
      president_email: clubSettings?.president_email || '',
      president_id: clubSettings?.president_id || '',
      doctor_name: clubSettings?.doctor_name || '',
      doctor_phone: clubSettings?.doctor_phone || '',
      physiotherapist_name: clubSettings?.physiotherapist_name || '',
      physiotherapist_phone: clubSettings?.physiotherapist_phone || '',
      league: clubSettings?.league || '',
      country: clubSettings?.country || '',
      coach_name: clubSettings?.coach_name || '',
      coach_phone: clubSettings?.coach_phone || '',
      coach_email: clubSettings?.coach_email || '',
      report_include_logo: clubSettings?.report_include_logo ?? true,
      report_include_address: clubSettings?.report_include_address ?? true,
      report_include_contact: clubSettings?.report_include_contact ?? true,
      report_include_social: clubSettings?.report_include_social ?? false,
      report_include_president: clubSettings?.report_include_president ?? true,
      report_include_delegate: clubSettings?.report_include_delegate ?? false,
      report_include_league: clubSettings?.report_include_league ?? false,
      report_header_style: clubSettings?.report_header_style || 'full',
    },
  });

  React.useEffect(() => {
    if (clubSettings) {
      form.reset({
        club_name: clubSettings.club_name || '',
        club_description: clubSettings.club_description || '',
        contact_email: clubSettings.contact_email || '',
        contact_phone: clubSettings.contact_phone || '',
        address: clubSettings.address || '',
        website_url: clubSettings.website_url || '',
        social_facebook: clubSettings.social_facebook || '',
        social_instagram: clubSettings.social_instagram || '',
        social_twitter: clubSettings.social_twitter || '',
        timezone: clubSettings.timezone || 'Europe/Madrid',
        currency: clubSettings.currency || 'EUR',
        language: clubSettings.language || 'es',
        delegate_name: clubSettings.delegate_name || '',
        delegate_phone: clubSettings.delegate_phone || '',
        delegate_email: clubSettings.delegate_email || '',
        president_name: clubSettings.president_name || '',
        president_phone: clubSettings.president_phone || '',
        president_email: clubSettings.president_email || '',
        president_id: clubSettings.president_id || '',
        doctor_name: clubSettings.doctor_name || '',
        doctor_phone: clubSettings.doctor_phone || '',
        physiotherapist_name: clubSettings.physiotherapist_name || '',
        physiotherapist_phone: clubSettings.physiotherapist_phone || '',
        league: clubSettings.league || '',
        country: clubSettings.country || '',
        coach_name: clubSettings.coach_name || '',
        coach_phone: clubSettings.coach_phone || '',
        coach_email: clubSettings.coach_email || '',
        report_include_logo: clubSettings.report_include_logo ?? true,
        report_include_address: clubSettings.report_include_address ?? true,
        report_include_contact: clubSettings.report_include_contact ?? true,
        report_include_social: clubSettings.report_include_social ?? false,
        report_include_president: clubSettings.report_include_president ?? true,
        report_include_delegate: clubSettings.report_include_delegate ?? false,
        report_include_league: clubSettings.report_include_league ?? false,
        report_header_style: clubSettings.report_header_style || 'full',
      });
    }
  }, [clubSettings, form]);

  const onSubmit = async (data: any) => {
    try {
      if (!clubSettings?.id) {
        // Create new club settings
        const { error } = await supabase
          .from('club_settings')
          .insert([data]);
        
        if (error) throw error;
      } else {
        // Update existing club settings
        const { error } = await supabase
          .from('club_settings')
          .update(data)
          .eq('id', clubSettings.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Éxito",
        description: "Configuración del club actualizada correctamente",
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message?.includes('insufficient_privilege') || error.message?.includes('policy') 
          ? "No tienes permisos para modificar la configuración del club"
          : "No se pudo actualizar la configuración del club",
        variant: "destructive",
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <ShieldAlert className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acceso Denegado</h2>
        <p className="text-muted-foreground text-center">
          Solo los administradores pueden modificar la configuración del club.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LogoUpload 
        currentLogoUrl={logoUrl}
        onLogoUpdate={handleLogoUpdate}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información del Club
          </CardTitle>
          <CardDescription>
            Configura la información básica y los datos de contacto del club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <BasicClubInfo control={form.control} />
              <ClubConfiguration control={form.control} />
              <DelegateInfo control={form.control} />
              <PresidentInfo control={form.control} />
              <MedicalStaff control={form.control} />
              <LeagueCountryInfo control={form.control} />
              <CoachInfo control={form.control} />
              <SocialMediaLinks control={form.control} />
              <ReportTemplateSettings control={form.control} />

              <div className="flex justify-end">
                <Button type="submit">
                  Guardar Configuración
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubInfoSettings;