import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2, Users, Calendar, Nfc, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { useNFC } from '@/hooks/useNFC';

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
  training_type: string;
  location: string | null;
}

interface AthleteAttendance {
  athlete_id: string;
  attended: boolean;
  check_in_time: string | null;
  athletes: {
    id: string;
    first_name: string;
    last_name: string;
    category: string;
  };
}

export default function TrainingCheckin() {
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [nfcMode, setNfcMode] = useState(false);
  const [lastScanned, setLastScanned] = useState<{ name: string; at: string } | null>(null);

  const { startScan, stopScan, isSupported: nfcSupported } = useNFC();

  // Today's sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<Session[]>({
    queryKey: ['training-checkin-sessions'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id, title, scheduled_at, training_type, location')
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .eq('status', 'scheduled')
        .order('scheduled_at');
      if (error) throw error;
      return (data ?? []) as Session[];
    },
    refetchInterval: 60_000,
  });

  // Athletes for selected session
  const { data: attendance = [], isLoading: loadingAthletes } = useQuery<AthleteAttendance[]>({
    queryKey: ['checkin-attendance', selectedSession?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_attendance')
        .select('athlete_id, attended, check_in_time, athletes(id, first_name, last_name, category)')
        .eq('training_session_id', selectedSession!.id);
      if (error) throw error;
      return (data ?? []) as unknown as AthleteAttendance[];
    },
    enabled: !!selectedSession,
    refetchInterval: 10_000,
  });

  // Ref so the NFC callback always reads the latest attendance array without re-running the effect
  const attendanceRef = useRef(attendance);
  useEffect(() => { attendanceRef.current = attendance; }, [attendance]);

  const toggleAttendance = useMutation({
    mutationFn: async ({ athleteId, attended }: { athleteId: string; attended: boolean }) => {
      const { error } = await supabase
        .from('training_attendance')
        .upsert({
          training_session_id: selectedSession!.id,
          athlete_id: athleteId,
          attended,
          check_in_time: attended ? new Date().toISOString() : null,
        }, { onConflict: 'training_session_id,athlete_id' });
      if (error) throw error;
    },
    onSuccess: (_, { attended, athleteId }) => {
      qc.invalidateQueries({ queryKey: ['checkin-attendance', selectedSession?.id] });
      const athlete = attendanceRef.current.find(a => a.athlete_id === athleteId);
      const name = athlete ? `${athlete.athletes.first_name} ${athlete.athletes.last_name}` : 'Atleta';
      toast({ title: attended ? `✓ ${name} — presente` : `${name} — marcado ausente` });
    },
    onError: () => toast({ title: 'Error al actualizar', variant: 'destructive' }),
  });

  // Reset NFC mode when session changes
  useEffect(() => {
    setNfcMode(false);
    setLastScanned(null);
  }, [selectedSession?.id]);

  // NFC scanning effect
  useEffect(() => {
    if (!nfcMode || !selectedSession) return;

    startScan(async (reading) => {
      let result: { success: boolean; athlete_name?: string; error?: string };

      try {
        if (reading.url && reading.url.includes('/checkin/')) {
          const token = reading.url.split('/checkin/')[1]?.split('?')[0];
          if (!token) {
            toast({ title: 'Token inválido en el tag', variant: 'destructive' });
            return;
          }
          const { data } = await supabase.rpc('athlete_checkin', {
            p_token: token,
            p_session_id: selectedSession.id,
          });
          result = data as typeof result;
        } else {
          const { data } = await supabase.rpc('athlete_checkin_by_nfc', {
            p_uid: reading.uid,
            p_session_id: selectedSession.id,
          });
          result = data as typeof result;
        }

        if (result.success) {
          const name = result.athlete_name ?? 'Atleta';
          const at = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
          setLastScanned({ name, at });
          qc.invalidateQueries({ queryKey: ['checkin-attendance', selectedSession.id] });
          toast({ title: `✓ ${name} — Presente`, description: at });
        } else {
          toast({ title: result.error ?? 'Error al registrar', variant: 'destructive' });
        }
      } catch {
        toast({ title: 'Error de conexión', variant: 'destructive' });
      }
    });

    return () => stopScan();
  }, [nfcMode, selectedSession?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const presentCount = attendance.filter(a => a.attended).length;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const formatType = (t: string) =>
    t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <DashboardLayout title="Control de Asistencia" userRole={profile?.role ?? 'coach'}>
      <div className="space-y-4">
        {/* Session selector */}
        {!selectedSession ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Sesiones de hoy
            </h2>
            {loadingSessions ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No hay sesiones programadas para hoy</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sessions.map(s => (
                  <Card
                    key={s.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedSession(s)}
                  >
                    <CardContent className="pt-5 pb-4">
                      <p className="font-semibold">{formatType(s.training_type)}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatTime(s.scheduled_at)}
                        {s.location ? ` · ${s.location}` : ''}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{formatType(selectedSession.training_type)}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatTime(selectedSession.scheduled_at)}
                  {selectedSession.location ? ` · ${selectedSession.location}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {presentCount} / {attendance.length} presentes
                </Badge>
                {nfcSupported ? (
                  <Button
                    variant={nfcMode ? 'default' : 'outline'}
                    size="sm"
                    className={cn('gap-2', nfcMode && 'bg-emerald-600 hover:bg-emerald-700 text-white')}
                    onClick={() => setNfcMode(m => !m)}
                  >
                    <Nfc className="h-4 w-4" />
                    {nfcMode ? 'NFC Activo' : 'Modo NFC'}
                  </Button>
                ) : (
                  <span
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    title="Web NFC solo está disponible en Chrome para Android. En iOS o escritorio, marca la asistencia tocando cada atleta."
                  >
                    <Info className="h-3.5 w-3.5" />
                    Toca cada atleta para marcar
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)}>
                  Cambiar sesión
                </Button>
              </div>
            </div>

            {/* Athletes grid */}
            {loadingAthletes ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : attendance.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No hay atletas registrados para esta sesión</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* NFC active banner */}
                {nfcMode && (
                  <div className="rounded-xl border-2 border-emerald-500 bg-emerald-500/10 px-4 py-3 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Nfc className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        Modo NFC activo
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500">
                        Acerca el teléfono al casco del deportista
                      </p>
                      {lastScanned && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Último: {lastScanned.name} · {lastScanned.at}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {attendance.map(a => (
                    <button
                      key={a.athlete_id}
                      onClick={() => toggleAttendance.mutate({ athleteId: a.athlete_id, attended: !a.attended })}
                      disabled={toggleAttendance.isPending}
                      className={cn(
                        'rounded-xl border-2 p-4 text-center transition-all active:scale-95',
                        a.attended
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-border bg-card hover:border-muted-foreground'
                      )}
                    >
                      <div className="flex justify-center mb-2">
                        {a.attended
                          ? <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                          : <Circle className="h-8 w-8 text-muted-foreground" />}
                      </div>
                      <p className="font-semibold text-sm leading-tight">
                        {a.athletes.first_name}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {a.athletes.last_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {a.athletes.category}
                      </p>
                      {a.attended && a.check_in_time && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          {new Date(a.check_in_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
