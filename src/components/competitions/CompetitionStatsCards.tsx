import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Medal, Calendar, LucideIcon } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  period: string;
  icon: LucideIcon;
  bgColor: string;
  isPositive: boolean;
}

const CompetitionStatsCards = () => {
  const stats: StatCard[] = [
    {
      title: "COMPETENCIAS ACTIVAS",
      value: "12",
      change: "+2",
      period: "respecto al mes anterior",
      icon: Trophy,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    {
      title: "PARTICIPANTES",
      value: "348",
      change: "+15%",
      period: "desde el último evento",
      icon: Users,
      bgColor: "argon-gradient-green",
      isPositive: true
    },
    {
      title: "MEDALLAS GANADAS",
      value: "87",
      change: "+23",
      period: "esta temporada",
      icon: Medal,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
    {
      title: "PRÓXIMOS EVENTOS",
      value: "8",
      change: "+3",
      period: "próximos 30 días",
      icon: Calendar,
      bgColor: "argon-gradient-red",
      isPositive: true
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.title} className="argon-card relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div>
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {stat.value}
              </CardTitle>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor} text-white shadow-lg`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-sm text-muted-foreground">
              <span className={`font-semibold ${stat.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stat.change}
              </span>{' '}
              {stat.period}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CompetitionStatsCards;
