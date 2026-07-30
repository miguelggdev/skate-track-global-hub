import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

export interface TrainingStats {
  totalAthletes: number;
  activeAthletes: number;
  completionRate: number;
  avgSessionTime: number;
  activeSessions: number;
  upcomingSessions: number;
  monthlyTrainingHours: number;
  weeklyIntensity: number;
  coachUtilization: number;
  trainingTypeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  attendanceTrends: Array<{
    date: string;
    attendanceRate: number;
  }>;
  peakTrainingTimes: Array<{
    hour: number;
    day: string;
    sessionCount: number;
  }>;
}

export const useTrainingStats = () => {
  const { profile } = useUserProfile();

  return useQuery({
    queryKey: ['training-stats'],
    queryFn: async (): Promise<TrainingStats> => {
      // Get total athletes count
      const { data: athletesData, error: athletesError } = await supabase
        .from('athletes')
        .select('id')
        .eq('status', 'active');

      if (athletesError) throw athletesError;

      // Get active athletes (those with recent attendance)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeAthletesData, error: activeAthletesError } = await supabase
        .from('training_attendance')
        .select('athlete_id, training_sessions!inner(scheduled_at)')
        .gte('training_sessions.scheduled_at', thirtyDaysAgo.toISOString().split('T')[0])
        .eq('attended', true);

      if (activeAthletesError) throw activeAthletesError;

      const uniqueActiveAthletes = new Set(activeAthletesData?.map(a => a.athlete_id) || []);

      // Get completion rate
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('training_attendance')
        .select('attended, training_sessions!inner(scheduled_at)')
        .gte('training_sessions.scheduled_at', thirtyDaysAgo.toISOString().split('T')[0]);

      if (attendanceError) throw attendanceError;

      const totalAttendanceRecords = attendanceData?.length || 0;
      const attendedRecords = attendanceData?.filter(a => a.attended).length || 0;
      const completionRate = totalAttendanceRecords > 0 ? (attendedRecords / totalAttendanceRecords) * 100 : 0;

      // Get average session time
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('duration_minutes');

      if (sessionsError) throw sessionsError;

      let totalMinutes = 0;
      let sessionCount = 0;

      sessionsData?.forEach(session => {
        totalMinutes += session.duration_minutes || 0;
        sessionCount++;
      });

      const avgSessionTime = sessionCount > 0 ? totalMinutes / sessionCount / 60 : 0;

      // Get active sessions (today and future)
      const today = new Date().toISOString().split('T')[0];
      const { data: activeSessionsData, error: activeSessionsError } = await supabase
        .from('training_sessions')
        .select('id')
        .gte('scheduled_at', today);

      if (activeSessionsError) throw activeSessionsError;

      // Get upcoming sessions (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: upcomingSessionsData, error: upcomingSessionsError } = await supabase
        .from('training_sessions')
        .select('id')
        .gte('scheduled_at', today)
        .lte('scheduled_at', nextWeek.toISOString().split('T')[0]);

      if (upcomingSessionsError) throw upcomingSessionsError;

      // Get monthly training hours
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      const { data: monthlySessionsData, error: monthlySessionsError } = await supabase
        .from('training_sessions')
        .select('duration_minutes')
        .gte('scheduled_at', firstDayOfMonth.toISOString().split('T')[0])
        .lte('scheduled_at', today);

      if (monthlySessionsError) throw monthlySessionsError;

      const monthlyHours = (monthlySessionsData || []).reduce((sum, session) => {
        return sum + (session.duration_minutes || 0) / 60;
      }, 0);

      // Get training type distribution
      const { data: trainingTypesData, error: trainingTypesError } = await supabase
        .from('training_sessions')
        .select('training_type')
        .gte('scheduled_at', thirtyDaysAgo.toISOString().split('T')[0]);

      if (trainingTypesError) throw trainingTypesError;

      const typeDistribution = trainingTypesData?.reduce((acc, session) => {
        const type = session.training_type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const totalSessions = Object.values(typeDistribution).reduce((sum, count) => sum + count, 0);
      const trainingTypeDistribution = Object.entries(typeDistribution).map(([type, count]) => ({
        type,
        count,
        percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
      }));

      // Get weekly intensity (sessions per week trend)
      const { data: weeklySessionsData, error: weeklySessionsError } = await supabase
        .from('training_sessions')
        .select('scheduled_at')
        .gte('scheduled_at', thirtyDaysAgo.toISOString().split('T')[0]);

      if (weeklySessionsError) throw weeklySessionsError;

      const weeksData = weeklySessionsData?.reduce((acc, session) => {
        const date = new Date(session.scheduled_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        acc[weekKey] = (acc[weekKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const weeklyIntensity = Object.values(weeksData).reduce((sum, count) => sum + count, 0) / Math.max(Object.keys(weeksData).length, 1);

      // Get coach utilization
      const { data: coachSessionsData, error: coachSessionsError } = await supabase
        .from('training_sessions')
        .select('coach_id')
        .gte('scheduled_at', thirtyDaysAgo.toISOString().split('T')[0]);

      if (coachSessionsError) throw coachSessionsError;

      const uniqueCoaches = new Set(coachSessionsData?.map(s => s.coach_id).filter(Boolean));
      const coachUtilization = uniqueCoaches.size;

      // Get attendance trends (last 7 days)
      const attendanceTrends: Array<{ date: string; attendanceRate: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { data: dayAttendance } = await supabase
          .from('training_attendance')
          .select('attended, training_sessions!inner(scheduled_at)')
          .eq('training_sessions.scheduled_at', dateStr);

        const totalForDay = dayAttendance?.length || 0;
        const attendedForDay = dayAttendance?.filter(a => a.attended).length || 0;
        const rate = totalForDay > 0 ? (attendedForDay / totalForDay) * 100 : 0;

        attendanceTrends.push({
          date: dateStr,
          attendanceRate: rate,
        });
      }

      // Get peak training times
      const { data: peakTimesData, error: peakTimesError } = await supabase
        .from('training_sessions')
        .select('scheduled_at')
        .gte('scheduled_at', thirtyDaysAgo.toISOString().split('T')[0]);

      if (peakTimesError) throw peakTimesError;

      const peakTimes = peakTimesData?.reduce((acc, session) => {
        const dt = new Date(session.scheduled_at);
        const hour = dt.getHours();
        const day = dt.toLocaleDateString('en-US', { weekday: 'long' });
        const key = `${hour}-${day}`;

        if (!acc[key]) {
          acc[key] = { hour, day, sessionCount: 0 };
        }
        acc[key].sessionCount++;
        return acc;
      }, {} as Record<string, { hour: number; day: string; sessionCount: number }>) || {};

      const peakTrainingTimes = Object.values(peakTimes)
        .sort((a, b) => b.sessionCount - a.sessionCount)
        .slice(0, 10);

      return {
        totalAthletes: athletesData?.length || 0,
        activeAthletes: uniqueActiveAthletes.size,
        completionRate: Math.round(completionRate * 10) / 10,
        avgSessionTime: Math.round(avgSessionTime * 10) / 10,
        activeSessions: activeSessionsData?.length || 0,
        upcomingSessions: upcomingSessionsData?.length || 0,
        monthlyTrainingHours: Math.round(monthlyHours * 10) / 10,
        weeklyIntensity: Math.round(weeklyIntensity * 10) / 10,
        coachUtilization,
        trainingTypeDistribution,
        attendanceTrends,
        peakTrainingTimes,
      };
    },
    enabled: !!profile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};