import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar, Trophy, User } from 'lucide-react';
import { calculateAge } from '@/utils/ageCalculations';

interface AthleteIdentityCardProps {
  athlete: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    date_of_birth: string | null;
    category: string;
    level: string;
    status: string;
    club_name?: string | null;
    main_discipline?: string | null;
    profile_image_url?: string | null;
  };
  profile?: {
    city?: string | null;
    country?: string | null;
    avatar_url?: string | null;
  } | null;
  yearsExperience?: number;
}

const AthleteIdentityCard: React.FC<AthleteIdentityCardProps> = ({ 
  athlete, 
  profile,
  yearsExperience = 0
}) => {
  const age = athlete.date_of_birth ? calculateAge(new Date(athlete.date_of_birth)) : null;
  const initials = `${athlete.first_name?.[0] || ''}${athlete.last_name?.[0] || ''}`.toUpperCase();
  const avatarUrl = athlete.profile_image_url || profile?.avatar_url;

  const getDisciplineLabel = (discipline?: string | null) => {
    const labels: Record<string, string> = {
      'inline_skating': 'Patinaje en Línea',
      'cycling': 'Ciclismo',
      'gym': 'Gimnasio',
      'running': 'Atletismo'
    };
    return labels[discipline || ''] || discipline || 'No especificada';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'escuela': 'Escuela',
      'menores': 'Menores',
      'transicion': 'Transición',
      'prejuvenil': 'Pre-Juvenil',
      'juvenil': 'Juvenil',
      'mayores': 'Mayores'
    };
    return labels[category] || category;
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Side - Photo and Basic Info */}
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-24 w-24 border-4 border-primary/30 shadow-lg">
              <AvatarImage src={avatarUrl || undefined} alt={`${athlete.first_name} ${athlete.last_name}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials || <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                {athlete.first_name} {athlete.last_name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <Badge variant="secondary" className="font-medium">
                  {getCategoryLabel(athlete.category)}
                </Badge>
                {age && (
                  <span className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    {age} años
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {athlete.club_name && (
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                    {athlete.club_name}
                  </span>
                )}
                {(profile?.city || profile?.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[profile.city, profile.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Side - Status and Stats */}
          <div className="flex flex-col items-end justify-center gap-3">
            <Badge 
              variant={athlete.status === 'active' ? 'default' : 'secondary'}
              className={athlete.status === 'active' 
                ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' 
                : 'bg-muted text-muted-foreground'
              }
            >
              {athlete.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
            
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{yearsExperience}</span> años de experiencia
              </div>
              <div className="text-sm text-muted-foreground">
                Disciplina: <span className="font-medium text-foreground">{getDisciplineLabel(athlete.main_discipline)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AthleteIdentityCard;
