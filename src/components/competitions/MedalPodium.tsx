import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { useMedalAnalytics } from '@/hooks/useMedalRecording';

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
  const { data: medals, isLoading } = useMedalAnalytics();

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
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Podio de Medallas
          </CardTitle>
          <CardDescription>Mejores atletas por medallas obtenidas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No medal data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate athlete statistics
  const athleteStats = medals.reduce((acc: any, medal: any) => {
    const athleteName = `${medal.athletes?.first_name} ${medal.athletes?.last_name}`;
    if (!acc[athleteName]) {
      acc[athleteName] = {
        name: athleteName,
        initials: `${medal.athletes?.first_name?.[0] || ''}${medal.athletes?.last_name?.[0] || ''}`,
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

  // Get top 3 athletes with 2+ medals
  const topAthletes: PodiumAthlete[] = Object.values(athleteStats)
    .filter((athlete: any) => athlete.totalMedals >= 2)
    .sort((a: any, b: any) => {
      // Sort by gold first, then silver, then bronze
      if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
      if (b.silverCount !== a.silverCount) return b.silverCount - a.silverCount;
      return b.bronzeCount - a.bronzeCount;
    })
    .slice(0, 3)
    .map((athlete: any, index: number) => ({
      ...athlete,
      position: index + 1,
    }));

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = topAthletes.length >= 2 ? [topAthletes[1], topAthletes[0], topAthletes[2]].filter(Boolean) : topAthletes;

  // Calculate total medals
  const totalGold = medals.filter((m: any) => m.medal_type === 'gold').length;
  const totalSilver = medals.filter((m: any) => m.medal_type === 'silver').length;
  const totalBronze = medals.filter((m: any) => m.medal_type === 'bronze').length;

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
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Podio de Medallas
        </CardTitle>
        <CardDescription>Mejores atletas por medallas obtenidas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Podium Display */}
          {podiumOrder.length > 0 && (
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
          )}

          {/* Total Medal Statistics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                <span className="text-3xl font-bold text-yellow-600">{totalGold}</span>
              </div>
              <p className="text-sm text-muted-foreground">Medallas de Oro</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Medal className="h-6 w-6 text-gray-400 mr-2" />
                <span className="text-3xl font-bold text-gray-600">{totalSilver}</span>
              </div>
              <p className="text-sm text-muted-foreground">Medallas de Plata</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-amber-600 mr-2" />
                <span className="text-3xl font-bold text-amber-600">{totalBronze}</span>
              </div>
              <p className="text-sm text-muted-foreground">Medallas de Bronce</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
