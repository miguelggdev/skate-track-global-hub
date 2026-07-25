import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Plus, Edit, Eye, Medal, Download, Calendar, MapPin, Users } from 'lucide-react';
import { useCompetitions } from '@/hooks/useCompetitions';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { AddCompetitionDialog } from '@/components/competitions/AddCompetitionDialog';
import { EditCompetitionDialog } from '@/components/competitions/EditCompetitionDialog';
import { MedalRecordingDialog } from '@/components/competitions/MedalRecordingDialog';

const statusLabels: Record<string, string> = {
  upcoming: 'Próxima',
  ongoing: 'En Curso',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  upcoming: 'default',
  ongoing: 'secondary',
  completed: 'outline',
  cancelled: 'destructive',
};

const DelegateCompetitions = () => {
  const { data: competitions, isLoading } = useCompetitions();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [medalDialogOpen, setMedalDialogOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingCompetitions = competitions?.filter(c => c.status === 'upcoming' || c.status === 'ongoing') || [];
  const pastCompetitions = competitions?.filter(c => c.status === 'completed') || [];

  const handleEdit = (competition: any) => {
    setSelectedCompetition(competition);
    setEditDialogOpen(true);
  };

  const handleMedals = (competition: any) => {
    setSelectedCompetition(competition);
    setMedalDialogOpen(true);
  };

  const CompetitionCard = ({ competition }: { competition: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{competition.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(competition.start_date), 'd MMM yyyy', { locale: es })}
              {competition.end_date !== competition.start_date && (
                <> - {format(parseISO(competition.end_date), 'd MMM yyyy', { locale: es })}</>
              )}
            </CardDescription>
          </div>
          <Badge variant={statusColors[competition.status] || 'secondary'}>
            {statusLabels[competition.status] || competition.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            {competition.location}
          </div>
          {competition.category && (
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              Categoría: {competition.category}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(competition)}>
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          {competition.status === 'completed' && (
            <Button size="sm" variant="outline" onClick={() => handleMedals(competition)}>
              <Medal className="h-3 w-3 mr-1" />
              Medallas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Gestión de Competencias" userRole="delegate">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              Competencias
            </h2>
            <p className="text-muted-foreground">
              Gestiona las competencias del club
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Competencia
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Competencias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{competitions?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Próximas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{upcomingCompetitions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{pastCompetitions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {competitions?.filter(c => c.status === 'ongoing').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Competitions List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Próximas</TabsTrigger>
            <TabsTrigger value="past">Finalizadas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : upcomingCompetitions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingCompetitions.map(competition => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay competencias próximas</p>
                  <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Competencia
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : pastCompetitions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastCompetitions.map(competition => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay competencias finalizadas</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <Skeleton className="h-96" />
            ) : competitions && competitions.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competencia</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitions.map(competition => (
                        <TableRow key={competition.id}>
                          <TableCell className="font-medium">{competition.name}</TableCell>
                          <TableCell>
                            {format(parseISO(competition.start_date), 'd MMM yyyy', { locale: es })}
                          </TableCell>
                          <TableCell>{competition.location}</TableCell>
                          <TableCell>
                            <Badge variant={statusColors[competition.status] || 'secondary'}>
                              {statusLabels[competition.status] || competition.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(competition)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {competition.status === 'completed' && (
                                <Button size="sm" variant="ghost" onClick={() => handleMedals(competition)}>
                                  <Medal className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay competencias registradas</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Note: Competition dialogs would need props adjustment based on actual component interfaces */}
      </div>
    </DashboardLayout>
  );
};

export default DelegateCompetitions;
