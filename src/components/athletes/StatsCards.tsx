
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, GraduationCap, Baby, ArrowUpRight, UserCheck } from 'lucide-react';
import { useAthleteStats } from '@/hooks/useAthleteStats';

const StatsCards = () => {
  const { data: athleteStats, isLoading } = useAthleteStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="argon-card relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="min-w-0 flex-1 pr-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="p-2 rounded-lg bg-gray-200 animate-pulse flex-shrink-0">
                <div className="h-5 w-5"></div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "TOTAL ATHLETES",
      value: athleteStats?.totalAthletes?.toString() || "0",
      change: "+12%",
      period: "total registered",
      icon: Users,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    {
      title: "SCHOOL ATHLETES",
      value: athleteStats?.schoolAthletes?.toString() || "0",
      change: "+8%",
      period: "in education",
      icon: GraduationCap,
      bgColor: "argon-gradient-green",
      isPositive: true
    },
    {
      title: "MINORS",
      value: athleteStats?.menoresAthletes?.toString() || "0",
      change: "+5%",
      period: "menores category",
      icon: Baby,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
    {
      title: "TRANSITION",
      value: athleteStats?.transicionAthletes?.toString() || "0",
      change: "+3%",
      period: "transicion category",
      icon: ArrowUpRight,
      bgColor: "argon-gradient-purple",
      isPositive: true
    },
    {
      title: "SENIORS",
      value: athleteStats?.mayoresAthletes?.toString() || "0",
      change: "+7%",
      period: "mayores category",
      icon: UserCheck,
      bgColor: "argon-gradient-red",
      isPositive: true
    },
    {
      title: "SCHOOL",
      value: athleteStats?.escuelaAthletes?.toString() || "0",
      change: "+10%",
      period: "escuela category",
      icon: TrendingUp,
      bgColor: "argon-gradient-cyan",
      isPositive: true
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="argon-card relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="min-w-0 flex-1 pr-2">
              <CardDescription className="text-xs font-medium text-gray-600 uppercase tracking-wider truncate">
                {stat.title}
              </CardDescription>
              <CardTitle className="text-xl font-bold text-gray-800 truncate">
                {stat.value}
              </CardTitle>
            </div>
            <div className={`p-2 rounded-lg ${stat.bgColor} text-white shadow-lg flex-shrink-0`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-600 truncate">
              <span className={`font-semibold ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
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

export default StatsCards;
