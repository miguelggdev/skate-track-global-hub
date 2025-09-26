import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SystemSetting } from '@/pages/ClubConfig';

export const useBulkSettingsSave = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveBulkSettings = async (settings: SystemSetting[]) => {
    try {
      setLoading(true);
      
      // Create update promises for all settings
      const updatePromises = settings.map(setting => 
        supabase
          .from('system_settings')
          .update({ setting_value: setting.setting_value })
          .eq('id', setting.id)
      );

      // Execute all updates in parallel
      const results = await Promise.all(updatePromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to save ${errors.length} settings`);
      }

      toast({
        title: "Configuración guardada",
        description: `Se han guardado ${settings.length} configuraciones correctamente.`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error saving bulk settings:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar las configuraciones. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    saveBulkSettings,
    loading
  };
};