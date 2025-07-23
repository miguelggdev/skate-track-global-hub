import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  category?: string;
  level?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'registration-open';
  max_participants?: number;
  entry_fee?: number;
  prize_pool?: number;
  registration_deadline?: string;
  organizer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitionFormData {
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  location: string;
  category?: 'escuela' | 'menores' | 'transicion' | 'mayores' | 'junior' | 'youth' | 'senior' | 'masters' | 'prejuvenil' | 'juvenil' | null;
  level?: 'junior' | 'escuela' | 'transicion' | 'mayores' | 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'escuela_menores' | 'mini_infantil' | 'pre_infantil' | 'infantil' | 'pre_juvenil' | 'prejuveniles' | 'juvenil_primer_ano' | 'juvenil_segundo_ano' | 'juvenil_tercer_ano' | 'mayores_unica' | null;
  status: 'upcoming' | 'cancelled' | 'ongoing' | 'completed';
  max_participants?: number | null;
  entry_fee?: number | null;
  prize_pool?: number | null;
  registration_deadline?: string | null;
}

// Hook to fetch all competitions
export const useCompetitions = () => {
  return useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching competitions:', error);
        throw error;
      }

      return data as Competition[];
    },
  });
};

// Hook to fetch upcoming competitions only
export const useUpcomingCompetitions = () => {
  return useQuery({
    queryKey: ['competitions', 'upcoming'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .or(`start_date.gte.${today},status.eq.registration-open`)
        .order('start_date', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching upcoming competitions:', error);
        throw error;
      }

      return data as Competition[];
    },
  });
};

// Hook to create a new competition
export const useCreateCompetition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competitionData: CompetitionFormData) => {
      const { data, error } = await supabase
        .from('competitions')
        .insert(competitionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating competition:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch competitions data
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competition created successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to create competition:', error);
      toast.error('Failed to create competition. Please try again.');
    },
  });
};

// Hook to get competition registration counts
export const useCompetitionRegistrations = () => {
  return useQuery({
    queryKey: ['competition-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_registrations')
        .select(`
          competition_id,
          competitions!inner(name)
        `);

      if (error) {
        console.error('Error fetching competition registrations:', error);
        throw error;
      }

      // Group registrations by competition
      const registrationCounts = data.reduce((acc: Record<string, number>, reg) => {
        acc[reg.competition_id] = (acc[reg.competition_id] || 0) + 1;
        return acc;
      }, {});

      return registrationCounts;
    },
  });
};