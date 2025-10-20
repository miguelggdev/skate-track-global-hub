import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Coach {
  id: string;
  name: string;
}

export const useCoaches = () => {
  return useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaches')
        .select(`
          id,
          profiles!inner(
            first_name,
            last_name,
            user_roles!inner(role)
          )
        `)
        .eq('profiles.user_roles.role', 'coach');

      if (error) {
        throw error;
      }

      return (data || []).map(coach => ({
        id: coach.id,
        name: `${coach.profiles.first_name} ${coach.profiles.last_name}`.trim()
      })) as Coach[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};
