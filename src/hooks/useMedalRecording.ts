import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MedalRecord {
  id?: string;
  competition_id: string;
  athlete_id: string;
  event_id?: string;
  medal_type: 'gold' | 'silver' | 'bronze';
  time_achieved?: string; // ISO 8601 interval format
  event_location?: string;
  position?: number;
  score?: number;
  notes?: string;
}

export interface CompetitionEvent {
  id: string;
  competition_id: string;
  event_name: string;
  event_type: string;
  category?: string;
  gender?: string;
  age_group?: string;
  location?: string;
  scheduled_time?: string;
}

export const useMedalRecording = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const recordMedal = useMutation({
    mutationFn: async (medalData: MedalRecord) => {
      const { data, error } = await supabase
        .from('competition_results')
        .insert({
          competition_id: medalData.competition_id,
          athlete_id: medalData.athlete_id,
          event_id: medalData.event_id,
          medal_type: medalData.medal_type,
          time_achieved: medalData.time_achieved,
          event_location: medalData.event_location,
          position: medalData.position,
          score: medalData.score,
          notes: medalData.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition-medals'] });
      queryClient.invalidateQueries({ queryKey: ['medal-analytics'] });
      toast({
        title: 'Medal Recorded',
        description: 'Medal has been successfully recorded',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record medal',
        variant: 'destructive',
      });
    },
  });

  const updateMedal = useMutation({
    mutationFn: async ({ id, ...medalData }: MedalRecord & { id: string }) => {
      const { data, error } = await supabase
        .from('competition_results')
        .update(medalData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition-medals'] });
      toast({
        title: 'Medal Updated',
        description: 'Medal has been successfully updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update medal',
        variant: 'destructive',
      });
    },
  });

  const deleteMedal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('competition_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition-medals'] });
      toast({
        title: 'Medal Deleted',
        description: 'Medal has been successfully deleted',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete medal',
        variant: 'destructive',
      });
    },
  });

  return {
    recordMedal,
    updateMedal,
    deleteMedal,
  };
};

export const useCompetitionMedals = (competitionId?: string) => {
  return useQuery({
    queryKey: ['competition-medals', competitionId],
    queryFn: async () => {
      let query = supabase
        .from('competition_results')
        .select(`
          *,
          athletes (
            id,
            first_name,
            last_name,
            category,
            gender
          ),
          competition_events (
            id,
            event_name,
            event_type,
            location
          )
        `)
        .not('medal_type', 'is', null)
        .order('medal_type', { ascending: true });

      if (competitionId) {
        query = query.eq('competition_id', competitionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!competitionId,
  });
};

export const useCompetitionEvents = (competitionId?: string) => {
  return useQuery({
    queryKey: ['competition-events', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_events')
        .select('*')
        .eq('competition_id', competitionId!)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!competitionId,
  });
};

export const useCompetitionParticipants = (competitionId?: string) => {
  return useQuery({
    queryKey: ['competition-participants', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_registrations')
        .select(`
          athlete_id,
          athletes (
            id,
            first_name,
            last_name,
            category,
            gender
          )
        `)
        .eq('competition_id', competitionId!);

      if (error) throw error;
      return data;
    },
    enabled: !!competitionId,
  });
};

export const useMedalAnalytics = () => {
  return useQuery({
    queryKey: ['medal-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_results')
        .select(`
          *,
          athletes (
            id,
            first_name,
            last_name
          ),
          competitions (
            id,
            name,
            start_date
          )
        `)
        .not('medal_type', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
