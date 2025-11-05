import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Trophy, Clock, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/hooks/useCurrency';

interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  category: string;
  level: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'registration-open';
  registrations: number;
  maxParticipants: number;
  entryFee: number;
  daysUntil?: number;
}

const CompetitionTimeline: React.FC = () => {
  const { currency } = useCurrency();
  const competitions: Competition[] = [
    {
      id: '1',
      name: 'Campeonato de Verano',
      date: '2024-08-15',
      location: 'Complejo Deportivo',
      category: 'Junior',
      level: 'Avanzado',
      status: 'registration-open',
      registrations: 28,
      maxParticipants: 35,
      entryFee: 20,
      daysUntil: 32
    },
    {
      id: '2',
      name: 'Liga Metropolitana',
      date: '2024-09-05',
      location: 'Centro de Patinaje',
      category: 'Senior',
      level: 'Profesional',
      status: 'upcoming',
      registrations: 18,
      maxParticipants: 25,
      entryFee: 40,
      daysUntil: 53
    },
    {
      id: '3',
      name: 'Copa Nacional Juvenil',
      date: '2024-10-12',
      location: 'Arena Nacional',
      category: 'Youth',
      level: 'Intermedio',
      status: 'upcoming',
      registrations: 0,
      maxParticipants: 50,
      entryFee: 15,
      daysUntil: 90
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration-open':
        return 'bg-dashboard-success text-white';
      case 'upcoming':
        return 'bg-dashboard-info text-white';
      case 'ongoing':
        return 'bg-dashboard-warning text-white';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration-open':
        return 'Inscripciones Abiertas';
      case 'upcoming':
        return 'Próximamente';
      case 'ongoing':
        return 'En Curso';
      case 'completed':
        return 'Finalizado';
      default:
        return 'Desconocido';
    }
  };

  const getRegistrationPercentage = (registrations: number, max: number) => {
    return Math.round((registrations / max) * 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-dashboard-secondary" />
          Calendario de Competencias
        </CardTitle>
        <CardDescription>Próximos eventos y estado de inscripciones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {competitions.map((competition, index) => (
            <div 
              key={competition.id}
              className="relative pl-8 pb-6 last:pb-0"
            >
              {/* Timeline connector */}
              {index < competitions.length - 1 && (
                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border"></div>
              )}
              
              {/* Timeline dot */}
              <div className={`absolute left-0 top-2 w-6 h-6 rounded-full border-2 border-white shadow-md ${getStatusColor(competition.status)} flex items-center justify-center`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>

              {/* Competition Card */}
              <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg group-hover:text-dashboard-primary transition-colors">
                      {competition.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(competition.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {competition.location}
                      </div>
                      {competition.daysUntil && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {competition.daysUntil} días
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(competition.status)}>
                    {getStatusText(competition.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Categoría:</span>
                    <p className="font-medium">{competition.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nivel:</span>
                    <p className="font-medium">{competition.level}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cuota:</span>
                    <p className="font-medium">{formatCurrency(competition.entryFee, currency)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Inscritos:</span>
                    <p className="font-medium">{competition.registrations}/{competition.maxParticipants}</p>
                  </div>
                </div>

                {/* Registration Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progreso de inscripciones</span>
                    <span className="font-medium">
                      {getRegistrationPercentage(competition.registrations, competition.maxParticipants)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-dashboard-primary h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${getRegistrationPercentage(competition.registrations, competition.maxParticipants)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {competition.status === 'registration-open' && (
                    <Button size="sm" className="bg-dashboard-success hover:bg-dashboard-success/90">
                      <Users className="h-4 w-4 mr-1" />
                      Inscribir Atletas
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-dashboard-success">2</div>
            <div className="text-xs text-muted-foreground">Inscripciones Abiertas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-dashboard-primary">46</div>
            <div className="text-xs text-muted-foreground">Total Inscritos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-dashboard-secondary">{formatCurrency(75, currency)}</div>
            <div className="text-xs text-muted-foreground">Cuota Promedio</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitionTimeline;