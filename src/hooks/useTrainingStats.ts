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
      // Pre-compute date strings needed for query filters
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const today = new Date().toISOString().split('T')[0];

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      // ── Round 1: all independent queries in parallel ───────────────────────
      const [
        athletesRes,
        activeAthletesRes,
        attendanceRes,
        sessionsRes,
        activeSessionsRes,
        upcomingSessionsRes,
        monthlySessionsRes,
      ] = await Promise.all([
        supabase.from('athletes').select('id').eq('status', 'active'),
        supabase
          .from('training_attendance')
          .select('athlete_id, training_sessions!inner(scheduled_at)')
          .eq('attended', true),
        supabase
          .from('training_attendance')
          .select('attended, training_sessions!inner(scheduled_at)'),
        supabase.from('training_sessions').select('duration_minutes'),
        supabase.from('training_sessions').select('id').gte('scheduled_at', today),
        supabase
          .from('training_sessions')
          .select('id')
          .gte('scheduled_at', today)
          .lte('scheduled_at', nextWeekStr),
        supabase
          .from('training_sessions')
          .select('duration_minutes')
          .gte('scheduled_at', firstDayOfMonth)
          .lte('scheduled_at', today),
      ]);

      if (athletesRes.error)       throw athletesRes.error;
      if (activeAthletesRes.error) throw activeAthletesRes.error;
      if (attendanceRes.error)     throw attendanceRes.error;
      if (sessionsRes.error)       throw sessionsRes.error;
      if (activeSessionsRes.error) throw activeSessionsRes.error;
      if (upcomingSessionsRes.error) throw upcomingSessionsRes.error;
      if (monthlySessionsRes.error) throw monthlySessionsRes.error;

      // ── Round 2: last 30-day session queries (share same filter) ──────────
      // scheduledAtRes is reused for both weeklyIntensity and peakTrainingTimes.
      const [trainingTypesRes, scheduledAtRes, coachSessionsRes] = await Promise.all([
        supabase.from('training_sessions').select('training_type').gte('scheduled_at', thirtyDaysAgoStr),
        supabase.from('training_sessions').select('scheduled_at').gte('scheduled_at', thirtyDaysAgoStr),
        supabase.from('training_sessions').select('coach_id').gte('scheduled_at', thirtyDaysAgoStr),
      ]);

      if (trainingTypesRes.error)  throw trainingTypesRes.error;
      if (scheduledAtRes.error)    throw scheduledAtRes.error;
      if (coachSessionsRes.error)  throw coachSessionsRes.error;

      // ── Derive values from fetched data ───────────────────────────────────

      // Active athletes (attended in last 30 days)
      const uniqueActiveAthletes = new Set(
        (activeAthletesRes.data ?? [])
          .filter(a => {
            const s = a.training_sessions as { scheduled_at: string } | null;
            return (s?.scheduled_at ?? '').slice(0, 10) >= thirtyDaysAgoStr;
          })
          .map(a => a.athlete_id)
      );

      // Completion rate
      const recentAttendance = (attendanceRes.data ?? []).filter(a => {
        const s = a.training_sessions as { scheduled_at: string } | null;
        return (s?.scheduled_at ?? '').slice(0, 10) >= thirtyDaysAgoStr;
      });
      const totalAttendanceRecords = recentAttendance.length;
      const attendedRecords = recentAttendance.filter(a => a.attended).length;
      const completionRate = totalAttendanceRecords > 0 ? (attendedRecords / totalAttendanceRecords) * 100 : 0;

      // Average session time
      let totalMinutes = 0;
      let sessionCount = 0;
      sessionsRes.data?.forEach(session => {
        totalMinutes += session.duration_minutes ?? 0;
        sessionCount++;
      });
      const avgSessionTime = sessionCount > 0 ? totalMinutes / sessionCount / 60 : 0;

      // Monthly hours
      const monthlyHours = (monthlySessionsRes.data ?? []).reduce((sum, session) => {
        return sum + (session.duration_minutes ?? 0) / 60;
      }, 0);

      // Training type distribution
      const typeDistribution = (trainingTypesRes.data ?? []).reduce((acc, session) => {
        const type = session.training_type;
        acc[type] = (acc[type] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalSessions = Object.values(typeDistribution).reduce((sum, count) => sum + count, 0);
      const trainingTypeDistribution = Object.entries(typeDistribution).map(([type, count]) => ({
        type,
        count,
        percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
      }));

      // Weekly intensity
      const weeksData = (scheduledAtRes.data ?? []).reduce((acc, session) => {
        const date = new Date(session.scheduled_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        acc[weekKey] = (acc[weekKey] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const weeklyIntensity = Object.values(weeksData).reduce((sum, count) => sum + count, 0) / Math.max(Object.keys(weeksData).length, 1);

      // Coach utilization
      const uniqueCoaches = new Set((coachSessionsRes.data ?? []).map(s => s.coach_id).filter(Boolean));
      const coachUtilization = uniqueCoaches.size;

      // Attendance trends (last 7 days) — reuse attendanceRes data
      const weekAttendance = attendanceRes.data ?? [];
      const attendanceTrends = Array.from({ length: 7 }, (_, idx) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - idx));
        const dateStr = date.toISOString().split('T')[0];

        const dayRecords = weekAttendance.filter(a => {
          const s = a.training_sessions as { scheduled_at: string } | null;
          return s?.scheduled_at?.startsWith(dateStr);
        });

        const total = dayRecords.length;
        const attended = dayRecords.filter(a => a.attended).length;
        return {
          date: dateStr,
          attendanceRate: total > 0 ? (attended / total) * 100 : 0,
        };
      });

      // Peak training times
      const peakTimes = (scheduledAtRes.data ?? []).reduce((acc, session) => {
        const dt = new Date(session.scheduled_at);
        const hour = dt.getHours();
        const day = dt.toLocaleDateString('en-US', { weekday: 'long' });
        const key = `${hour}-${day}`;

        if (!acc[key]) {
          acc[key] = { hour, day, sessionCount: 0 };
        }
        acc[key].sessionCount++;
        return acc;
      }, {} as Record<string, { hour: number; day: string; sessionCount: number }>);

      const peakTrainingTimes = Object.values(peakTimes)
        .sort((a, b) => b.sessionCount - a.sessionCount)
        .slice(0, 10);

      return {
        totalAthletes: athletesRes.data?.length ?? 0,
        activeAthletes: uniqueActiveAthletes.size,
        completionRate: Math.round(completionRate * 10) / 10,
        avgSessionTime: Math.round(avgSessionTime * 10) / 10,
        activeSessions: activeSessionsRes.data?.length ?? 0,
        upcomingSessions: upcomingSessionsRes.data?.length ?? 0,
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