import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClubInfo, ReportSettings, ReportTemplateGenerator } from '@/utils/reportTemplateGenerator';
import jsPDF from 'jspdf';

interface ClubSettingsRow extends ClubInfo, ReportSettings {
  id?: string;
}

export const useReportTemplate = () => {
  const [clubInfo, setClubInfo] = useState<ClubInfo>({});
  const [reportSettings, setReportSettings] = useState<ReportSettings>({
    report_include_logo: true,
    report_include_address: true,
    report_include_contact: true,
    report_include_social: false,
    report_include_president: true,
    report_include_delegate: false,
    report_include_league: false,
    report_header_style: 'full'
  });
  const [loading, setLoading] = useState(true);

  const fetchClubData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const settings = data as ClubSettingsRow;
        
        // Extract club info
        setClubInfo({
          club_name: settings.club_name,
          club_logo_url: settings.club_logo_url,
          address: settings.address,
          contact_email: settings.contact_email,
          contact_phone: settings.contact_phone,
          website_url: settings.website_url,
          social_facebook: settings.social_facebook,
          social_instagram: settings.social_instagram,
          social_twitter: settings.social_twitter,
          president_name: settings.president_name,
          president_phone: settings.president_phone,
          president_email: settings.president_email,
          delegate_name: settings.delegate_name,
          delegate_phone: settings.delegate_phone,
          delegate_email: settings.delegate_email,
          league: settings.league,
          country: settings.country,
        });

        // Extract report settings
        setReportSettings({
          report_include_logo: settings.report_include_logo ?? true,
          report_include_address: settings.report_include_address ?? true,
          report_include_contact: settings.report_include_contact ?? true,
          report_include_social: settings.report_include_social ?? false,
          report_include_president: settings.report_include_president ?? true,
          report_include_delegate: settings.report_include_delegate ?? false,
          report_include_league: settings.report_include_league ?? false,
          report_header_style: settings.report_header_style || 'full'
        });
      }
    } catch (error) {
      console.error('Error fetching club data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, []);

  const createReportTemplate = async (doc: jsPDF): Promise<ReportTemplateGenerator> => {
    const generator = new ReportTemplateGenerator(doc, clubInfo, reportSettings);
    await generator.loadLogo();
    return generator;
  };

  const updateReportSettings = async (newSettings: Partial<ReportSettings>) => {
    try {
      // Get existing club settings
      const { data: existingData } = await supabase
        .from('club_settings')
        .select('*')
        .maybeSingle();

      const updateData = {
        ...newSettings
      };

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('club_settings')
          .update(updateData)
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        // Create new record with defaults
        const { error } = await supabase
          .from('club_settings')
          .insert({
            club_name: 'Mi Club',
            ...updateData
          });

        if (error) throw error;
      }

      // Update local state
      setReportSettings(prev => ({ ...prev, ...newSettings }));
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating report settings:', error);
      return { 
        success: false, 
        error: error.message?.includes('insufficient_privilege') || error.message?.includes('policy') 
          ? 'No tienes permisos para modificar la configuración de reportes'
          : 'No se pudo actualizar la configuración de reportes'
      };
    }
  };

  return {
    clubInfo,
    reportSettings,
    loading,
    createReportTemplate,
    updateReportSettings,
    refetch: fetchClubData
  };
};