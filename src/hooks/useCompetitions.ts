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
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
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
        .gte('start_date', today)
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

// Hook to create competition with participants
export const useCreateCompetitionWithParticipants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { competition: CompetitionFormData; participants: string[] }) => {
      // First create the competition
      const { data: competitionData, error: competitionError } = await supabase
        .from('competitions')
        .insert(data.competition)
        .select()
        .single();

      if (competitionError) {
        console.error('Error creating competition:', competitionError);
        throw competitionError;
      }

      // Then create registrations for each participant
      if (data.participants.length > 0) {
        const registrations = data.participants.map(athleteId => ({
          competition_id: competitionData.id,
          athlete_id: athleteId,
          payment_status: 'pending' as const,
        }));

        const { error: registrationError } = await supabase
          .from('competition_registrations')
          .insert(registrations);

        if (registrationError) {
          console.error('Error creating registrations:', registrationError);
          throw registrationError;
        }
      }

      return competitionData;
    },
    onSuccess: () => {
      // Invalidate and refetch competitions data
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competition-registrations'] });
      toast.success('Competition created successfully with participants!');
    },
    onError: (error: any) => {
      console.error('Failed to create competition:', error);
      toast.error('Failed to create competition. Please try again.');
    },
  });
};

// Hook to update a competition
export const useUpdateCompetition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...competitionData }: CompetitionFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('competitions')
        .update(competitionData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating competition:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competition updated successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to update competition:', error);
      toast.error('Failed to update competition. Please try again.');
    },
  });
};

// Hook to delete a competition
export const useDeleteCompetition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competitionId: string) => {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', competitionId);

      if (error) {
        console.error('Error deleting competition:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competition deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to delete competition:', error);
      toast.error('Failed to delete competition. Please try again.');
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

// Hook to get competition PDF data
export const useCompetitionPDFData = (competitionId: string) => {
  return useQuery({
    queryKey: ['competition-pdf-data', competitionId],
    queryFn: async () => {
      // Fetch competition data
      const { data: competition, error: competitionError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (competitionError) {
        throw competitionError;
      }

      // Fetch club settings
      const { data: clubSettings, error: clubError } = await supabase
        .from('club_settings')
        .select('*')
        .limit(1)
        .single();

      if (clubError) {
        throw clubError;
      }

      // Fetch registered athletes with gender and age calculation
      const { data: registrations, error: registrationError } = await supabase
        .from('competition_registrations')
        .select(`
          athlete_id,
          athletes!inner(
            id,
            first_name,
            last_name,
            date_of_birth,
            gender,
            category,
            level
          )
        `)
        .eq('competition_id', competitionId);

      if (registrationError) {
        throw registrationError;
      }

      // Process athletes data
      const athletes = registrations.map(reg => {
        const athlete = reg.athletes;
        const age = athlete.date_of_birth 
          ? new Date().getFullYear() - new Date(athlete.date_of_birth).getFullYear()
          : 0;
        
        return {
          ...athlete,
          age,
          gender: athlete.gender || 'masculino' // default if null
        };
      });

      // Separate and sort by gender and age
      const damas = athletes
        .filter(a => a.gender === 'femenino')
        .sort((a, b) => a.age - b.age);
      
      const varones = athletes
        .filter(a => a.gender === 'masculino')
        .sort((a, b) => a.age - b.age);

      return {
        competition,
        clubSettings,
        damas,
        varones
      };
    },
    enabled: !!competitionId,
  });
};