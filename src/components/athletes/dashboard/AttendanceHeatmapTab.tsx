import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { CalendarCheck, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, getMonth, getYear, subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';

const MONTHS_BACK = 6;

const WEEKDAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

interface AttendanceRow {
  attended: boolean;
  training_sessions: {
    scheduled_at: string;
    training_type: string;
  } | null;
}

const useAttendanceData = (athleteId: string | null) =>
  useQuery({
    queryKey: ['athlete-attendance-heatmap', athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      const { data, error } = await supabase
        .from('training_attendance')
        .select('attended, training_sessions(scheduled_at, training_type)')
        .eq('athlete_id', athleteId);
      if (error) throw error;
      return data as AttendanceRow[];
    },
    enabled: !!athleteId,
  });

export const AttendanceHeatmapTab = () => {
  const { athlete } = useCurrentAthlete();
  const { data: rows = [], isLoading } = useAttendanceData(athlete?.id ?? null);

  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const yearOptions = [viewYear - 1, viewYear, viewYear + 1].filter(y => y <= new Date().getFullYear() + 1);

  // Build attendance set: "YYYY-MM-DD" -> attended boolean
  const attendanceMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const r of rows) {
      if (r.training_sessions?.scheduled_at) {
        const dateKey = r.training_sessions.scheduled_at.split('T')[0];
        const existing = map.get(dateKey);
        map.set(dateKey, existing === true ? true : r.attended);
      }
    }
    return map;
  }, [rows]);

  // Last 6 months data for heatmap
  const heatmapMonths = useMemo(() => {
    const months = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
      months.push({ month, days });
    }
    return months;
  }, []);

  // Monthly % trend for bar chart
  const monthlyStats = useMemo(() => {
    return heatmapMonths.map(({ month, days }) => {
      const daysWithSession = days.filter(d => {
        const key = format(d, 'yyyy-MM-dd');
        return attendanceMap.has(key);
      });
      const attended = daysWithSession.filter(d => attendanceMap.get(format(d, 'yyyy-MM-dd')) === true).length;
      const total = daysWithSession.length;
      return {
        month: format(month, 'MMM', { locale: es }),
        pct: total > 0 ? Math.round((attended / total) * 100) : 0,
        attended,
        total,
      };
    });
  }, [heatmapMonths, attendanceMap]);

  const avgPct = monthlyStats.length > 0
    ? Math.round(monthlyStats.reduce((s, m) => s + m.pct, 0) / monthlyStats.length)
    : 0;

  const getDayColor = (dateStr: string) => {
    if (!attendanceMap.has(dateStr)) return 'bg-muted/30';
    return attendanceMap.get(dateStr) ? 'bg-green-500' : 'bg-red-400';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-primary">{avgPct}%</p>
            <p className="text-xs text-muted-foreground">Asistencia promedio</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-600">
              {rows.filter(r => r.attended).length}
            </p>
            <p className="text-xs text-muted-foreground">Sesiones asistidas</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-muted-foreground">{rows.length}</p>
            <p className="text-xs text-muted-foreground">Total sesiones</p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-green-500" />
            Mapa de Asistencia — Últimos {MONTHS_BACK} meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 items-center flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-muted-foreground">Asistió</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-sm bg-red-400" />
              <span className="text-muted-foreground">Faltó</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-sm bg-muted/30 border" />
              <span className="text-muted-foreground">Sin sesión</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-4">
              {heatmapMonths.map(({ month, days }) => {
                const firstWeekday = getDay(days[0]);
                return (
                  <div key={format(month, 'yyyy-MM')} className="flex-shrink-0">
                    <p className="text-xs font-medium text-center mb-2 text-muted-foreground capitalize">
                      {format(month, 'MMM', { locale: es })}
                    </p>
                    <div className="grid grid-cols-7 gap-0.5">
                      {WEEKDAY_LABELS.map(d => (
                        <div key={d} className="w-5 h-4 flex items-center justify-center text-[9px] text-muted-foreground">
                          {d}
                        </div>
                      ))}
                      {Array.from({ length: firstWeekday }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-5 h-5" />
                      ))}
                      {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        return (
                          <div
                            key={dateStr}
                            title={dateStr}
                            className={`w-5 h-5 rounded-sm ${getDayColor(dateStr)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly trend bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Porcentaje de Asistencia por Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground capitalize" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(v: number, _: any, props: any) =>
                    [`${v}% (${props.payload.attended}/${props.payload.total})`, 'Asistencia']
                  }
                />
                <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
