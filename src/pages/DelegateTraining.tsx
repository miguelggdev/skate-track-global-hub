import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useDelegateAthletes } from '@/hooks/useDelegateAthletes';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

const trainingTypeLabels: Record<string, string> = {
  technical: 'Técnico',
  physical: 'Físico',
  mental: 'Mental',
  recovery: 'Recuperación',
  gym: 'Gimnasio',
  road_skating: 'Ruta',
  track_skating: 'Pista',
  bicycle: 'Bicicleta',
  static_bicycle: 'Bicicleta Estática',
  simulator: 'Simulador',
};

const DelegateTraining = () => {
  const { trainingSessions: sessions, isLoading } = useTrainingSessions();
  const { data: athletes } = useDelegateAthletes();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const todaySessions = sessions?.filter(s => isToday(parseISO(s.date))) || [];
  const upcomingSessions = sessions?.filter(s => isFuture(parseISO(s.date))) || [];
  const pastSessions = sessions?.filter(s => isPast(parseISO(s.date)) && !isToday(parseISO(s.date))).slice(0, 10) || [];

  const SessionCard = ({ session }: { session: any }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSession(session.id)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{session.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {trainingTypeLabels[session.training_type] || session.training_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><Calendar className="inline h-3 w-3 mr-1" /> {format(parseISO(session.date), 'EEEE, d MMMM', { locale: es })}</p>
          {session.location && <p>📍 {session.location}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Entrenamientos" userRole="delegate">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Entrenamientos
            </h2>
            <p className="text-muted-foreground">
              Visualiza y gestiona la asistencia a entrenamientos
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySessions.length}</div>
              <p className="text-sm text-muted-foreground">sesiones programadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingSessions.slice(0, 7).length}</div>
              <p className="text-sm text-muted-foreground">sesiones próximas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Atletas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{athletes?.length || 0}</div>
              <p className="text-sm text-muted-foreground">atletas activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions?.length || 0}</div>
              <p className="text-sm text-muted-foreground">sesiones registradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions */}
        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Hoy ({todaySessions.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Próximas ({upcomingSessions.length})</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-36" />
                ))}
              </div>
            ) : todaySessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaySessions.map(session => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay entrenamientos programados para hoy</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-36" />
                ))}
              </div>
            ) : upcomingSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSessions.slice(0, 9).map(session => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay entrenamientos próximos</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {isLoading ? (
              <Skeleton className="h-96" />
            ) : pastSessions.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Sesión</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Ubicación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastSessions.map(session => (
                        <TableRow key={session.id}>
                          <TableCell>
                            {format(parseISO(session.date), 'd MMM yyyy', { locale: es })}
                          </TableCell>
                          <TableCell className="font-medium">{session.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {trainingTypeLabels[session.training_type] || session.training_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {session.location || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay historial de entrenamientos</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DelegateTraining;
