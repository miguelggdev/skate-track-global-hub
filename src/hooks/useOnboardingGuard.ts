import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOnboardingGuard = (enabled: boolean) => {
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-guard'],
    queryFn: async () => {
      // RLS ("Users view own club") ya filtra esto al club del usuario
      // autenticado — no hace falta pasar club_id a mano.
      const { data } = await supabase
        .from('clubs')
        .select('id, onboarding_completed')
        .maybeSingle();
      return data;
    },
    enabled,
    staleTime: 30_000,
  });

  return {
    needsOnboarding: !isLoading && !!data && !data.onboarding_completed,
    loading: isLoading,
  };
};
