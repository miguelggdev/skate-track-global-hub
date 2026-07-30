import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeeSettings } from '@/utils/feeCalculator';

/**
 * Hook to fetch fee settings from system_settings
 */
export const useFeeSettings = () => {
  return useQuery({
    queryKey: ['fee-settings'],
    queryFn: async (): Promise<FeeSettings> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', [
          'monthly_fee',
          'registration_fee',
          'enable_extraordinary_increment',
          'increment_start_day',
          'increment_percentage'
        ]);

      if (error) throw error;

      // Convert array to object with proper types
      const settings = (data || []).reduce((acc, setting) => {
        const value = 
          setting.setting_type === 'number' ? parseFloat(setting.setting_value || '0') :
          setting.setting_type === 'boolean' ? setting.setting_value === 'true' :
          setting.setting_value;
        
        acc[setting.setting_key as keyof FeeSettings] = value;
        return acc;
      }, {} as any);

      // Provide defaults if settings don't exist
      return {
        monthly_fee: settings.monthly_fee || 230000,
        registration_fee: settings.registration_fee || 150000,
        enable_extraordinary_increment: settings.enable_extraordinary_increment || false,
        increment_start_day: settings.increment_start_day || 15,
        increment_percentage: settings.increment_percentage || 10,
      };
    }
  });
};
