import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TrendingDown, TrendingUp, Minus, Star, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatTimeMs, formatImprovement } from '@/lib/time-formatter';
import { useTimeRecords, useRaceEvents, useDeleteTimeRecord } from '@/hooks/useTimeRecords';

interface Props {
  athleteId: string;
  athleteName?: string;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.is_personal_best) {
    return <polygon points={`${cx},${cy - 6} ${cx + 5},${cy + 4} ${cx - 5},${cy + 4}`} fill="#f59e0b" stroke="#d97706" strokeWidth={1} />;
  }
  return <circle cx={cx} cy={cy} r={3} fill="#6366f1" />;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-medium mb-1">{new Date(d.recorded_at).toLocaleDateString('es-CO')}</p>
      <p className="font-mono text-primary font-semibold">{formatTimeMs(d.time_ms)}s</p>
      {d.is_personal_best && (
        <Badge variant="default" className="mt-1 text-[10px] bg-amber-500 hover:bg-amber-500">
          <Star className="h-2.5 w-2.5 mr-0.5" /> Récord personal
        </Badge>
      )}
      {d.position && <p className="text-muted-foreground mt-1">Posición: {d.position}°</p>}
      {d.conditions && <p className="text-muted-foreground">Condiciones: {d.conditions}</p>}
    </div>
  );
};

export function TimeHistoryChart({ athleteId, athleteName }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const { data: raceEvents = [] } = useRaceEvents();
  const { data: records = [], isLoading } = useTimeRecords(athleteId, selectedEvent || undefined);
  const deleteRecord = useDeleteTimeRecord();

  const filteredRecords = selectedEvent
    ? records.filter(r => r.race_event_id === selectedEvent)
    : records;

  // Chart data: sorted by date, y axis = time_ms (lower = better)
  const chartData = [...filteredRecords]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map(r => ({
      ...r,
      date_label: new Date(r.recorded_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      time_seconds: r.time_ms / 1000,
    }));

  const bestRecord = filteredRecords.find(r => r.is_personal_best);
  const firstRecord = chartData[0];
  const latestRecord = chartData[chartData.length - 1];

  const improvement = firstRecord && latestRecord && firstRecord.id !== latestRecord.id
    ? formatImprovement(latestRecord.time_ms, firstRecord.time_ms)
    : null;

  const trend = firstRecord && latestRecord
    ? latestRecord.time_ms < firstRecord.time_ms ? 'mejora' : latestRecord.time_ms > firstRecord.time_ms ? 'desmejora' : 'igual'
    : null;

  return (
    <div className="space-y-4">
      {/* Selector de prueba */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Todas las pruebas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las pruebas</SelectItem>
            {raceEvents.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filteredRecords.length > 0 && (
          <span className="text-sm text-muted-foreground">{filteredRecords.length} registros</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando historial...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingDown className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium">Sin registros de tiempo</p>
          <p className="text-sm">Registra el primer tiempo para ver la evolución</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Récord Personal</p>
              <p className="font-mono text-lg font-bold text-primary">
                {bestRecord ? formatTimeMs(bestRecord.time_ms) + 's' : '—'}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Último tiempo</p>
              <p className="font-mono text-lg font-bold">
                {latestRecord ? formatTimeMs(latestRecord.time_ms) + 's' : '—'}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Primer tiempo</p>
              <p className="font-mono text-lg font-bold text-muted-foreground">
                {firstRecord ? formatTimeMs(firstRecord.time_ms) + 's' : '—'}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Evolución</p>
              <div className="flex items-center gap-1 mt-0.5">
                {trend === 'mejora' && <TrendingDown className="h-4 w-4 text-emerald-500" />}
                {trend === 'desmejora' && <TrendingUp className="h-4 w-4 text-destructive" />}
                {trend === 'igual' && <Minus className="h-4 w-4 text-muted-foreground" />}
                <span className={`text-sm font-semibold ${trend === 'mejora' ? 'text-emerald-600' : trend === 'desmejora' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {improvement ?? '—'}
                </span>
              </div>
            </Card>
          </div>

          {/* Gráfica */}
          {chartData.length >= 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Evolución de tiempos</CardTitle>
                <CardDescription className="text-xs">
                  El triángulo amarillo indica récord personal. Eje Y: menor es mejor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date_label"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={v => `${v}s`}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                      reversed={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {bestRecord && (
                      <ReferenceLine
                        y={bestRecord.time_ms / 1000}
                        stroke="#f59e0b"
                        strokeDasharray="4 2"
                        label={{ value: 'PB', position: 'insideTopRight', fontSize: 10, fill: '#d97706' }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="time_seconds"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={<CustomDot />}
                      activeDot={{ r: 5 }}
                      name="Tiempo (s)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tabla historial */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Historial completo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {[...filteredRecords]
                  .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                  .map(r => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-sm">{formatTimeMs(r.time_ms)}s</span>
                          {r.is_personal_best && (
                            <Badge className="text-[10px] h-4 px-1.5 bg-amber-500 hover:bg-amber-500">
                              <Star className="h-2.5 w-2.5 mr-0.5" /> PB
                            </Badge>
                          )}
                          {r.is_club_record && (
                            <Badge variant="default" className="text-[10px] h-4 px-1.5">CR</Badge>
                          )}
                          {r.position && (
                            <span className="text-xs text-muted-foreground">{r.position}°</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{new Date(r.recorded_at).toLocaleDateString('es-CO')}</span>
                          {r.race_events?.name && (
                            <span>{r.race_events.name}</span>
                          )}
                          {r.conditions && <span>{r.conditions}</span>}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                        aria-label="Eliminar registro"
                        onClick={() => deleteRecord.mutate({
                          id: r.id,
                          athleteId: r.athlete_id,
                          raceEventId: r.race_event_id,
                        })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
