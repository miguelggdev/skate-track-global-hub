
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Medal, Star } from 'lucide-react';

const StatsCards = () => {
  const stats = [
    { 
      title: "TOTAL ATHLETES", 
      value: "156", 
      change: "+12%", 
      period: "since last month",
      icon: Users,
      bgColor: "argon-gradient-blue",
      isPositive: true
    },
    { 
      title: "ACTIVE TODAY", 
      value: "89", 
      change: "+5%", 
      period: "since yesterday",
      icon: TrendingUp,
      bgColor: "argon-gradient-green",
      isPositive: true
    },
    { 
      title: "COMPETITIONS", 
      value: "24", 
      change: "+8", 
      period: "this season",
      icon: Medal,
      bgColor: "argon-gradient-orange",
      isPositive: true
    },
    { 
      title: "AVG PERFORMANCE", 
      value: "87.5%", 
      change: "+2.1%", 
      period: "improvement rate",
      icon: Star,
      bgColor: "argon-gradient-red",
      isPositive: true
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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
