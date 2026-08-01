import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Clock, UserPlus, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORY_LABEL: Record<string, string> = {
  escuela: 'Escuela', menores: 'Menores', transicion: 'Transición',
  prejuvenil: 'Prejuvenil', juvenil: 'Juvenil', mayores: 'Mayores',
};

const MEDAL_EMOJI: Record<string, string> = {
  gold: '🥇', oro: '🥇', silver: '🥈', plata: '🥈', bronze: '🥉', bronce: '🥉',
};

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

const HighlightsSection: React.FC = () => {
  const { data: topAthlete } = useQuery({
    queryKey: ['top-athlete-highlight'],
    queryFn: async () => {
      const { data } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category, performance_score')
        .eq('status', 'active')
        .order('performance_score', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentAwards = [] } = useQuery({
    queryKey: ['recent-awards-highlights'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data } = await supabase
        .from('awards')
        .select('id, title, medal_type, created_at, athlete_id, athletes(first_name, last_name)')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentAthletes = [] } = useQuery({
    queryKey: ['recent-athletes-highlights'],
    queryFn: async () => {
      const { data } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Deportista Destacado + Logros */}
      <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Destacados del Mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {topAthlete ? (
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {initials(topAthlete.first_name, topAthlete.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                  <Trophy className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{topAthlete.first_name} {topAthlete.last_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_LABEL[topAthlete.category] ?? topAthlete.category}
                  {(topAthlete.performance_score ?? 0) > 0 && ` · Puntaje: ${topAthlete.performance_score}`}
                </p>
                <Badge variant="secondary" className="mt-1">
                  <Medal className="h-3 w-3 mr-1" />
                  Mayor rendimiento
                </Badge>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
              Sin atletas registrados aún
            </div>
          )}

          <div className="space-y-2">
            <h5 className="font-medium text-sm">Logros Recientes (30 días)</h5>
            {recentAwards.length > 0 ? (
              recentAwards.map((aw) => {
                const athlete = aw.athletes as { first_name: string; last_name: string } | null;
                const name    = athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Atleta';
                const emoji   = MEDAL_EMOJI[(aw.medal_type ?? '').toLowerCase()] ?? '🏅';
                return (
                  <div key={aw.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                    <span className="text-sm">{emoji} {aw.title ?? 'Logro'} — {name}</span>
                    <div className="flex items-center text-xs text-muted-foreground shrink-0 ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(aw.created_at), { locale: es, addSuffix: true })}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                No hay logros registrados este mes
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Atletas recientes */}
      <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            Últimas Incorporaciones
          </CardTitle>
          <CardDescription>Atletas registrados recientemente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentAthletes.length > 0 ? (
            recentAthletes.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                    {initials(a.first_name, a.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{a.first_name} {a.last_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {CATEGORY_LABEL[a.category] ?? a.category}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(a.created_at), { locale: es, addSuffix: true })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <UserPlus className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No hay atletas registrados aún</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HighlightsSection;
