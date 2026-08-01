import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award } from 'lucide-react';
import { useMedalAnalytics } from '@/hooks/useMedalRecording';
import { useCompetitions } from '@/hooks/useCompetitions';

interface PodiumAthlete {
  name: string;
  initials: string;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  totalMedals: number;
  position: number;
}

export const MedalPodium = () => {
  const { data: medals, isLoading: medalsLoading } = useMedalAnalytics();
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');

  const isLoading = medalsLoading || competitionsLoading;

  // Hooks declared before any early returns to keep order consistent
  const filteredMedals = useMemo(() => {
    if (!medals || medals.length === 0) return [];
    if (selectedCompetition === 'all') return medals;
    return medals.filter((medal: any) => medal.competition_id === selectedCompetition);
  }, [medals, selectedCompetition]);

  const selectedCompetitionName = useMemo(() => {
    if (selectedCompetition === 'all') return 'Todas las competencias';
    const comp = competitions?.find((c: any) => c.id === selectedCompetition);
    return comp?.name || 'Competencia seleccionada';
  }, [selectedCompetition, competitions]);

  const athleteStats = useMemo(() => {
    return filteredMedals.reduce((acc: any, medal: any) => {
      const athleteName = `${medal.athletes?.first_name} ${medal.athletes?.last_name}`;
      if (!acc[athleteName]) {
        acc[athleteName] = {
          name: athleteName,
          initials: `${medal.athletes?.first_name?.[0] ?? ''}${medal.athletes?.last_name?.[0] ?? ''}`,
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0,
          totalMedals: 0,
        };
      }
      if (medal.medal_type === 'gold') acc[athleteName].goldCount += 1;
      if (medal.medal_type === 'silver') acc[athleteName].silverCount += 1;
      if (medal.medal_type === 'bronze') acc[athleteName].bronzeCount += 1;
      acc[athleteName].totalMedals += 1;
      return acc;
    }, {});
  }, [filteredMedals]);

  const topAthletes: PodiumAthlete[] = useMemo(() => {
    return Object.values(athleteStats)
      .filter((athlete: any) => athlete.totalMedals >= 2)
      .sort((a: any, b: any) => {
        if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
        if (b.silverCount !== a.silverCount) return b.silverCount - a.silverCount;
        return b.bronzeCount - a.bronzeCount;
      })
      .slice(0, 3)
      .map((athlete: any, index: number) => ({
        ...athlete,
        position: index + 1,
      }));
  }, [athleteStats]);

  const podiumOrder = useMemo(() => {
    return topAthletes.length >= 2 ? [topAthletes[1], topAthletes[0], topAthletes[2]].filter(Boolean) : topAthletes;
  }, [topAthletes]);

  const medalTotals = useMemo(() => ({
    gold: filteredMedals.filter((m: any) => m.medal_type === 'gold').length,
    silver: filteredMedals.filter((m: any) => m.medal_type === 'silver').length,
    bronze: filteredMedals.filter((m: any) => m.medal_type === 'bronze').length,
  }), [filteredMedals]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading medal podium...
        </CardContent>
      </Card>
    );
  }

  if (!medals || medals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Podio de Medallas
              </CardTitle>
              <CardDescription>Mejores atletas por medallas obtenidas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No medal data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  // Hooks moved above to ensure consistent hook order across renders

  const getMedalIcon = (athlete: PodiumAthlete) => {
    if (athlete.goldCount >= 2) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (athlete.silverCount >= 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (athlete.bronzeCount >= 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  };

  const getPodiumHeight = (position: number) => {
    if (position === 1) return 'h-32';
    if (position === 2) return 'h-24';
    return 'h-20';
  };

  const getPodiumColor = (position: number) => {
    if (position === 1) return 'from-yellow-400 to-yellow-600';
    if (position === 2) return 'from-gray-300 to-gray-500';
    return 'from-amber-400 to-amber-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Podio de Medallas
            </CardTitle>
            <CardDescription>Mejores atletas por medallas obtenidas</CardDescription>
          </div>
          <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
            <SelectTrigger className="w-[280px] bg-background">
              <SelectValue placeholder="Seleccionar competencia" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todas las competencias</SelectItem>
              {competitions?.map((competition: any) => (
                <SelectItem key={competition.id} value={competition.id}>
                  {competition.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Competition Name Display */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">
              {selectedCompetitionName}
            </h3>
          </div>

          {/* Podium Display */}
          {podiumOrder.length > 0 ? (
            <div className="flex items-end justify-center gap-6 py-8">
              {podiumOrder.map((athlete) => (
                <div
                  key={athlete.name}
                  className="flex flex-col items-center group"
                >
                  {/* Avatar with Medal Icon */}
                  <div className="relative mb-3">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarFallback className="bg-primary text-white text-xl font-bold">
                        {athlete.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-md">
                      {getMedalIcon(athlete)}
                    </div>
                  </div>

                  {/* Athlete Name */}
                  <p className="font-semibold text-sm text-center mb-1 max-w-[120px]">
                    {athlete.name}
                  </p>

                  {/* Medal Count Badge */}
                  <Badge variant="secondary" className="mb-3 text-xs">
                    {athlete.totalMedals} medallas
                  </Badge>

                  {/* Podium Base */}
                  <div
                    className={`w-24 ${getPodiumHeight(athlete.position)} bg-gradient-to-t ${getPodiumColor(athlete.position)} rounded-t-lg flex items-end justify-center pb-3 shadow-lg transition-all duration-300`}
                  >
                    <span className="text-white font-bold text-3xl">
                      {athlete.position}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay atletas con 2 o más medallas en esta competencia
            </div>
          )}

          {/* Total Medal Statistics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                <span className="text-3xl font-bold text-yellow-600">{medalTotals.gold}</span>
              </div>
              <p className="text-sm text-muted-foreground">Medallas de Oro</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Medal className="h-6 w-6 text-gray-400 mr-2" />
                <span className="text-3xl font-bold text-gray-600">{medalTotals.silver}</span>
              </div>
              <p className="text-sm text-muted-foreground">Medallas de Plata</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-amber-600 mr-2" />
                <span className="text-3xl font-bold text-amber-600">{medalTotals.bronze}</span>
              </div>
              <p className="text-sm text-muted-foreground">Medallas de Bronce</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
