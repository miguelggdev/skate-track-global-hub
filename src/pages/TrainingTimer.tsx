import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Flag, Timer, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';

interface TrainingSession { id: string; title: string; scheduled_at: string; training_type: string; }
interface RaceEvent { id: string; name: string; event_type: string; distance_m: number | null; }
interface AthleteRow { athlete_id: string; athletes: { id: string; first_name: string; last_name: string; }; }

interface LapEntry {
  athleteId: string;
  name: string;
  ms: number;
  saved: boolean;
}

function msToDisplay(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const cent = Math.floor((ms % 1000) / 10);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cent).padStart(2, '0')}`;
}

function msToFormatted(ms: number): string {
  return msToDisplay(ms);
}

export default function TrainingTimer() {
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedSession, setSelectedSession] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<LapEntry[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const baseElapsedRef = useRef<number>(0);

  // Today's sessions
  const { data: sessions = [] } = useQuery<TrainingSession[]>({
    queryKey: ['timer-sessions'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id, title, scheduled_at, training_type')
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .order('scheduled_at');
      if (error) throw error;
      return (data ?? []) as TrainingSession[];
    },
  });

  // Race events
  const { data: events = [] } = useQuery<RaceEvent[]>({
    queryKey: ['race-events-timer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('race_events')
        .select('id, name, event_type, distance_m')
        .order('name');
      if (error) throw error;
      return (data ?? []) as RaceEvent[];
    },
  });

  // Athletes for selected session
  const { data: athletes = [] } = useQuery<AthleteRow[]>({
    queryKey: ['timer-athletes', selectedSession],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_attendance')
        .select('athlete_id, athletes(id, first_name, last_name)')
        .eq('training_session_id', selectedSession);
      if (error) throw error;
      return (data ?? []) as unknown as AthleteRow[];
    },
    enabled: !!selectedSession,
  });

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(baseElapsedRef.current + (Date.now() - startTimeRef.current));
    }, 10);
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    baseElapsedRef.current += Date.now() - startTimeRef.current;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    baseElapsedRef.current = 0;
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const markLap = (athleteId: string, name: string) => {
    const currentMs = running
      ? baseElapsedRef.current + (Date.now() - startTimeRef.current)
      : elapsed;
    setLaps(prev => [{ athleteId, name, ms: currentMs, saved: false }, ...prev]);
  };

  const saveTimeMutation = useMutation({
    mutationFn: async (lap: LapEntry) => {
      if (!selectedEvent) throw new Error('Selecciona una prueba primero');
      const { error } = await supabase.from('time_records').insert({
        athlete_id: lap.athleteId,
        race_event_id: selectedEvent,
        session_id: selectedSession || null,
        time_ms: lap.ms,
        time_formatted: msToFormatted(lap.ms),
      });
      if (error) throw error;
      return lap;
    },
    onSuccess: (lap) => {
      setLaps(prev => prev.map(l => l === lap || (l.athleteId === lap.athleteId && l.ms === lap.ms) ? { ...l, saved: true } : l));
      qc.invalidateQueries({ queryKey: ['time-records'] });
      toast({ title: `Tiempo guardado — ${lap.name}` });
    },
    onError: (err) => toast({ title: err instanceof Error ? err.message : 'Error al guardar', variant: 'destructive' }),
  });

  const formatType = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <DashboardLayout title="Cronómetro de Entrenamiento" userRole={profile?.role ?? 'coach'}>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Config row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sesión</label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger><SelectValue placeholder="Seleccionar sesión de hoy" /></SelectTrigger>
              <SelectContent>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {formatType(s.training_type)} — {new Date(s.scheduled_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Prueba</label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger><SelectValue placeholder="Seleccionar prueba" /></SelectTrigger>
              <SelectContent>
                {events.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stopwatch */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-6">
              <div className={cn(
                'text-7xl sm:text-8xl font-mono font-bold tabular-nums tracking-tight transition-colors',
                running ? 'text-primary' : 'text-foreground'
              )}>
                {msToDisplay(elapsed)}
              </div>
              <div className="flex justify-center gap-3">
                {!running ? (
                  <Button onClick={start} size="lg" className="h-12 px-8 gap-2">
                    <Play className="h-5 w-5" /> {elapsed > 0 ? 'Continuar' : 'Iniciar'}
                  </Button>
                ) : (
                  <Button onClick={pause} size="lg" variant="outline" className="h-12 px-8 gap-2">
                    <Pause className="h-5 w-5" /> Pausar
                  </Button>
                )}
                <Button onClick={reset} size="lg" variant="ghost" className="h-12 px-6 gap-2" disabled={elapsed === 0 && !running}>
                  <Square className="h-5 w-5" /> Reiniciar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Athletes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flag className="h-4 w-4" /> Marcar tiempo por atleta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSession ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Selecciona una sesión para ver los atletas
                </p>
              ) : athletes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay atletas en esta sesión
                </p>
              ) : (
                <div className="space-y-2">
                  {athletes.map(a => (
                    <Button
                      key={a.athlete_id}
                      variant="outline"
                      className="w-full justify-between h-11"
                      onClick={() => markLap(a.athlete_id, `${a.athletes.first_name} ${a.athletes.last_name}`)}
                    >
                      <span className="font-medium text-sm">
                        {a.athletes.first_name} {a.athletes.last_name}
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {msToDisplay(elapsed)}
                      </Badge>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Laps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Timer className="h-4 w-4" /> Tiempos marcados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {laps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Marca el tiempo de cada atleta al cruzar la meta
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {laps.map((lap, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{lap.name}</p>
                        <p className="font-mono text-base font-bold">{msToDisplay(lap.ms)}</p>
                      </div>
                      {lap.saved ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 shrink-0">
                          Guardado
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 shrink-0"
                          disabled={!selectedEvent || saveTimeMutation.isPending}
                          onClick={() => saveTimeMutation.mutate(lap)}
                        >
                          {saveTimeMutation.isPending
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Save className="h-3.5 w-3.5" />}
                          Guardar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
