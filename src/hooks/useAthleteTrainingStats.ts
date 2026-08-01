import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAthlete } from './useCurrentAthlete';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface AthleteTrainingStats {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  hoursThisMonth: number;
  upcomingSessions: number;
  averagePerformance: number;
  trainingTypeDistribution: Record<string, number>;
}

export interface AthleteTrainingSession {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number | null;
  location: string | null;
  training_type: string;
  description: string | null;
  attended: boolean | null;
  performance_rating: number | null;
  notes: string | null;
  attendance_id: string | null;
}

export const useAthleteTrainingStats = () => {
  const { athlete } = useCurrentAthlete();
  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  // Fetch all training sessions the athlete is registered for (via training_attendance)
  const { data: attendanceRecords, isLoading: isLoadingAttendance, refetch } = useQuery({
    queryKey: ['athlete-training-attendance', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];
      
      const { data, error } = await supabase
        .from('training_attendance')
        .select(`
          id,
          attended,
          performance_rating,
          notes,
          training_sessions (
            id,
            title,
            scheduled_at,
            duration_minutes,
            location,
            training_type,
            description
          )
        `)
        .eq('athlete_id', athlete.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data?.map(record => ({
        id: record.training_sessions?.id ?? '',
        title: record.training_sessions?.title ?? '',
        scheduled_at: record.training_sessions?.scheduled_at ?? '',
        duration_minutes: record.training_sessions?.duration_minutes ?? null,
        location: record.training_sessions?.location,
        training_type: record.training_sessions?.training_type ?? '',
        description: record.training_sessions?.description,
        attended: record.attended,
        performance_rating: record.performance_rating,
        notes: record.notes,
        attendance_id: record.id
      })) as AthleteTrainingSession[] ?? [];
    },
    enabled: !!athlete?.id
  });

  // Fetch upcoming training sessions (available for registration)
  const { data: availableSessions, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['athlete-available-training', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];
      
      const todayStr = format(today, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .gte('scheduled_at', todayStr)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!athlete?.id
  });

  // Calculate stats from athlete's attendance records
  const calculateStats = (): AthleteTrainingStats => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        totalSessions: 0,
        attendedSessions: 0,
        attendanceRate: 0,
        hoursThisMonth: 0,
        upcomingSessions: 0,
        averagePerformance: 0,
        trainingTypeDistribution: {}
      };
    }

    const todayStr = format(today, 'yyyy-MM-dd');
    
    const sessionDate = (s: AthleteTrainingSession) => s.scheduled_at.split('T')[0];

    // Past sessions only for stats
    const pastSessions = attendanceRecords.filter(s => sessionDate(s) < todayStr);
    const attendedSessions = pastSessions.filter(s => s.attended === true);

    // Upcoming sessions
    const upcomingSessions = attendanceRecords.filter(s => sessionDate(s) >= todayStr);

    // Hours this month (only attended sessions)
    const thisMonthAttended = attendedSessions.filter(
      s => sessionDate(s) >= monthStart && sessionDate(s) <= monthEnd
    );

    const hoursThisMonth = thisMonthAttended.reduce((total, session) => {
      return total + ((session.duration_minutes ?? 0) / 60);
    }, 0);
    
    // Average performance rating
    const sessionsWithRating = attendedSessions.filter(s => s.performance_rating !== null);
    const averagePerformance = sessionsWithRating.length > 0
      ? sessionsWithRating.reduce((sum, s) => sum + (s.performance_rating ?? 0), 0) / sessionsWithRating.length
      : 0;
    
    // Training type distribution (attended sessions only)
    const trainingTypeDistribution: Record<string, number> = {};
    attendedSessions.forEach(session => {
      const type = session.training_type || 'other';
      trainingTypeDistribution[type] = (trainingTypeDistribution[type] ?? 0) + 1;
    });
    
    return {
      totalSessions: pastSessions.length,
      attendedSessions: attendedSessions.length,
      attendanceRate: pastSessions.length > 0 
        ? Math.round((attendedSessions.length / pastSessions.length) * 100) 
        : 0,
      hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
      upcomingSessions: upcomingSessions.length,
      averagePerformance: Math.round(averagePerformance * 10) / 10,
      trainingTypeDistribution
    };
  };

  const stats = calculateStats();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Split sessions into upcoming and history
  const mySessions = attendanceRecords ?? [];
  const upcomingSessions = mySessions.filter(s => s.scheduled_at.split('T')[0] >= todayStr);
  const historySessions = mySessions.filter(s => s.scheduled_at.split('T')[0] < todayStr);

  // Check which available sessions the athlete is already registered for
  const registeredSessionIds = new Set(mySessions.map(s => s.id));
  const sessionsToRegister = availableSessions?.filter(s => !registeredSessionIds.has(s.id)) ?? [];

  return {
    mySessions,
    upcomingSessions,
    historySessions,
    availableSessions: sessionsToRegister,
    stats,
    isLoading: isLoadingAttendance || isLoadingAvailable,
    refetch
  };
};
