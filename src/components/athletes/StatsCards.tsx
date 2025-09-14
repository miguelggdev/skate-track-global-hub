
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, GraduationCap, Baby, ArrowUpRight, UserCheck, UserPlus, Shield, UserX, User, UserCircle2, Star, Award, Activity } from 'lucide-react';
import { useAthleteStats } from '@/hooks/useAthleteStats';

const StatsCards = () => {
  const { data: athleteStats, isLoading } = useAthleteStats();

  if (isLoading) {
    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      {Array.from({ length: 10 }).map((_, index) => (
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
    // CRITICAL METRICS - Large, prominent cards
    {
      title: "TOTAL ATHLETES",
      value: athleteStats?.totalAthletes?.toString() || "0",
      change: "+12%",
      period: "total registered",
      icon: Users,
      bgColor: "argon-gradient-indigo",
      isPositive: true,
      priority: "critical",
      size: "large"
    },
    {
      title: "NEW RECRUITS",
      value: athleteStats?.newRecruitsThisMonth?.toString() || "0",
      change: `${athleteStats?.newRecruitsThisYear || 0} this year`,
      period: "joined this month",
      icon: Star,
      bgColor: "argon-gradient-green",
      isPositive: true,
      priority: "critical",
      size: "large"
    },
    {
      title: "RETENTION RATE",
      value: `${athleteStats?.retentionRate || 0}%`,
      change: "Year over year",
      period: "active retention",
      icon: Award,
      bgColor: "argon-gradient-purple",
      isPositive: (athleteStats?.retentionRate || 0) >= 80,
      priority: "critical",
      size: "large"
    },
    
    // PERFORMANCE METRICS - Medium prominence
    {
      title: "INACTIVE ATHLETES",
      value: athleteStats?.inactiveAthletes?.toString() || "0",
      change: `${athleteStats?.totalAthletes ? Math.round((athleteStats.inactiveAthletes / (athleteStats.totalAthletes + athleteStats.inactiveAthletes)) * 100) : 0}%`,
      period: "need attention",
      icon: Activity,
      bgColor: "argon-gradient-red",
      isPositive: false,
      priority: "high",
      size: "medium"
    },
    {
      title: "SCHOOL ATHLETES",
      value: athleteStats?.schoolAthletes?.toString() || "0",
      change: "+8%",
      period: "in education",
      icon: GraduationCap,
      bgColor: "argon-gradient-cyan",
      isPositive: true,
      priority: "high",
      size: "medium"
    },
    
    // DEMOGRAPHIC DATA - Standard cards
    {
      title: "MALE ATHLETES",
      value: athleteStats?.maleAthletes?.toString() || "0",
      change: `${athleteStats?.totalAthletes ? Math.round((athleteStats.maleAthletes / athleteStats.totalAthletes) * 100) : 0}%`,
      period: "of total athletes",
      icon: User,
      bgColor: "argon-gradient-blue",
      isPositive: true,
      priority: "normal",
      size: "standard"
    },
    {
      title: "FEMALE ATHLETES", 
      value: athleteStats?.femaleAthletes?.toString() || "0",
      change: `${athleteStats?.totalAthletes ? Math.round((athleteStats.femaleAthletes / athleteStats.totalAthletes) * 100) : 0}%`,
      period: "of total athletes",
      icon: UserCircle2,
      bgColor: "argon-gradient-pink",
      isPositive: true,
      priority: "normal",
      size: "standard"
    },
    {
      title: "MINORS",
      value: athleteStats?.menoresAthletes?.toString() || "0",
      change: "+5%",
      period: "menores category",
      icon: Baby,
      bgColor: "argon-gradient-orange",
      isPositive: true,
      priority: "normal",
      size: "standard"
    },
    {
      title: "TRANSITION",
      value: athleteStats?.transicionAthletes?.toString() || "0",
      change: "+3%",
      period: "transicion category",
      icon: TrendingUp,
      bgColor: "argon-gradient-yellow",
      isPositive: true,
      priority: "normal",
      size: "standard"
    },
    {
      title: "SENIORS",
      value: athleteStats?.mayoresAthletes?.toString() || "0",
      change: "+7%",
      period: "mayores category",
      icon: UserCheck,
      bgColor: "argon-gradient-teal",
      isPositive: true,
      priority: "normal",
      size: "standard"
    }
  ];

  // Sort stats by priority for better visual hierarchy
  const sortedStats = [...stats].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, normal: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const getCardClasses = (stat) => {
    const baseClasses = "argon-card relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer";
    
    switch (stat.size) {
      case 'large':
        return `${baseClasses} hover:shadow-2xl transform-gpu`;
      case 'medium':
        return `${baseClasses} hover:shadow-xl`;
      default:
        return `${baseClasses} hover:shadow-lg`;
    }
  };

  const getIconSize = (stat) => {
    switch (stat.size) {
      case 'large':
        return "h-8 w-8";
      case 'medium':
        return "h-7 w-7";
      default:
        return "h-6 w-6";
    }
  };

  const getValueSize = (stat) => {
    switch (stat.size) {
      case 'large':
        return "text-3xl font-extrabold";
      case 'medium':
        return "text-2xl font-bold";
      default:
        return "text-xl font-semibold";
    }
  };

  const getTitleSize = (stat) => {
    switch (stat.size) {
      case 'large':
        return "text-sm font-bold";
      case 'medium':
        return "text-xs font-semibold";
      default:
        return "text-xs font-medium";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      {sortedStats.map((stat, index) => (
        <Card key={index} className={getCardClasses(stat)}>
          {/* Background gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <div className="min-w-0 flex-1 pr-3">
              <CardDescription className={`${getTitleSize(stat)} text-gray-600 dark:text-gray-300 uppercase tracking-wider truncate mb-1`}>
                {stat.title}
              </CardDescription>
              <CardTitle className={`${getValueSize(stat)} text-gray-800 dark:text-white truncate group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-300`}>
                {stat.value}
              </CardTitle>
            </div>
            <div className={`p-3 rounded-xl ${stat.bgColor} text-white shadow-lg flex-shrink-0 group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
              <stat.icon className={getIconSize(stat)} />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              <span className={`font-bold ${stat.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {stat.change}
              </span>{' '}
              <span className="text-gray-500 dark:text-gray-500">
                {stat.period}
              </span>
            </p>
            
            {/* Priority indicator for critical metrics */}
            {stat.priority === 'critical' && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
