import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Trophy, Clock, ExternalLink } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';

type CompStatus = 'upcoming' | 'ongoing' | 'completed' | 'registration-open';

function getStatus(c: { start_date: string; end_date: string | null; registration_deadline: string | null }): CompStatus {
  const today = new Date().toISOString().split('T')[0];
  if (c.end_date && c.end_date < today) return 'completed';
  if (c.start_date <= today) return 'ongoing';
  if (c.registration_deadline && c.registration_deadline >= today) return 'registration-open';
  return 'upcoming';
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

const getStatusColor = (status: CompStatus) => {
  switch (status) {
    case 'registration-open': return 'bg-dashboard-success text-white';
    case 'upcoming':          return 'bg-dashboard-info text-white';
    case 'ongoing':           return 'bg-dashboard-warning text-white';
    case 'completed':         return 'bg-muted text-muted-foreground';
  }
};

const getStatusText = (status: CompStatus) => {
  switch (status) {
    case 'registration-open': return 'Inscripciones Abiertas';
    case 'upcoming':          return 'Próximamente';
    case 'ongoing':           return 'En Curso';
    case 'completed':         return 'Finalizado';
  }
};

const CompetitionTimeline: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['competition-timeline'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const [compsRes, regsRes] = await Promise.all([
        supabase
          .from('competitions')
          .select('id, name, start_date, end_date, location, category, level, max_athletes_per_event, registration_deadline')
          .gte('start_date', thirtyDaysAgo)
          .order('start_date')
          .limit(6),
        supabase
          .from('competition_registrations')
          .select('competition_id, athlete_id'),
      ]);
      return {
        competitions: compsRes.data ?? [],
        registrations: regsRes.data ?? [],
      };
    },
  });

  const competitions = data?.competitions ?? [];
  const registrations = data?.registrations ?? [];

  const displayed = competitions
    .map(c => ({ ...c, status: getStatus(c) }))
    .filter(c => c.status !== 'completed')
    .slice(0, 5);

  const regCountMap = new Map<string, number>();
  for (const r of registrations) {
    regCountMap.set(r.competition_id, (regCountMap.get(r.competition_id) ?? 0) + 1);
  }

  const openCount = displayed.filter(c => c.status === 'registration-open').length;
  const totalInscribed = displayed.reduce((s, c) => s + (regCountMap.get(c.id) ?? 0), 0);

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
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <Trophy className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No hay competencias próximas programadas</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {displayed.map((competition, index) => {
                const regCount = regCountMap.get(competition.id) ?? 0;
                const maxParticipants = competition.max_athletes_per_event ?? 0;
                const pct = maxParticipants > 0 ? Math.round((regCount / maxParticipants) * 100) : 0;
                const days = daysUntil(competition.start_date);

                return (
                  <div key={competition.id} className="relative pl-8 pb-6 last:pb-0">
                    {index < displayed.length - 1 && (
                      <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
                    )}
                    <div className={`absolute left-0 top-2 w-6 h-6 rounded-full border-2 border-white shadow-md ${getStatusColor(competition.status)} flex items-center justify-center`}>
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>

                    <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-all duration-200 group">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg group-hover:text-dashboard-primary transition-colors">
                            {competition.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(competition.start_date)}
                            </div>
                            {competition.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {competition.location}
                              </div>
                            )}
                            {days > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {days} día{days !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(competition.status)}>
                          {getStatusText(competition.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                        {competition.category && (
                          <div>
                            <span className="text-muted-foreground">Categoría:</span>
                            <p className="font-medium capitalize">{competition.category}</p>
                          </div>
                        )}
                        {competition.level && (
                          <div>
                            <span className="text-muted-foreground">Nivel:</span>
                            <p className="font-medium capitalize">{competition.level.replace(/_/g, ' ')}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Inscritos:</span>
                          <p className="font-medium">
                            {regCount}{maxParticipants > 0 ? `/${maxParticipants}` : ''}
                          </p>
                        </div>
                      </div>

                      {maxParticipants > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progreso de inscripciones</span>
                            <span className="font-medium">{pct}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-dashboard-primary h-2 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      )}

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
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-dashboard-success">{openCount}</div>
                <div className="text-xs text-muted-foreground">Inscripciones Abiertas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-dashboard-primary">{totalInscribed}</div>
                <div className="text-xs text-muted-foreground">Total Inscritos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-dashboard-secondary">{displayed.length}</div>
                <div className="text-xs text-muted-foreground">Próximas Competencias</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CompetitionTimeline;
