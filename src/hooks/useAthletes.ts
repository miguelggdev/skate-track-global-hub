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

export interface AthletesPaginatedResult {
  data: Athlete[];
  count: number;
  totalPages: number;
  page: number;
}

export const useAthletesPaginated = (page = 1, pageSize = 20, search = '') => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return useQuery<AthletesPaginatedResult>({
    queryKey: ['athletes', 'paginated', page, pageSize, search],
    queryFn: async () => {
      let q = supabase
        .from('athletes')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .order('first_name', { ascending: true })
        .range(from, to);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s}`);
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return {
        data: (data ?? []) as Athlete[],
        count: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
        page,
      };
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

      query = query.eq('category', category);

      if (levels && levels.length > 0) {
        query = query.in('level', levels);
      }

      const { data, error } = await query.order('first_name', { ascending: true });

      if (error) throw error;

      return data as Athlete[];
    },
    enabled: !!category,
  });
};