import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Athlete {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  category: string;
  level: string;
  status: string;
  performance_score?: number;
  join_date: string;
  created_at: string;
}

// Hook to fetch all athletes
export const useAthletes = () => {
  return useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;

      return data as Athlete[];
    },
  });
};

// Hook to fetch athletes by category and levels
export const useAthletesByCategory = (category?: string, levels?: string[]) => {
  return useQuery({
    queryKey: ['athletes', 'filtered', category, levels],
    queryFn: async () => {
      if (!category) return [];

      let query = supabase
        .from('athletes')
        .select('*')
        .eq('status', 'active');

      // Use string literal for category comparison to avoid type issues
      query = query.eq('category', category as any);

      if (levels && levels.length > 0) {
        query = query.in('level', levels as any);
      }

      const { data, error } = await query.order('first_name', { ascending: true });

      if (error) throw error;

      return data as Athlete[];
    },
    enabled: !!category,
  });
};