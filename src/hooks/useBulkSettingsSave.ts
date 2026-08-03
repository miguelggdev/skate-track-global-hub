import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SystemSetting } from '@/pages/ClubConfig';

export const useBulkSettingsSave = () => {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (settings: SystemSetting[]) => {
      const results = await Promise.all(
        settings.map(setting =>
          supabase
            .from('system_settings')
            .update({ setting_value: setting.setting_value })
            .eq('id', setting.id)
        )
      );
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error(`Failed to save ${errors.length} settings`);
      return settings.length;
    },
    onSuccess: (count) => {
      toast({
        title: 'Configuración guardada',
        description: `Se han guardado ${count} configuraciones correctamente.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error al guardar',
        description: 'No se pudieron guardar las configuraciones. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });

  const saveBulkSettings = async (settings: SystemSetting[]): Promise<{ success: boolean }> => {
    try {
      await mutation.mutateAsync(settings);
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  return {
    saveBulkSettings,
    loading: mutation.isPending,
  };
};
