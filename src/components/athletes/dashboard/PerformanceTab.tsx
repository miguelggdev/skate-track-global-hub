import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Trophy, TrendingUp, Timer, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimeRecord {
  id: string;
  race_event_id: string;
  time_ms: number;
  time_formatted: string | null;
  is_personal_best: boolean;
  recorded_at: string;
  competition_id: string | null;
  race_events: { name: string } | null;
  competitions: { name: string } | null;
}

const formatMs = (ms: number): string => {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
  }
  return `${seconds.toFixed(3)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="font-semibold text-sm">{formatMs(payload[0].value * 1000)}</p>
        {payload[0].payload.is_personal_best && (
          <Badge className="mt-1 text-xs bg-yellow-500/20 text-yellow-700 border-yellow-400">
            <Star className="h-3 w-3 mr-1" />
            Récord Personal
          </Badge>
        )}
      </div>
    );
  }
  return null;
};

export const PerformanceTab = () => {
  const { athlete } = useCurrentAthlete();
  const [selectedEvent, setSelectedEvent] = useState<string>('all');

  const { data: timeRecords = [], isLoading } = useQuery({
    queryKey: ['athlete-time-records', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];
      const { data, error } = await supabase
        .from('time_records')
        .select(`
          id, race_event_id, time_ms, time_formatted, is_personal_best, recorded_at,
          competition_id,
          race_events ( name ),
          competitions ( name )
        `)
        .eq('athlete_id', athlete.id)
        .order('recorded_at', { ascending: false });
      if (error) throw error;
      return data as TimeRecord[];
    },
    enabled: !!athlete?.id,
  });

  // Group records by event
  const eventMap = new Map<string, { eventId: string; eventName: string; records: TimeRecord[] }>();
  for (const rec of timeRecords) {
    if (!rec.race_event_id || !rec.race_events) continue;
    if (!eventMap.has(rec.race_event_id)) {
      eventMap.set(rec.race_event_id, {
        eventId: rec.race_event_id,
        eventName: rec.race_events.name,
        records: [],
      });
    }
    eventMap.get(rec.race_event_id)!.records.push(rec);
  }

  const events = Array.from(eventMap.values());

  // Personal bests per event
  const personalBests = events.map(e => {
    const pb = e.records.find(r => r.is_personal_best)
      ?? e.records.reduce((best, r) => (!best || r.time_ms < best.time_ms ? r : best), e.records[0]);
    return { ...e, pb };
  }).filter(e => e.pb);

  // Progression chart data for selected event
  const selectedEventData = selectedEvent === 'all' ? null : eventMap.get(selectedEvent);
  const chartData = selectedEventData
    ? [...selectedEventData.records]
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .map(r => ({
          date: format(new Date(r.recorded_at), 'dd/MM/yy', { locale: es }),
          seconds: r.time_ms / 1000,
          is_personal_best: r.is_personal_best,
          competition: r.competitions?.name,
        }))
    : [];

  const pbInChart = chartData.length > 0 ? Math.min(...chartData.map(d => d.seconds)) : null;

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
      {/* Personal Bests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Marcas Personales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personalBests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Timer className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aún no hay marcas registradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {personalBests.map(({ eventId, eventName, pb }) => (
                <div
                  key={eventId}
                  className="border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-background hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{eventName}</span>
                    {pb.is_personal_best && (
                      <Badge className="text-xs bg-yellow-500/20 text-yellow-700 border-yellow-400">
                        <Star className="h-3 w-3 mr-1" />
                        PR
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold font-mono text-primary">
                    {pb.time_formatted || formatMs(pb.time_ms)}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(pb.recorded_at), 'dd MMM yyyy', { locale: es })}
                    </p>
                    {pb.competitions?.name && (
                      <p className="text-xs text-muted-foreground truncate" title={pb.competitions.name}>
                        {pb.competitions.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progression Chart */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Progresión de Tiempos
              </CardTitle>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecciona prueba" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(e => (
                    <SelectItem key={e.eventId} value={e.eventId}>
                      {e.eventName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedEventData ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Selecciona una prueba para ver la progresión
              </div>
            ) : chartData.length < 2 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Se necesitan al menos 2 registros para mostrar la progresión
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => `${v}s`}
                      className="text-muted-foreground"
                      domain={['auto', 'auto']}
                      reversed
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {pbInChart && (
                      <ReferenceLine
                        y={pbInChart}
                        stroke="hsl(var(--chart-4))"
                        strokeDasharray="4 2"
                        label={{ value: 'Mejor marca', position: 'insideTopRight', fontSize: 11 }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="seconds"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return payload.is_personal_best ? (
                          <circle key={props.key} cx={cx} cy={cy} r={6} fill="hsl(48 96% 53%)" stroke="white" strokeWidth={2} />
                        ) : (
                          <circle key={props.key} cx={cx} cy={cy} r={3} fill="hsl(var(--primary))" />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
