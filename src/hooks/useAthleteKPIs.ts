import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrainingSession {
  id: string;
  scheduled_at: string;
  training_type: string;
  duration_minutes: number | null;
}

interface CompetitionResult {
  id: string;
  competition_id: string;
  position: number | null;
  medal_type: string | null;
  competitions: {
    name: string;
    start_date: string;
    category: string | null;
    location: string;
  };
}

export const useAthleteKPIs = (athleteId: string | null) => {
  const [dateFilter, setDateFilter] = useState<{ year: number; month?: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['athlete-kpis', athleteId],
    queryFn: async () => {
      const [attendanceRes, resultsRes] = await Promise.all([
        supabase
          .from('training_attendance')
          .select(`*, training_sessions(id, scheduled_at, training_type, duration_minutes)`)
          .eq('athlete_id', athleteId!)
          .eq('attended', true),
        supabase
          .from('competition_results')
          .select(`id, competition_id, position, medal_type, competitions(name, start_date, category, location)`)
          .eq('athlete_id', athleteId!),
      ]);

      const trainingSessions: TrainingSession[] = (attendanceRes.data ?? [])
        .map((a: any) => a.training_sessions)
        .filter(Boolean);

      return {
        trainingSessions,
        attendanceRecords: attendanceRes.data ?? [],
        competitionResults: (resultsRes.data ?? []) as CompetitionResult[],
      };
    },
    enabled: !!athleteId,
  });

  const trainingSessions    = data?.trainingSessions    ?? [];
  const competitionResults  = data?.competitionResults  ?? [];

  const filteredData = useMemo(() => {
    const { year, month } = dateFilter;

    const filterByDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getFullYear() === year && (month === undefined || d.getMonth() === month);
    };

    const filteredSessions     = trainingSessions.filter(s => filterByDate(s.scheduled_at));
    const filteredCompetitions = competitionResults.filter(
      r => r.competitions && filterByDate(r.competitions.start_date)
    );

    const totalHours = filteredSessions.reduce((acc, s) => {
      return acc + (s.duration_minutes || 0) / 60;
    }, 0);

    const byType = {
      pista: filteredSessions.filter(s => s.training_type === 'pista').length,
      ruta:  filteredSessions.filter(s => s.training_type === 'ruta').length,
      gym:   filteredSessions.filter(s => s.training_type === 'gimnasio').length,
      other: filteredSessions.filter(s => !['pista', 'ruta', 'gimnasio'].includes(s.training_type)).length,
    };

    const weeksInPeriod = month !== undefined ? 4 : 52;

    const medals = {
      gold:   filteredCompetitions.filter(r => r.medal_type === 'gold').length,
      silver: filteredCompetitions.filter(r => r.medal_type === 'silver').length,
      bronze: filteredCompetitions.filter(r => r.medal_type === 'bronze').length,
    };

    return {
      totalSessions:       filteredSessions.length,
      totalHours:          Math.round(totalHours * 10) / 10,
      sessionsByType:      byType,
      avgSessionsPerWeek:  Math.round((filteredSessions.length / weeksInPeriod) * 10) / 10,
      competitionCount:    filteredCompetitions.length,
      medals,
      competitions:        filteredCompetitions,
    };
  }, [trainingSessions, competitionResults, dateFilter]);

  return {
    ...filteredData,
    loading,
    dateFilter,
    setDateFilter,
    refetch,
  };
};
