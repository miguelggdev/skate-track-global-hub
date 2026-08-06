import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
  training_type: string;
  location: string | null;
}

interface AthleteData {
  success: boolean;
  error?: string;
  id: string;
  first_name: string;
  last_name: string;
  category: string;
  level: string;
}

export default function Checkin() {
  const { token } = useParams<{ token: string }>();
  const [checking, setChecking] = useState(false);
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const {
    data: athleteInfo,
    isLoading: loadingAthlete,
    isError: athleteError,
  } = useQuery({
    queryKey: ['checkin-athlete', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_athlete_by_checkin_token', { p_token: token });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Atleta no encontrado');
      return data as AthleteData;
    },
    enabled: !!token,
    retry: 2,
    staleTime: 30_000,
  });

  const {
    data: sessions = [],
    isLoading: loadingSessions,
    isError: sessionsError,
  } = useQuery({
    queryKey: ['public-sessions-today', token],
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
    enabled: !!athleteInfo && !athleteError,
    retry: 2,
    staleTime: 60_000,
  });

  const isLoading = loadingAthlete || loadingSessions;
  const isError = athleteError || sessionsError;

  const handleCheckin = async (session: Session) => {
    if (!token) return;
    setChecking(true);
    setCheckError(null);
    try {
      const { data } = await supabase.rpc('athlete_checkin', {
        p_token: token,
        p_session_id: session.id,
      });
      const result = data as { success: boolean; error?: string; athlete_name?: string };
      if (result.success) {
        setCheckedIn(session.title || session.training_type);
      } else {
        setCheckError(result.error ?? 'Error al registrar asistencia');
      }
    } catch {
      setCheckError('Error de conexión');
    } finally {
      setChecking(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const formatType = (t: string) =>
    t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="font-semibold">QR no válido</p>
            <p className="text-sm text-muted-foreground">
              No se pudo cargar la información. Intenta escanear el código QR nuevamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <div>
              <p className="text-xl font-bold text-emerald-500">¡Asistencia registrada!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {athleteInfo?.first_name} {athleteInfo?.last_name}
              </p>
              <p className="text-sm font-medium mt-2">{checkedIn}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        {/* Athlete card */}
        <Card>
          <CardHeader className="text-center pb-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-3xl">⛸️</span>
            </div>
            <CardTitle>{athleteInfo?.first_name} {athleteInfo?.last_name}</CardTitle>
            <CardDescription>
              {athleteInfo?.category} · {athleteInfo?.level?.replace(/_/g, ' ')}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Session selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Sesiones de hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay sesiones programadas para hoy
              </p>
            ) : (
              sessions.map(s => (
                <Button
                  key={s.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4"
                  disabled={checking}
                  onClick={() => handleCheckin(s)}
                >
                  <div className="text-left">
                    <p className="font-medium text-sm">{formatType(s.training_type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(s.scheduled_at)}{s.location ? ` · ${s.location}` : ''}
                    </p>
                  </div>
                  {checking && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                </Button>
              ))
            )}
            {checkError && (
              <p className="text-xs text-destructive text-center">{checkError}</p>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          SpeedSkate Academy — Sistema de asistencia
        </p>
      </div>
    </div>
  );
}
