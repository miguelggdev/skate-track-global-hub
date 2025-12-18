import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrainingSession {
  id: string;
  date: string;
  training_type: string;
  start_time: string;
  end_time: string;
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
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [competitionResults, setCompetitionResults] = useState<CompetitionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<{ year: number; month?: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth()
  });

  const fetchData = async () => {
    if (!athleteId) {
      setLoading(false);
      setTrainingSessions([]);
      setAttendanceRecords([]);
      setCompetitionResults([]);
      return;
    }

    try {
      // Fetch attendance records with training session info - strictly filtered by athlete_id
      const { data: attendance, error: attendanceError } = await supabase
        .from('training_attendance')
        .select(`
          *,
          training_sessions (
            id, date, training_type, start_time, end_time
          )
        `)
        .eq('athlete_id', athleteId)
        .eq('attended', true);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
      }

      setAttendanceRecords(attendance || []);

      // Extract unique training sessions from athlete's own attendance
      const sessions = (attendance || [])
        .map(a => a.training_sessions)
        .filter(Boolean);
      setTrainingSessions(sessions);

      // Fetch competition results - RLS now enforces athlete can only see their own
      const { data: results, error: resultsError } = await supabase
        .from('competition_results')
        .select(`
          id, competition_id, position, medal_type,
          competitions (name, start_date, category, location)
        `)
        .eq('athlete_id', athleteId);

      if (resultsError) {
        console.error('Error fetching competition results:', resultsError);
      }

      setCompetitionResults(results || []);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const { year, month } = dateFilter;

    const filterByDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const matchesYear = date.getFullYear() === year;
      const matchesMonth = month === undefined || date.getMonth() === month;
      return matchesYear && matchesMonth;
    };

    const filteredSessions = trainingSessions.filter(s => filterByDate(s.date));
    const filteredCompetitions = competitionResults.filter(r => 
      r.competitions && filterByDate(r.competitions.start_date)
    );

    // Calculate hours
    const totalHours = filteredSessions.reduce((acc, s) => {
      const start = s.start_time.split(':').map(Number);
      const end = s.end_time.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return acc + (endMinutes - startMinutes) / 60;
    }, 0);

    // Sessions by type
    const byType = {
      pista: filteredSessions.filter(s => s.training_type === 'pista').length,
      ruta: filteredSessions.filter(s => s.training_type === 'ruta').length,
      gym: filteredSessions.filter(s => s.training_type === 'gimnasio').length,
      other: filteredSessions.filter(s => !['pista', 'ruta', 'gimnasio'].includes(s.training_type)).length
    };

    // Calculate weeks in period
    const weeksInPeriod = month !== undefined ? 4 : 52;
    const avgPerWeek = filteredSessions.length / weeksInPeriod;

    // Medals count
    const medals = {
      gold: filteredCompetitions.filter(r => r.medal_type === 'gold').length,
      silver: filteredCompetitions.filter(r => r.medal_type === 'silver').length,
      bronze: filteredCompetitions.filter(r => r.medal_type === 'bronze').length
    };

    return {
      totalSessions: filteredSessions.length,
      totalHours: Math.round(totalHours * 10) / 10,
      sessionsByType: byType,
      avgSessionsPerWeek: Math.round(avgPerWeek * 10) / 10,
      competitionCount: filteredCompetitions.length,
      medals,
      competitions: filteredCompetitions
    };
  }, [trainingSessions, competitionResults, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [athleteId]);

  return {
    ...filteredData,
    loading,
    dateFilter,
    setDateFilter,
    refetch: fetchData
  };
};
