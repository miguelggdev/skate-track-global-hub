import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { useCurrentAthlete } from './useCurrentAthlete';

export interface TrainingKPIs {
  id: string;
  athlete_id?: string;
  coach_id?: string;
  month: string;
  total_hours: number;
  attendance_percentage: number;
  training_type_distribution: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface TeamAttendanceStats {
  total_sessions: number;
  total_attended: number;
  attendance_rate: number;
  avg_performance_rating?: number;
}

export interface AthletePerformanceStats {
  athlete_id: string;
  athlete_name: string;
  total_hours: number;
  attendance_percentage: number;
  avg_performance_rating?: number;
  recent_trend: 'improving' | 'declining' | 'stable';
}

export interface TrainingTypeDistribution {
  training_type: string;
  total_hours: number;
  session_count: number;
  attendance_rate: number;
}

export const useTrainingKPIs = (month?: string) => {
  const { profile } = useUserProfile();
  const { athlete } = useCurrentAthlete();

  // Get current month KPIs for the user
  const { data: myKPIs, isLoading: isLoadingMyKPIs } = useQuery({
    queryKey: ['training-kpis', 'my', month || new Date().toISOString().slice(0, 7)],
    queryFn: async () => {
      if (!profile) return null;

      const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';
      
      let query = supabase
        .from('training_kpis')
        .select('*')
        .eq('period_month', targetMonth);

      if (profile.role === 'athlete' && athlete) {
        query = query.eq('athlete_id', athlete.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(kpi => ({ ...kpi, month: (kpi as any).period_month ?? '' })) as TrainingKPIs[];
    },
    enabled: !!profile,
  });

  // Get team/global attendance statistics
  const { data: teamStats, isLoading: isLoadingTeamStats } = useQuery({
    queryKey: ['team-attendance-stats', month || new Date().toISOString().slice(0, 7)],
    queryFn: async () => {
      if (!profile || !['admin', 'coach', 'leader'].includes(profile.role)) return null;

      const startDate = month ? `${month}-01` : new Date().toISOString().slice(0, 7) + '-01';
      const endDate = month
        ? new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).toISOString().split('T')[0]
        : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('training_attendance')
        .select(`
          id,
          attended,
          performance_rating,
          training_sessions!inner (
            scheduled_at,
            duration_minutes
          )
        `)
        .gte('training_sessions.scheduled_at', startDate)
        .lte('training_sessions.scheduled_at', endDate);

      if (error) throw error;

      const total_sessions = data?.length || 0;
      const total_attended = data?.filter(record => record.attended).length || 0;
      const attendance_rate = total_sessions > 0 ? (total_attended / total_sessions) * 100 : 0;
      
      const ratingsWithValues = data?.filter(record => record.performance_rating !== null) || [];
      const avg_performance_rating = ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, record) => sum + (record.performance_rating || 0), 0) / ratingsWithValues.length
        : undefined;

      return {
        total_sessions,
        total_attended,
        attendance_rate,
        avg_performance_rating,
      } as TeamAttendanceStats;
    },
    enabled: !!profile && ['admin', 'coach', 'leader'].includes(profile.role),
  });

  // Get athlete performance comparison
  const { data: athletePerformance, isLoading: isLoadingAthletePerformance } = useQuery({
    queryKey: ['athlete-performance-stats', month || new Date().toISOString().slice(0, 7)],
    queryFn: async () => {
      if (!profile || !['admin', 'coach', 'leader'].includes(profile.role)) return [];

      const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';

      const { data, error } = await supabase
        .from('training_kpis')
        .select(`
          *,
          athletes!inner (
            id,
            first_name,
            last_name
          )
        `)
        .eq('period_month', targetMonth);

      if (error) throw error;

      return data?.map(kpi => ({
        athlete_id: kpi.athlete_id || '',
        athlete_name: `${kpi.athletes.first_name} ${kpi.athletes.last_name}`,
        total_hours: kpi.total_hours,
        attendance_percentage: kpi.attendance_percentage,
        recent_trend: 'stable' as const, // Would need historical data to calculate
      })) as AthletePerformanceStats[] || [];
    },
    enabled: !!profile && ['admin', 'coach', 'leader'].includes(profile.role),
  });

  // Get training type distribution
  const { data: trainingTypeDistribution, isLoading: isLoadingTrainingTypes } = useQuery({
    queryKey: ['training-type-distribution', month || new Date().toISOString().slice(0, 7)],
    queryFn: async () => {
      if (!profile) return [];

      const startDate = month ? `${month}-01` : new Date().toISOString().slice(0, 7) + '-01';
      const endDate = month
        ? new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).toISOString().split('T')[0]
        : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          training_type,
          duration_minutes,
          training_attendance (
            attended
          )
        `)
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate);

      if (error) throw error;

      // Group by training type and calculate statistics
      const distribution = data?.reduce((acc, session) => {
        const type = session.training_type;
        if (!acc[type]) {
          acc[type] = {
            training_type: type,
            total_hours: 0,
            session_count: 0,
            total_attendances: 0,
            total_possible_attendances: 0,
          };
        }

        const duration = (session.duration_minutes || 0) / 60;

        acc[type].total_hours += duration;
        acc[type].session_count += 1;
        
        if (session.training_attendance) {
          session.training_attendance.forEach(attendance => {
            acc[type].total_possible_attendances += 1;
            if (attendance.attended) {
              acc[type].total_attendances += 1;
            }
          });
        }

        return acc;
      }, {} as Record<string, any>) || {};

      return Object.values(distribution).map(dist => ({
        training_type: dist.training_type,
        total_hours: dist.total_hours,
        session_count: dist.session_count,
        attendance_rate: dist.total_possible_attendances > 0 
          ? (dist.total_attendances / dist.total_possible_attendances) * 100 
          : 0,
      })) as TrainingTypeDistribution[];
    },
    enabled: !!profile,
  });

  return {
    myKPIs,
    teamStats,
    athletePerformance,
    trainingTypeDistribution,
    isLoading: isLoadingMyKPIs || isLoadingTeamStats || isLoadingAthletePerformance || isLoadingTrainingTypes,
  };
};