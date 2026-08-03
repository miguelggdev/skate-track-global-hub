import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type MedalKind = 'gold' | 'silver' | 'bronze';

function isGold(mt: string | null) { return ['gold', 'oro'].includes((mt ?? '').toLowerCase()); }
function isSilver(mt: string | null) { return ['silver', 'plata'].includes((mt ?? '').toLowerCase()); }
function isBronze(mt: string | null) { return ['bronze', 'bronce'].includes((mt ?? '').toLowerCase()); }

const getMedalIcon = (medal: MedalKind) => {
  if (medal === 'gold')   return <Trophy className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />;
  if (medal === 'silver') return <Medal className="h-6 w-6 text-gray-400 dark:text-gray-300" />;
  return <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
};

const getMedalColor = (medal: MedalKind) => {
  if (medal === 'gold')   return 'from-yellow-400 to-yellow-600';
  if (medal === 'silver') return 'from-gray-300 to-gray-500';
  return 'from-amber-400 to-amber-600';
};

const getPodiumHeight = (medal: MedalKind) => {
  if (medal === 'gold')   return 'h-24';
  if (medal === 'silver') return 'h-20';
  return 'h-16';
};

const MEDAL_KINDS: MedalKind[] = ['gold', 'silver', 'bronze'];

const MedalPodium: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['medal-podium'],
    queryFn: async () => {
      const [awardsRes, athletesRes] = await Promise.all([
        supabase.from('awards').select('athlete_id, medal_type'),
        supabase.from('athletes').select('id, first_name, last_name, category'),
      ]);
      return {
        awards: awardsRes.data ?? [],
        athletes: athletesRes.data ?? [],
      };
    },
  });

  const awards = data?.awards ?? [];
  const athleteMap = new Map((data?.athletes ?? []).map(a => [a.id, a]));

  // Aggregate medals per athlete
  const agg = new Map<string, { gold: number; silver: number; bronze: number; total: number }>();
  for (const aw of awards) {
    if (!agg.has(aw.athlete_id)) agg.set(aw.athlete_id, { gold: 0, silver: 0, bronze: 0, total: 0 });
    const entry = agg.get(aw.athlete_id)!;
    if (isGold(aw.medal_type))        entry.gold++;
    else if (isSilver(aw.medal_type)) entry.silver++;
    else if (isBronze(aw.medal_type)) entry.bronze++;
    entry.total++;
  }

  // Top 3 by total medals
  const top3 = [...agg.entries()]
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 3);

  const totalGold   = awards.filter(a => isGold(a.medal_type)).length;
  const totalSilver = awards.filter(a => isSilver(a.medal_type)).length;
  const totalBronze = awards.filter(a => isBronze(a.medal_type)).length;

  const noData = top3.length === 0;

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-dashboard-secondary" />
          Podio de Medallas
        </CardTitle>
        <CardDescription>Mejores atletas por medallas obtenidas</CardDescription>
      </CardHeader>
      <CardContent>
        {noData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <Trophy className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Sin medallas registradas aún</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Podium */}
            <div className="flex items-end justify-center gap-4 py-8">
              {top3.map(([athleteId, medals], index) => {
                const athlete = athleteMap.get(athleteId);
                const name = athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Atleta';
                const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
                const kind = MEDAL_KINDS[index];
                return (
                  <div
                    key={athleteId}
                    className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-all duration-300"
                  >
                    <div className="relative mb-3">
                      <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                        <AvatarFallback className="bg-dashboard-primary text-white text-lg font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                        {getMedalIcon(kind)}
                      </div>
                    </div>
                    <div className="text-center mb-2">
                      <p className="font-semibold text-sm">{name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {medals.total} medalla{medals.total !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div
                      className={`w-20 ${getPodiumHeight(kind)} bg-gradient-to-t ${getMedalColor(kind)} rounded-t-lg flex items-end justify-center pb-2 shadow-lg transform transition-all duration-300 group-hover:shadow-xl`}
                    >
                      <span className="text-white font-bold text-xl">{index + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Medal Statistics */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-1" />
                  <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalGold}</span>
                </div>
                <p className="text-xs text-muted-foreground">Medallas de Oro</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Medal className="h-5 w-5 text-gray-400 dark:text-gray-300 mr-1" />
                  <span className="text-2xl font-bold text-muted-foreground">{totalSilver}</span>
                </div>
                <p className="text-xs text-muted-foreground">Medallas de Plata</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-1" />
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalBronze}</span>
                </div>
                <p className="text-xs text-muted-foreground">Medallas de Bronce</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedalPodium;
