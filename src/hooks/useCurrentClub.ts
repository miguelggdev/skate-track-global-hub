import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CurrentClub {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

/**
 * Club del usuario autenticado actual — RLS ("Users view own club") ya
 * filtra la fila, así que un simple SELECT sin WHERE trae el club correcto.
 * Fase 7 del plan multi-tenant: reemplaza las lecturas directas de
 * `club_settings` (deprecada) por esta fuente única, y da a cualquier
 * componente el club_id necesario para namespacing de Storage (Fase 4).
 */
export const useCurrentClub = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['current-club', user?.id],
    queryFn: async (): Promise<CurrentClub | null> => {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, logo_url, primary_color, secondary_color')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { club: data ?? null, loading: isLoading };
};
