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

export const useCompetitions = () => {
  return useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Competition[];
    },
  });
};

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
      if (error) throw error;
      return data as Competition[];
    },
  });
};

export const useCreateCompetition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competitionData: CompetitionFormData) => {
      const { data, error } = await supabase
        .from('competitions')
        .insert(competitionData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competencia creada correctamente');
    },
    onError: () => {
      toast.error('No se pudo crear la competencia');
    },
  });
};

export const useCreateCompetitionWithParticipants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { competition: CompetitionFormData; participants: string[] }) => {
      const { data: competitionData, error: competitionError } = await supabase
        .from('competitions')
        .insert(data.competition)
        .select()
        .single();
      if (competitionError) throw competitionError;

      if (data.participants.length > 0) {
        const registrations = data.participants.map(athleteId => ({
          competition_id: competitionData.id,
          athlete_id: athleteId,
          payment_status: 'pending' as const,
        }));

        const { error: registrationError } = await supabase
          .from('competition_registrations')
          .insert(registrations);
        if (registrationError) throw registrationError;
      }

      return competitionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competition-registrations'] });
      toast.success('Competencia creada con participantes');
    },
    onError: () => {
      toast.error('No se pudo crear la competencia');
    },
  });
};

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
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competencia actualizada correctamente');
    },
    onError: () => {
      toast.error('No se pudo actualizar la competencia');
    },
  });
};

export const useDeleteCompetition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competitionId: string) => {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', competitionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competencia eliminada correctamente');
    },
    onError: () => {
      toast.error('No se pudo eliminar la competencia');
    },
  });
};

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
      if (error) throw error;

      const registrationCounts = data.reduce((acc: Record<string, number>, reg) => {
        acc[reg.competition_id] = (acc[reg.competition_id] || 0) + 1;
        return acc;
      }, {});

      return registrationCounts;
    },
  });
};

export const useCompetitionPDFData = (competitionId: string) => {
  return useQuery({
    queryKey: ['competition-pdf-data', competitionId],
    queryFn: async () => {
      const { data: competition, error: competitionError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single();
      if (competitionError) throw competitionError;

      const { data: clubSettings, error: clubError } = await supabase
        .from('club_settings')
        .select('*')
        .limit(1)
        .single();
      if (clubError) throw clubError;

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
      if (registrationError) throw registrationError;

      const athletes = registrations.map(reg => {
        const athlete = reg.athletes;
        const age = athlete.date_of_birth
          ? new Date().getFullYear() - new Date(athlete.date_of_birth).getFullYear()
          : 0;
        return { ...athlete, age, gender: athlete.gender || 'masculino' };
      });

      const damas   = athletes.filter(a => a.gender === 'femenino').sort((a, b) => a.age - b.age);
      const varones = athletes.filter(a => a.gender === 'masculino').sort((a, b) => a.age - b.age);

      const { data: medalResults } = await supabase
        .from('competition_results')
        .select(`
          id, medal_type, time_seconds, position, event_name, notes,
          athletes!inner(id, first_name, last_name)
        `)
        .eq('competition_id', competitionId)
        .not('medal_type', 'is', null);

      const { data: allResults } = await supabase
        .from('competition_results')
        .select(`
          id, medal_type, time_seconds, position, event_name, notes,
          athletes!inner(id, first_name, last_name)
        `)
        .eq('competition_id', competitionId)
        .order('position', { ascending: true, nullsFirst: false });

      const medalStats = {
        gold:         (medalResults ?? []).filter(m => m.medal_type === 'gold').length,
        silver:       (medalResults ?? []).filter(m => m.medal_type === 'silver').length,
        bronze:       (medalResults ?? []).filter(m => m.medal_type === 'bronze').length,
        totalMedals:  (medalResults ?? []).length,
      };

      return {
        competition,
        clubSettings,
        damas,
        varones,
        medalResults: medalResults ?? [],
        allResults: allResults ?? [],
        medalStats,
      };
    },
    enabled: !!competitionId,
  });
};
