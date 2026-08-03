import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Trophy, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAthlete } from '@/hooks/useCurrentAthlete';
import { CompetitionMap } from '@/components/ui/CompetitionMap';

const COUNTRY_FLAGS: Record<string, string> = {
  'Colombia': '🇨🇴',
  'Argentina': '🇦🇷',
  'Brasil': '🇧🇷',
  'Chile': '🇨🇱',
  'México': '🇲🇽',
  'Perú': '🇵🇪',
  'Ecuador': '🇪🇨',
  'Venezuela': '🇻🇪',
  'Uruguay': '🇺🇾',
  'Paraguay': '🇵🇾',
  'Bolivia': '🇧🇴',
  'Panama': '🇵🇦',
  'Costa Rica': '🇨🇷',
  'Cuba': '🇨🇺',
  'Estados Unidos': '🇺🇸',
  'España': '🇪🇸',
  'Francia': '🇫🇷',
  'Italia': '🇮🇹',
  'Alemania': '🇩🇪',
  'China': '🇨🇳',
  'Corea del Sur': '🇰🇷',
};

const MEDAL_CONFIG: Record<string, { label: string; class: string }> = {
  gold:   { label: '🥇 Oro',   class: 'bg-yellow-500/20 text-yellow-700 border-yellow-400' },
  silver: { label: '🥈 Plata', class: 'bg-slate-400/20 text-slate-700 border-slate-400' },
  bronze: { label: '🥉 Bronce', class: 'bg-amber-700/20 text-amber-700 border-amber-600' },
};

interface IntlComp {
  id: string;
  competition_name: string;
  organizer: string | null;
  city: string;
  country: string;
  competition_year: number;
  competition_date: string | null;
  event_name: string;
  category: string | null;
  position: number | null;
  time_seconds: number | null;
  status: string | null;
  is_national_team_rep: boolean;
  medal_type: string | null;
  notes: string | null;
}

const formatPosition = (pos: number | null) => {
  if (!pos) return '-';
  if (pos === 1) return '1°';
  if (pos === 2) return '2°';
  if (pos === 3) return '3°';
  return `${pos}°`;
};

const formatTime = (secs: number | null) => {
  if (!secs) return '-';
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  if (mins > 0) return `${mins}:${s.toFixed(3).padStart(6, '0')}`;
  return `${s.toFixed(3)}`;
};

export const InternationalTab = () => {
  const { athlete } = useCurrentAthlete();

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ['athlete-international', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];
      const { data, error } = await supabase
        .from('athlete_international_competitions')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('competition_year', { ascending: false });
      if (error) throw error;
      return data as IntlComp[];
    },
    enabled: !!athlete?.id,
  });

  const totalMedals = competitions.filter(c => c.medal_type).length;
  const nationalRepCount = competitions.filter(c => c.is_national_team_rep).length;
  const countriesVisited = [...new Set(competitions.map(c => c.country))].length;

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
      {/* World map */}
      <CompetitionMap
        title="Mapa de Competencias Internacionales"
        description="Países visitados en competencias oficiales"
        height={300}
      />
      {/* Stats header */}
      {competitions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-primary">{competitions.length}</p>
              <p className="text-xs text-muted-foreground">Competencias</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-yellow-600">{totalMedals}</p>
              <p className="text-xs text-muted-foreground">Medallas</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-blue-600">{countriesVisited}</p>
              <p className="text-xs text-muted-foreground">Países</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Competencias Internacionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {competitions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin competencias internacionales registradas</p>
              <p className="text-xs mt-1">El entrenador o administrador puede agregar participaciones internacionales</p>
            </div>
          ) : (
            <div className="space-y-3">
              {competitions.map((comp) => (
                <div
                  key={comp.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comp.competition_name}</span>
                        <span className="text-lg" title={comp.country}>
                          {COUNTRY_FLAGS[comp.country] ?? '🌍'}
                        </span>
                        {comp.is_national_team_rep && (
                          <Badge className="gap-1 bg-blue-600/20 text-blue-700 border-blue-500 text-xs">
                            <Shield className="h-3 w-3" />
                            Selección Colombia
                          </Badge>
                        )}
                        {comp.medal_type && (
                          <Badge className={`text-xs border ${MEDAL_CONFIG[comp.medal_type]?.class}`}>
                            {MEDAL_CONFIG[comp.medal_type]?.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{comp.event_name}</span>
                        <span>{comp.city}, {comp.country}</span>
                        <span>{comp.competition_year}</span>
                        {comp.organizer && <span>{comp.organizer}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-xl font-bold text-primary">{formatPosition(comp.position)}</p>
                        <p className="text-xs text-muted-foreground">Posición</p>
                      </div>
                      {comp.time_seconds && (
                        <div className="text-center">
                          <p className="text-sm font-mono font-semibold">{formatTime(comp.time_seconds)}</p>
                          <p className="text-xs text-muted-foreground">Tiempo</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {comp.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{comp.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
