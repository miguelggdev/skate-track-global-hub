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
      title: "ACTIVE COMPETITIONS", 
      value: "12", 
      change: "+2", 
      period: "from last month",
      icon: Trophy,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    { 
      title: "PARTICIPANTS", 
      value: "348", 
      change: "+15%", 
      period: "since last event",
      icon: Users,
      bgColor: "argon-gradient-green",
      isPositive: true
    },
    { 
      title: "MEDALS WON", 
      value: "87", 
      change: "+23", 
      period: "this season",
      icon: Medal,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
    { 
      title: "UPCOMING EVENTS", 
      value: "8", 
      change: "+3", 
      period: "next 30 days",
      icon: Calendar,
      bgColor: "argon-gradient-red",
      isPositive: true
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="argon-card relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <div>
              <CardDescription className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                {stat.title}
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-gray-800">
                {stat.value}
              </CardTitle>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor} text-white shadow-lg`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-sm text-gray-600">
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

export default CompetitionStatsCards;