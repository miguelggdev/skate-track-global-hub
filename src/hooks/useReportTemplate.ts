import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClubInfo, ReportSettings, ReportTemplateGenerator } from '@/utils/reportTemplateGenerator';
import jsPDF from 'jspdf';

interface ClubSettingsRow extends ClubInfo, ReportSettings {
  id?: string;
}

const DEFAULT_REPORT_SETTINGS: ReportSettings = {
  report_include_logo:      true,
  report_include_address:   true,
  report_include_contact:   true,
  report_include_social:    false,
  report_include_president: true,
  report_include_delegate:  false,
  report_include_league:    false,
  report_header_style:      'full',
};

export const useReportTemplate = () => {
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['club-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return (data ?? null) as ClubSettingsRow | null;
    },
  });

  const clubInfo: ClubInfo = data ? {
    club_name:          data.club_name,
    club_logo_url:      data.club_logo_url,
    address:            data.address,
    contact_email:      data.contact_email,
    contact_phone:      data.contact_phone,
    website_url:        data.website_url,
    social_facebook:    data.social_facebook,
    social_instagram:   data.social_instagram,
    social_twitter:     data.social_twitter,
    president_name:     data.president_name,
    president_phone:    data.president_phone,
    president_email:    data.president_email,
    delegate_name:      data.delegate_name,
    delegate_phone:     data.delegate_phone,
    delegate_email:     data.delegate_email,
    league:             data.league,
    country:            data.country,
  } : {};

  const reportSettings: ReportSettings = data ? {
    report_include_logo:      data.report_include_logo      ?? true,
    report_include_address:   data.report_include_address   ?? true,
    report_include_contact:   data.report_include_contact   ?? true,
    report_include_social:    data.report_include_social    ?? false,
    report_include_president: data.report_include_president ?? true,
    report_include_delegate:  data.report_include_delegate  ?? false,
    report_include_league:    data.report_include_league    ?? false,
    report_header_style:      data.report_header_style      || 'full',
  } : DEFAULT_REPORT_SETTINGS;

  const createReportTemplate = async (doc: jsPDF): Promise<ReportTemplateGenerator> => {
    const generator = new ReportTemplateGenerator(doc, clubInfo, reportSettings);
    await generator.loadLogo();
    return generator;
  };

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<ReportSettings>) => {
      if (data) {
        const { error } = await supabase
          .from('club_settings')
          .update(newSettings)
          .eq('id', data.id!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('club_settings')
          .insert({ club_name: 'Mi Club', ...newSettings });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['club-settings'] });
    },
  });

  const updateReportSettings = async (newSettings: Partial<ReportSettings>): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateMutation.mutateAsync(newSettings);
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      return {
        success: false,
        error: msg.includes('insufficient_privilege') || msg.includes('policy')
          ? 'No tienes permisos para modificar la configuración de reportes'
          : 'No se pudo actualizar la configuración de reportes',
      };
    }
  };

  return {
    clubInfo,
    reportSettings,
    loading,
    createReportTemplate,
    updateReportSettings,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['club-settings'] }),
  };
};
