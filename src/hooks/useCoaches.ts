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
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'coach');

      if (error) {
        throw error;
      }

      return (data || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim()
      })) as Coach[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};
