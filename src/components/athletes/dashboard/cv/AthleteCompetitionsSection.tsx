import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Competition {
  id: string;
  competition_id: string;
  position: number | null;
  medal_type: string | null;
  competitions: {
    name: string;
    start_date: string;
    category: string | null;
    location: string;
  };
}

interface Award {
  id: string;
  award_name: string;
  award_type: string;
  award_date: string;
  points_earned: number | null;
}

interface AthleteCompetitionsSectionProps {
  competitions: Competition[];
  awards?: Award[];
}

const AthleteCompetitionsSection: React.FC<AthleteCompetitionsSectionProps> = ({
  competitions,
  awards = []
}) => {
  const getMedalEmoji = (type: string | null) => {
    switch (type) {
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return null;
    }
  };

  const getPositionBadge = (position: number | null, medalType: string | null) => {
    if (!position) return null;
    
    const medal = getMedalEmoji(medalType);
    if (medal) {
      return <span className="text-xl">{medal}</span>;
    }
    
    return (
      <Badge variant="outline" className="text-xs">
        #{position}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Competitions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Competencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {competitions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay competencias registradas en este período
            </p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {competitions.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{comp.competitions.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(comp.competitions.start_date), 'dd MMM yyyy', { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {comp.competitions.location}
                      </span>
                    </div>
                    {comp.competitions.category && (
                      <Badge variant="secondary" className="text-xs">
                        {comp.competitions.category}
                      </Badge>
                    )}
                  </div>
                  <div className="ml-2">
                    {getPositionBadge(comp.position, comp.medal_type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Awards/Trophies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-500" />
            Logros y Trofeos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {awards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay logros registrados
            </p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {awards.map((award) => (
                <div
                  key={award.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card"
                >
                  <div className="text-2xl">
                    {award.award_type === 'gold' ? '🏆' : 
                     award.award_type === 'silver' ? '🥈' :
                     award.award_type === 'bronze' ? '🥉' : '🎖️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{award.award_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(award.award_date), 'MMMM yyyy', { locale: es })}
                    </p>
                  </div>
                  {award.points_earned && (
                    <Badge variant="outline">{award.points_earned} pts</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AthleteCompetitionsSection;
