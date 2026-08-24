import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClubByDomain {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

/**
 * Resuelve el club dueño del dominio/subdominio actual, vía la función
 * pública get_club_by_domain (sin autenticar — se usa en login/registro).
 * Necesario para que el signup sepa a qué club_id asignar al usuario nuevo:
 * en multi-tenant, cada club puede tener su propio dominio apuntando al
 * mismo despliegue.
 */
export const useClubByDomain = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['club-by-domain', window.location.hostname],
    queryFn: async (): Promise<ClubByDomain | null> => {
      const { data, error } = await supabase
        .rpc('get_club_by_domain', { p_domain: window.location.hostname })
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { club: data ?? null, loading: isLoading, error: isError };
};
