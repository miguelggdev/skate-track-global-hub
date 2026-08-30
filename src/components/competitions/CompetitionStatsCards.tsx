import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Medal, Calendar, LucideIcon, Loader2 } from 'lucide-react';
import { useCompetitionStats } from '@/hooks/useCompetitions';

interface StatCard {
  title: string;
  value: number;
  change: string;
  period: string;
  icon: LucideIcon;
  bgColor: string;
}

const CompetitionStatsCards = () => {
  const { data: stats, isLoading } = useCompetitionStats();

  const cards: StatCard[] = [
    {
      title: "COMPETENCIAS ACTIVAS",
      value: stats?.activeCompetitions ?? 0,
      change: `+${stats?.newCompetitionsLast30d ?? 0}`,
      period: "nuevas en los últimos 30 días",
      icon: Trophy,
      bgColor: "argon-gradient-blue",
    },
    {
      title: "PARTICIPANTES",
      value: stats?.participants ?? 0,
      change: `+${stats?.newRegistrationsLast30d ?? 0}`,
      period: "inscripciones en los últimos 30 días",
      icon: Users,
      bgColor: "argon-gradient-green",
    },
    {
      title: "MEDALLAS GANADAS",
      value: stats?.medals ?? 0,
      change: `${stats?.medalsThisYear ?? 0}`,
      period: "esta temporada",
      icon: Medal,
      bgColor: "argon-gradient-orange",
    },
    {
      title: "PRÓXIMOS EVENTOS",
      value: stats?.upcomingEvents ?? 0,
      change: '',
      period: "próximos 30 días",
      icon: Calendar,
      bgColor: "argon-gradient-red",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((stat) => (
        <Card key={stat.title} className="argon-card relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div>
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stat.value}
              </CardTitle>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor} text-white shadow-lg`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-sm text-muted-foreground">
              {stat.change && (
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stat.change}{' '}
                </span>
              )}
              {stat.period}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CompetitionStatsCards;
