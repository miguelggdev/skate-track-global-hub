import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, Dumbbell, TrendingUp } from 'lucide-react';
import { useAthleteTraining } from '@/hooks/useAthleteTraining';
import { AthleteWorkoutRegistrationForm } from './AthleteWorkoutRegistrationForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const TrainingTab = () => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const {
    availableSessions,
    attendanceRecords,
    isLoadingSessions,
    isLoadingAttendance,
    isRegisteredForSession,
  } = useAthleteTraining();

  const upcomingSessions = availableSessions?.filter(session =>
    new Date(session.scheduled_at) >= new Date()
  ) ?? [];

  const recentAttendance = attendanceRecords?.slice(0, 5) ?? [];

  const handleRegisterClick = (sessionId: string) => {
    setSelectedSession(sessionId);
    setShowRegistrationForm(true);
  };

  const getTrainingTypeColor = (type: string) => {
    const colors = {
      'tecnico': 'bg-blue-100 text-blue-800',
      'fisico': 'bg-green-100 text-green-800',
      'tactico': 'bg-purple-100 text-purple-800',
      'mental': 'bg-orange-100 text-orange-800',
      'recuperacion': 'bg-gray-100 text-gray-800',
      'competicion': 'bg-red-100 text-red-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (showRegistrationForm && selectedSession) {
    return (
      <AthleteWorkoutRegistrationForm
        sessionId={selectedSession}
        onClose={() => {
          setShowRegistrationForm(false);
          setSelectedSession(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Entrenamientos</h2>
          <p className="text-muted-foreground">
            Gestiona tu asistencia y visualiza tu progreso
          </p>
        </div>
        <Button 
          onClick={() => setShowRegistrationForm(true)}
          className="flex items-center gap-2"
        >
          <Dumbbell className="h-4 w-4" />
          Registrarse para Entrenamiento
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Próximos Entrenamientos</TabsTrigger>
          <TabsTrigger value="history">Mi Historial</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoadingSessions ? (
            <Card>
              <CardContent className="p-6">
                <p>Cargando entrenamientos...</p>
              </CardContent>
            </Card>
          ) : upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No hay entrenamientos programados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(session.scheduled_at), 'PPP', { locale: es })}
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
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTrainingTypeColor(session.training_type)}>
                          {session.training_type}
                        </Badge>
                        {session.max_athletes && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Max {session.max_athletes}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {session.description}
                      </p>
                    )}
                    <div className="flex justify-end">
                      {isRegisteredForSession(session.id) ? (
                        <Badge variant="secondary">Ya registrado</Badge>
                      ) : (
                        <Button
                          onClick={() => handleRegisterClick(session.id)}
                          size="sm"
                        >
                          Registrarse
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoadingAttendance ? (
            <Card>
              <CardContent className="p-6">
                <p>Cargando historial...</p>
              </CardContent>
            </Card>
          ) : recentAttendance.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No tienes historial de entrenamientos</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recentAttendance.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {record.training_sessions.title}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(record.training_sessions.scheduled_at), 'PPP', { locale: es })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={record.attended ? "default" : "secondary"}
                        >
                          {record.attended ? "Asistió" : "No asistió"}
                        </Badge>
                        {record.performance_rating && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {record.performance_rating}/10
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {record.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        <strong>Notas:</strong> {record.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Entrenamientos
                </CardTitle>
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attendanceRecords?.length ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Asistencias
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attendanceRecords?.filter(r => r.attended).length ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Promedio Rendimiento
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attendanceRecords?.length > 0
                    ? (
                        attendanceRecords
                          .filter(r => r.performance_rating)
                          .reduce((sum, r) => sum + (r.performance_rating ?? 0), 0) /
                        attendanceRecords.filter(r => r.performance_rating).length
                      ).toFixed(1)
                    : '0.0'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};