import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAthleteTrainingStats } from '@/hooks/useAthleteTrainingStats';
import { useAthleteTraining } from '@/hooks/useAthleteTraining';
import { AthleteWorkoutRegistrationForm } from '@/components/athletes/dashboard/AthleteWorkoutRegistrationForm';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  Target,
  Activity,
  Dumbbell,
  Timer
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

const AthleteTraining = () => {
  const { stats, mySessions, upcomingSessions, historySessions, availableSessions, isLoading, refetch } = useAthleteTrainingStats();
  const { registerForSession, isRegistering } = useAthleteTraining();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const getTrainingTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'inline_skating': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'cycling': 'bg-green-500/20 text-green-400 border-green-500/30',
      'gym': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'recovery': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'competition_prep': 'bg-red-500/20 text-red-400 border-red-500/30',
      'technique': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const getTrainingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'inline_skating': 'Patinaje',
      'cycling': 'Ciclismo',
      'gym': 'Gimnasio',
      'recovery': 'Recuperación',
      'competition_prep': 'Preparación',
      'technique': 'Técnica'
    };
    return labels[type] || type;
  };

  const handleRegister = async (sessionId: string) => {
    await registerForSession({ sessionId });
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Mis Entrenamientos" userRole="athlete">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mis Entrenamientos" userRole="athlete">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Entrenamientos</h1>
            <p className="text-muted-foreground">Gestiona tus sesiones de entrenamiento</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sesiones Totales</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
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
                  <p className="text-sm text-muted-foreground">Tasa de Asistencia</p>
                  <p className="text-2xl font-bold text-foreground">{stats.attendanceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Timer className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Este Mes</p>
                  <p className="text-2xl font-bold text-foreground">{stats.hoursThisMonth}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Calendar className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximas Sesiones</p>
                  <p className="text-2xl font-bold text-foreground">{stats.upcomingSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="upcoming">Próximas ({upcomingSessions.length})</TabsTrigger>
            <TabsTrigger value="available">Disponibles ({availableSessions.length})</TabsTrigger>
            <TabsTrigger value="history">Historial ({historySessions.length})</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          {/* Upcoming Sessions */}
          <TabsContent value="upcoming" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Mis Próximas Sesiones</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No tienes sesiones programadas. Regístrate en una sesión disponible.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col sm:flex-row justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{session.title}</h4>
                            <Badge className={getTrainingTypeColor(session.training_type)}>
                              {getTrainingTypeLabel(session.training_type)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(session.scheduled_at), "EEEE d 'de' MMMM", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(session.scheduled_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                              {session.duration_minutes ? ` — ${session.duration_minutes} min` : ''}
                            </span>
                            {session.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {session.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="self-start sm:self-center">
                          Registrado
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Sessions */}
          <TabsContent value="available" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Sesiones Disponibles para Registro</CardTitle>
              </CardHeader>
              <CardContent>
                {availableSessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay sesiones disponibles para registrarse en este momento.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {availableSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col sm:flex-row justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{session.title}</h4>
                            <Badge className={getTrainingTypeColor(session.training_type)}>
                              {getTrainingTypeLabel(session.training_type)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(session.scheduled_at), "EEEE d 'de' MMMM", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(session.scheduled_at), 'HH:mm')} ({session.duration_minutes ?? 60} min)
                            </span>
                            {session.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {session.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRegister(session.id)}
                          disabled={isRegistering}
                          className="self-start sm:self-center"
                        >
                          Registrarse
                        </Button>
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
                <CardTitle className="text-lg">Mi Historial de Entrenamientos</CardTitle>
              </CardHeader>
              <CardContent>
                {historySessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aún no tienes historial de entrenamientos.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {historySessions.map((session) => (
                      <div
                        key={session.attendance_id || session.id}
                        className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col sm:flex-row justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{session.title}</h4>
                            <Badge className={getTrainingTypeColor(session.training_type)}>
                              {getTrainingTypeLabel(session.training_type)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(session.scheduled_at), "d MMM yyyy", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(session.scheduled_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                              {session.duration_minutes ? ` — ${session.duration_minutes} min` : ''}
                            </span>
                            {session.performance_rating && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                Rendimiento: {session.performance_rating}/10
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {session.attended === true ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Asistió
                            </Badge>
                          ) : session.attended === false ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <XCircle className="h-3 w-3 mr-1" />
                              No asistió
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pendiente</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Training Type Distribution */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Distribución por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.trainingTypeDistribution).length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Sin datos de entrenamientos aún.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.trainingTypeDistribution).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{getTrainingTypeLabel(type)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${(count / stats.attendedSessions) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Sesiones Asistidas</span>
                    <span className="font-bold text-foreground">{stats.attendedSessions}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Tasa de Asistencia</span>
                    <span className="font-bold text-foreground">{stats.attendanceRate}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Rendimiento Promedio</span>
                    <span className="font-bold text-foreground">{stats.averagePerformance}/10</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">Horas Totales (mes)</span>
                    <span className="font-bold text-foreground">{stats.hoursThisMonth}h</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AthleteTraining;
