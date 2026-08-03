import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

interface HeatmapData {
  day: string;
  dayIndex: number;
  hour: number;
  intensity: number;
  sessionCount: number;
  totalAttendance: number;
  averageAttendance: number;
}

interface TrainingSession {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  training_type: string;
  title: string;
  max_athletes?: number;
  training_attendance: Array<{ id: string; attended: boolean; athlete_id: string }>;
}

export const useTrainingHeatmap = (viewMode: 'week' | 'month' = 'week') => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['training-heatmap', viewMode],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (viewMode === 'week') {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      const { data: sessions, error } = await supabase
        .from('training_sessions')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          training_type,
          title,
          max_athletes,
          training_attendance(
            id,
            attended,
            athlete_id
          )
        `)
        .gte('scheduled_at', format(startDate, 'yyyy-MM-dd'))
        .lte('scheduled_at', format(endDate, 'yyyy-MM-dd') + 'T23:59:59')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return sessions as TrainingSession[];
    },
  });

  const heatmapData = React.useMemo(() => {
    if (!data) return [];

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM
    const heatmap: HeatmapData[] = [];

    days.forEach((day, dayIndex) => {
      hours.forEach(hour => {
        heatmap.push({ day, dayIndex, hour, intensity: 0, sessionCount: 0, totalAttendance: 0, averageAttendance: 0 });
      });
    });

    data.forEach(session => {
      const dt = new Date(session.scheduled_at);
      const dayOfWeek = dt.getDay();
      const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const day = days[adjustedDayIndex];

      const startHour = dt.getHours();
      const durationHours = Math.ceil((session.duration_minutes || 60) / 60);
      const endHour = startHour + durationHours - 1;

      const attendanceCount = session.training_attendance?.filter(a => a.attended).length ?? 0;

      for (let hour = startHour; hour <= Math.min(endHour, 21); hour++) {
        const idx = heatmap.findIndex(h => h.day === day && h.hour === hour);
        if (idx !== -1) {
          heatmap[idx].sessionCount += 1;
          heatmap[idx].totalAttendance += attendanceCount;
        }
      }
    });

    heatmap.forEach(cell => {
      if (cell.sessionCount > 0) {
        cell.averageAttendance = Math.round(cell.totalAttendance / cell.sessionCount);
        const sessionIntensity = Math.min(cell.sessionCount * 25, 75);
        const attendanceBonus = Math.min(cell.averageAttendance * 2, 25);
        cell.intensity = Math.min(sessionIntensity + attendanceBonus, 100);
      }
    });

    return heatmap;
  }, [data]);

  const statistics = React.useMemo(() => {
    if (!data || data.length === 0) {
      return { totalSessions: 0, totalAttendance: 0, averageAttendance: 0, peakHour: 'N/A', peakDay: 'N/A', busiest: { day: 'N/A', hour: 'N/A', count: 0 } };
    }

    const totalSessions = data.length;
    const totalAttendance = data.reduce((sum, session) =>
      sum + (session.training_attendance?.filter(a => a.attended).length ?? 0), 0
    );
    const averageAttendance = totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0;

    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};
    const cellCounts: Record<string, number> = {};

    heatmapData.forEach(cell => {
      if (cell.sessionCount > 0) {
        hourCounts[cell.hour] = (hourCounts[cell.hour] ?? 0) + cell.sessionCount;
        dayCounts[cell.day] = (dayCounts[cell.day] ?? 0) + cell.sessionCount;
        cellCounts[`${cell.day}-${cell.hour}`] = cell.sessionCount;
      }
    });

    const peakHour = Object.entries(hourCounts).reduce(
      (max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max,
      { hour: 0, count: 0 }
    );
    const peakDay = Object.entries(dayCounts).reduce(
      (max, [day, count]) => count > max.count ? { day, count } : max,
      { day: 'N/A', count: 0 }
    );
    const busiest = Object.entries(cellCounts).reduce((max, [key, count]) => {
      const [day, hour] = key.split('-');
      return count > max.count ? { day, hour: parseInt(hour), count } : max;
    }, { day: 'N/A', hour: 0, count: 0 });

    return { totalSessions, totalAttendance, averageAttendance, peakHour: peakHour.hour > 0 ? `${peakHour.hour}:00` : 'N/A', peakDay: peakDay.day, busiest };
  }, [data, heatmapData]);

  return { heatmapData, statistics, isLoading, error, rawData: data ?? [] };
};
