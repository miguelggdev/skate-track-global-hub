import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface Medalist {
  id: string;
  name: string;
  medal: 'gold' | 'silver' | 'bronze';
  count: number;
  avatar?: string;
  category: string;
}

const MedalPodium: React.FC = () => {
  const medalists: Medalist[] = [
    {
      id: '1',
      name: 'Sebastian Rivera',
      medal: 'gold',
      count: 3,
      category: 'Senior Professional',
      avatar: undefined
    },
    {
      id: '2', 
      name: 'Valentina Perez',
      medal: 'silver',
      count: 2,
      category: 'Junior Avanzado',
      avatar: undefined
    },
    {
      id: '3',
      name: 'Carlos Vargas',
      medal: 'bronze',
      count: 2,
      category: 'Senior Professional',
      avatar: undefined
    }
  ];

  const getMedalIcon = (medal: string) => {
    switch (medal) {
      case 'gold':
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 'silver':
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 'bronze':
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Medal className="h-6 w-6" />;
    }
  };

  const getMedalColor = (medal: string) => {
    switch (medal) {
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'silver':
        return 'from-gray-300 to-gray-500';
      case 'bronze':
        return 'from-amber-400 to-amber-600';
      default:
        return 'from-gray-300 to-gray-500';
    }
  };

  const getPodiumHeight = (medal: string) => {
    switch (medal) {
      case 'gold':
        return 'h-24';
      case 'silver':
        return 'h-20';
      case 'bronze':
        return 'h-16';
      default:
        return 'h-12';
    }
  };

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
        <div className="space-y-6">
          {/* Interactive Medal Podium */}
          <div className="flex items-end justify-center gap-4 py-8">
            {medalists.map((medalist, index) => (
              <div 
                key={medalist.id}
                className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-all duration-300"
              >
                {/* Avatar */}
                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                    <AvatarImage src={medalist.avatar} alt={medalist.name} />
                    <AvatarFallback className="bg-dashboard-primary text-white text-lg font-bold">
                      {medalist.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                    {getMedalIcon(medalist.medal)}
                  </div>
                </div>

                {/* Name and Medal Count */}
                <div className="text-center mb-2">
                  <p className="font-semibold text-sm">{medalist.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {medalist.count} medallas
                  </Badge>
                </div>

                {/* Podium Base */}
                <div 
                  className={`w-20 ${getPodiumHeight(medalist.medal)} bg-gradient-to-t ${getMedalColor(medalist.medal)} rounded-t-lg flex items-end justify-center pb-2 shadow-lg transform transition-all duration-300 group-hover:shadow-xl`}
                >
                  <span className="text-white font-bold text-xl">
                    {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Medal Statistics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-5 w-5 text-yellow-500 mr-1" />
                <span className="text-2xl font-bold text-yellow-600">12</span>
              </div>
              <p className="text-xs text-muted-foreground">Medallas de Oro</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Medal className="h-5 w-5 text-gray-400 mr-1" />
                <span className="text-2xl font-bold text-gray-600">8</span>
              </div>
              <p className="text-xs text-muted-foreground">Medallas de Plata</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-5 w-5 text-amber-600 mr-1" />
                <span className="text-2xl font-bold text-amber-600">15</span>
              </div>
              <p className="text-xs text-muted-foreground">Medallas de Bronce</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedalPodium;