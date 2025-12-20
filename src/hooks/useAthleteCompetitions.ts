import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAthlete } from './useCurrentAthlete';

export interface AthleteCompetition {
  id: string;
  name: string;
  description: string | null;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  category: string | null;
  level: string | null;
  registration_status: string;
  registration_date: string;
}

export interface AthleteCompetitionResult {
  id: string;
  competition_id: string;
  competition_name: string;
  position: number | null;
  medal_type: string | null;
  event_type: string | null;
  event_location: string | null;
  points: number | null;
  personal_best: boolean | null;
  notes: string | null;
  competition_date: string;
}

export interface AthleteCompetitionStats {
  totalCompetitions: number;
  upcomingCompetitions: number;
  completedCompetitions: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  totalMedals: number;
  bestPosition: number | null;
  totalPoints: number;
}

export const useAthleteCompetitions = () => {
  const { athlete } = useCurrentAthlete();

  // Fetch competitions where athlete is registered
  const { data: registrations, isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['athlete-competition-registrations', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];
      
      const { data, error } = await supabase
        .from('competition_registrations')
        .select(`
          id,
          registration_date,
          payment_status,
          competitions (
            id,
            name,
            description,
            location,
            start_date,
            end_date,
            status,
            category,
            level
          )
        `)
        .eq('athlete_id', athlete.id)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      
      return data?.map(reg => ({
        id: reg.competitions?.id || '',
        name: reg.competitions?.name || '',
        description: reg.competitions?.description,
        location: reg.competitions?.location || '',
        start_date: reg.competitions?.start_date || '',
        end_date: reg.competitions?.end_date || '',
        status: reg.competitions?.status || '',
        category: reg.competitions?.category,
        level: reg.competitions?.level,
        registration_status: reg.payment_status,
        registration_date: reg.registration_date
      })) as AthleteCompetition[] || [];
    },
    enabled: !!athlete?.id
  });

  // Fetch athlete's competition results
  const { data: results, isLoading: isLoadingResults } = useQuery({
    queryKey: ['athlete-competition-results', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];
      
      const { data, error } = await supabase
        .from('competition_results')
        .select(`
          id,
          competition_id,
          position,
          medal_type,
          event_type,
          event_location,
          points,
          personal_best,
          notes,
          competitions (
            name,
            start_date
          )
        `)
        .eq('athlete_id', athlete.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data?.map(result => ({
        id: result.id,
        competition_id: result.competition_id,
        competition_name: result.competitions?.name || '',
        position: result.position,
        medal_type: result.medal_type,
        event_type: result.event_type,
        event_location: result.event_location,
        points: result.points,
        personal_best: result.personal_best,
        notes: result.notes,
        competition_date: result.competitions?.start_date || ''
      })) as AthleteCompetitionResult[] || [];
    },
    enabled: !!athlete?.id
  });

  // Calculate stats from athlete's data
  const stats: AthleteCompetitionStats = {
    totalCompetitions: registrations?.length || 0,
    upcomingCompetitions: registrations?.filter(c => c.status === 'upcoming').length || 0,
    completedCompetitions: registrations?.filter(c => c.status === 'completed').length || 0,
    goldMedals: results?.filter(r => r.medal_type === 'gold').length || 0,
    silverMedals: results?.filter(r => r.medal_type === 'silver').length || 0,
    bronzeMedals: results?.filter(r => r.medal_type === 'bronze').length || 0,
    totalMedals: results?.filter(r => r.medal_type).length || 0,
    bestPosition: results?.reduce((best, r) => {
      if (r.position === null) return best;
      if (best === null) return r.position;
      return r.position < best ? r.position : best;
    }, null as number | null) || null,
    totalPoints: results?.reduce((sum, r) => sum + (r.points || 0), 0) || 0
  };

  // Split registrations into upcoming and past
  const today = new Date().toISOString().split('T')[0];
  const upcomingCompetitions = registrations?.filter(c => c.start_date >= today) || [];
  const pastCompetitions = registrations?.filter(c => c.start_date < today) || [];

  return {
    registrations: registrations || [],
    upcomingCompetitions,
    pastCompetitions,
    results: results || [],
    stats,
    isLoading: isLoadingRegistrations || isLoadingResults
  };
};
