import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Superadmin de plataforma — operador que NO pertenece a ningún club
 * (tabla platform_admins, separada de user_roles). Da de alta clubes
 * nuevos desde /superadmin. Ver
 * supabase/migrations/20260824100000_superadmin_platform_role.sql.
 */
export const usePlatformAdmin = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['is-platform-admin', user?.id],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('is_platform_admin', {
        _user_id: user!.id,
      });
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { isPlatformAdmin: !!data, loading: isLoading };
};
