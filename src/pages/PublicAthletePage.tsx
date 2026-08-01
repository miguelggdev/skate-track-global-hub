import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Calendar, Activity, AlertTriangle, CheckCircle2,
  Clock, MapPin, User, Shield, Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  escuela: 'Escuela', menores: 'Menores', transicion: 'Transición',
  prejuvenil: 'Prejuvenil', juvenil: 'Juvenil', mayores: 'Mayores',
  preclub: 'Preclub', adultos: 'Adultos',
};

const TRAINING_TYPE_LABELS: Record<string, string> = {
  technical: 'Técnico', physical: 'Físico', mental: 'Mental',
  recovery: 'Recuperación', gym: 'Gimnasio', road_skating: 'Patinaje Ruta',
  track_skating: 'Patinaje Pista', bicycle: 'Bicicleta',
  static_bicycle: 'Bicicleta Estática', simulator: 'Simulador',
};

const TRAINING_TYPE_COLORS: Record<string, string> = {
  technical: 'bg-blue-500', physical: 'bg-emerald-500', mental: 'bg-purple-500',
  recovery: 'bg-orange-500', gym: 'bg-red-500', road_skating: 'bg-cyan-500',
  track_skating: 'bg-indigo-500', bicycle: 'bg-yellow-500',
  static_bicycle: 'bg-amber-500', simulator: 'bg-pink-500',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(t: string) {
  return t ? t.slice(0, 5) : '';
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2);
  return `${m}:${sec.padStart(5, '0')}`;
}

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicAthletePage() {
  const { athleteId } = useParams<{ athleteId: string }>();

  const { data: athlete, isLoading: athleteLoading } = useQuery({
    queryKey: ['public-athlete', athleteId],
    queryFn: async () => {
      if (!athleteId) return null;
      const { data } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category, status, gender, created_at')
        .eq('id', athleteId)
        .eq('status', 'active')
        .maybeSingle();
      return data;
    },
    enabled: !!athleteId,
  });

  const { data: upcomingSessions = [] } = useQuery({
    queryKey: ['public-sessions', athleteId],
    queryFn: async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('id, title, scheduled_at, duration_minutes, location, training_type')
        .gte('scheduled_at', today)
        .order('scheduled_at', { ascending: true })
        .limit(6);
      return data ?? [];
    },
    enabled: !!athleteId,
  });

  const { data: recentResults = [] } = useQuery({
    queryKey: ['public-results', athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      const { data } = await supabase
        .from('competition_results')
        .select('id, time_seconds, position, event_name, created_at')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!athleteId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['public-attendance', athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      const { data } = await supabase
        .from('training_attendance')
        .select('attended, created_at')
        .eq('athlete_id', athleteId)
        .gte('created_at', thirtyDaysAgo);
      return (data ?? []) as { attended: boolean; created_at: string }[];
    },
    enabled: !!athleteId,
  });

  const { data: hasRestriction = false } = useQuery({
    queryKey: ['public-restriction', athleteId],
    queryFn: async () => {
      if (!athleteId) return false;
      const { data } = await supabase
        .from('medical_sessions')
        .select('id')
        .eq('athlete_id', athleteId)
        .in('status', ['active_restriction', 'partial_restriction'])
        .limit(1);
      return (data ?? []).length > 0;
    },
    enabled: !!athleteId,
  });

  const { data: awards = [] } = useQuery({
    queryKey: ['public-awards', athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      const { data } = await supabase
        .from('awards')
        .select('medal_type, competition_name, year')
        .eq('athlete_id', athleteId)
        .order('year', { ascending: false })
        .limit(6);
      return data ?? [];
    },
    enabled: !!athleteId,
  });

  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.attended).length / attendance.length) * 100)
    : null;

  const goldCount   = awards.filter(a => ['gold',   'oro']    .includes((a.medal_type ?? '').toLowerCase())).length;
  const silverCount = awards.filter(a => ['silver', 'plata']  .includes((a.medal_type ?? '').toLowerCase())).length;
  const bronzeCount = awards.filter(a => ['bronze', 'bronce'] .includes((a.medal_type ?? '').toLowerCase())).length;

  if (athleteLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <Shield className="h-16 w-16 text-muted-foreground/20" />
        <h2 className="text-xl font-bold">Perfil no disponible</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          El enlace que recibiste no corresponde a un perfil activo del club.
          Contacta al administrador si crees que es un error.
        </p>
        <Link to="/login" className="text-orange-500 text-sm hover:underline">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-md flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM5 9l4-3 3 2 4-3 3 2-1 2-3-1.5-4 3-3-2-2 1.5L5 9Zm-1 5 2-1 12 5-1 2-13-6Z"/>
            </svg>
          </div>
          <div className="leading-none">
            <span className="text-sm font-black text-foreground tracking-tight">
              SpeedSkate<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Track</span>
            </span>
            <div className="text-[9px] text-muted-foreground font-medium tracking-widest uppercase">Club Management</div>
          </div>
          <div className="ml-auto">
            <Link to="/login" className="text-xs text-muted-foreground hover:text-orange-500 transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Hero card */}
        <Card className="overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-blue-500/20" />
          <CardContent className="px-5 pb-5 -mt-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-500/30 mb-3 border-4 border-background">
              {athlete.first_name[0]}{athlete.last_name[0]}
            </div>
            <h1 className="text-2xl font-black text-foreground">
              {athlete.first_name} {athlete.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize">
                {CATEGORY_LABELS[athlete.category] ?? athlete.category}
              </Badge>
              {hasRestriction ? (
                <Badge className="gap-1 bg-amber-500/15 text-amber-700 border-amber-200 border text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Con restricción médica
                </Badge>
              ) : (
                <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-200 border text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  Apto para entrenar
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black text-orange-500">
                {attendanceRate !== null ? `${attendanceRate}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Asistencia<br />últimos 30 días</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black text-foreground">{awards.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Medallas<br />registradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex justify-center gap-1">
                {goldCount > 0   && <span className="text-lg">🥇{goldCount > 1 ? <span className="text-sm font-bold">×{goldCount}</span> : ''}</span>}
                {silverCount > 0 && <span className="text-lg">🥈{silverCount > 1 ? <span className="text-sm font-bold">×{silverCount}</span> : ''}</span>}
                {bronzeCount > 0 && <span className="text-lg">🥉{bronzeCount > 1 ? <span className="text-sm font-bold">×{bronzeCount}</span> : ''}</span>}
                {awards.length === 0 && <span className="text-2xl font-black text-muted-foreground">—</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Podios<br />por tipo</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming training */}
        <div className="space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            Próximas sesiones de entrenamiento
          </h2>
          {upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/25 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin sesiones programadas próximamente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.map(s => (
                <Card key={s.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={cn(
                      'w-2 h-full min-h-[40px] rounded-full flex-shrink-0',
                      TRAINING_TYPE_COLORS[s.training_type] ?? 'bg-muted',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {formatDate(s.scheduled_at)}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {s.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(s.scheduled_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                            {s.duration_minutes ? ` — ${s.duration_minutes} min` : ''}
                          </span>
                        )}
                        {s.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {s.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      {TRAINING_TYPE_LABELS[s.training_type] ?? s.training_type}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent results */}
        {recentResults.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-500" />
              Últimos resultados en competencia
            </h2>
            <div className="space-y-2">
              {recentResults.map(r => (
                <Card key={r.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{r.event_name ?? 'Evento'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {r.time_seconds && (
                        <p className="text-base font-black font-mono text-foreground">{formatSeconds(r.time_seconds)}</p>
                      )}
                      {r.position && (
                        <p className="text-xs text-muted-foreground">Posición: #{r.position}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Awards */}
        {awards.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Palmarés
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {awards.map((a, i) => {
                const mt = (a.medal_type ?? '').toLowerCase();
                const emoji = ['gold','oro'].includes(mt) ? '🥇' : ['silver','plata'].includes(mt) ? '🥈' : ['bronze','bronce'].includes(mt) ? '🥉' : '🏅';
                return (
                  <Card key={i} className="text-center">
                    <CardContent className="p-3">
                      <p className="text-2xl mb-1">{emoji}</p>
                      <p className="text-xs font-semibold leading-tight truncate">{a.competition_name ?? 'Competencia'}</p>
                      {a.year && <p className="text-[10px] text-muted-foreground mt-0.5">{a.year}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground border-t border-border">
          Información generada por SpeedSkateTrack Club Management · Solo para uso familiar
        </div>
      </main>
    </div>
  );
}
