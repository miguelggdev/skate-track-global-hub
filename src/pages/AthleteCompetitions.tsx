import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAthleteCompetitions } from '@/hooks/useAthleteCompetitions';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Medal,
  Target,
  Award,
  Clock,
  Star
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const AthleteCompetitions = () => {
  const { 
    upcomingCompetitions, 
    pastCompetitions, 
    results, 
    stats, 
    isLoading 
  } = useAthleteCompetitions();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'upcoming': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'ongoing': 'bg-green-500/20 text-green-400 border-green-500/30',
      'completed': 'bg-muted text-muted-foreground border-muted',
      'cancelled': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'upcoming': 'Próxima',
      'ongoing': 'En curso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  };

  const getMedalIcon = (medalType: string | null) => {
    if (!medalType) return null;
    const colors: Record<string, string> = {
      'gold': 'text-yellow-400',
      'silver': 'text-gray-300',
      'bronze': 'text-amber-600'
    };
    return <Medal className={`h-5 w-5 ${colors[medalType] || ''}`} />;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Mis Competiciones" userRole="athlete">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mis Competiciones" userRole="athlete">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Competiciones</h1>
          <p className="text-muted-foreground">Tus registros y resultados de competiciones</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Competidas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.completedCompetitions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Medallas</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-yellow-400">🥇{stats.goldMedals}</span>
                    <span className="text-lg font-bold text-gray-300">🥈{stats.silverMedals}</span>
                    <span className="text-lg font-bold text-amber-600">🥉{stats.bronzeMedals}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.upcomingCompetitions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mejor Posición</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.bestPosition ? `#${stats.bestPosition}` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="upcoming">Próximas ({upcomingCompetitions.length})</TabsTrigger>
            <TabsTrigger value="results">Mis Resultados ({results.length})</TabsTrigger>
            <TabsTrigger value="history">Historial ({pastCompetitions.length})</TabsTrigger>
          </TabsList>

          {/* Upcoming Competitions */}
          <TabsContent value="upcoming" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Mis Próximas Competiciones</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingCompetitions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No estás registrado en ninguna competición próxima.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingCompetitions.map((competition) => (
                      <div
                        key={competition.id}
                        className="p-4 rounded-lg bg-muted/30 border border-border"
                      >
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-primary" />
                              <h4 className="font-semibold text-foreground">{competition.name}</h4>
                              <Badge className={getStatusColor(competition.status)}>
                                {getStatusLabel(competition.status)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(parseISO(competition.start_date), "d 'de' MMMM, yyyy", { locale: es })}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {competition.location}
                              </span>
                              {competition.category && (
                                <Badge variant="outline">{competition.category}</Badge>
                              )}
                            </div>
                            {competition.description && (
                              <p className="text-sm text-muted-foreground">{competition.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results */}
          <TabsContent value="results" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Mis Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aún no tienes resultados registrados.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {results.map((result) => (
                      <div
                        key={result.id}
                        className="p-4 rounded-lg bg-muted/30 border border-border"
                      >
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{result.competition_name}</h4>
                              {result.medal_type && getMedalIcon(result.medal_type)}
                              {result.personal_best && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  <Star className="h-3 w-3 mr-1" />
                                  PB
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(parseISO(result.competition_date), "d MMM yyyy", { locale: es })}
                              </span>
                              {result.event_type && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {result.event_type}
                                </span>
                              )}
                              {result.event_location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {result.event_location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 self-start sm:self-center">
                            {result.position && (
                              <div className="text-center">
                                <p className="text-2xl font-bold text-foreground">#{result.position}</p>
                                <p className="text-xs text-muted-foreground">Posición</p>
                              </div>
                            )}
                            {result.points !== null && result.points > 0 && (
                              <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{result.points}</p>
                                <p className="text-xs text-muted-foreground">Puntos</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {result.notes && (
                          <p className="mt-2 text-sm text-muted-foreground italic">"{result.notes}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Historial de Competiciones</CardTitle>
              </CardHeader>
              <CardContent>
                {pastCompetitions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No tienes competiciones pasadas registradas.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pastCompetitions.map((competition) => (
                      <div
                        key={competition.id}
                        className="p-4 rounded-lg bg-muted/30 border border-border"
                      >
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-muted-foreground" />
                              <h4 className="font-semibold text-foreground">{competition.name}</h4>
                              <Badge className={getStatusColor(competition.status)}>
                                {getStatusLabel(competition.status)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(parseISO(competition.start_date), "d MMM yyyy", { locale: es })}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {competition.location}
                              </span>
                              {competition.category && (
                                <Badge variant="outline">{competition.category}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AthleteCompetitions;
