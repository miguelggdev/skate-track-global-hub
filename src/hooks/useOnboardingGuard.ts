import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOnboardingGuard = (enabled: boolean) => {
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-guard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('club_settings')
        .select('id')
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled,
    staleTime: 30_000,
  });

  return {
    needsOnboarding: !isLoading && data === null,
    loading: isLoading,
  };
};
