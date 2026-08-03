import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserCheck, 
  Users, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { AttendanceRegistrationForm } from './AttendanceRegistrationForm';
import { useAttendanceManagement } from '@/hooks/useAttendanceManagement';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrainingSession {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes?: number;
  training_type: string;
  location?: string;
  description?: string;
}

export const AttendanceManagement: React.FC = () => {
  const { profile } = useUserProfile();
  const { 
    attendanceRecords, 
    isLoading, 
    canRegisterAttendance, 
    canEditAttendance,
    updateAttendance,
    deleteAttendance 
  } = useAttendanceManagement();
  
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('week');

  // Fetch training sessions for registration
  const { data: trainingSessions = [] } = useQuery({
    queryKey: ['training-sessions-for-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .gte('scheduled_at', new Date().toISOString().split('T')[0])
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data as TrainingSession[];
    },
  });

  // Filter attendance records
  const filteredRecords = attendanceRecords?.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'present' && record.attended) ||
      (statusFilter === 'absent' && !record.attended);

    return matchesSearch && matchesStatus;
  }) ?? [];

  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false);
    setSelectedSession(null);
  };

  const getAttendanceStatusBadge = (attended: boolean) => {
    return attended ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Presente
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <Minus className="h-3 w-3 mr-1" />
        Ausente
      </Badge>
    );
  };

  const getPerformanceIcon = (rating?: number) => {
    if (!rating) return null;
    if (rating >= 8) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (rating >= 6) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (!canRegisterAttendance()) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No tienes permisos para gestionar la asistencia
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Asistencia</h2>
          <p className="text-muted-foreground">
            Registra y gestiona la asistencia de los atletas a los entrenamientos
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Asistencia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Seleccionar Sesión de Entrenamiento</DialogTitle>
              </DialogHeader>
              
              {!selectedSession ? (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {trainingSessions.map((session) => (
                      <Card 
                        key={session.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedSession(session)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{session.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(session.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                {session.duration_minutes ? ` — ${session.duration_minutes} min` : ''}
                              </p>
                              {session.location && (
                                <p className="text-sm text-muted-foreground">📍 {session.location}</p>
                              )}
                            </div>
                            <Badge variant="outline">
                              {session.training_type}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <AttendanceRegistrationForm
                  trainingSession={selectedSession}
                  onSuccess={handleRegistrationSuccess}
                  onCancel={() => {
                    setSelectedSession(null);
                    setShowRegistrationForm(false);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID o notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="present">Presentes</SelectItem>
                <SelectItem value="absent">Ausentes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="all">Todo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registros de Asistencia ({filteredRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Cargando registros...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron registros de asistencia
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Sesión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Rendimiento</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.created_at), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.athlete_id}
                      </TableCell>
                      <TableCell>
                        {record.training_session_id}
                      </TableCell>
                      <TableCell>
                        {getAttendanceStatusBadge(record.attended)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPerformanceIcon(record.performance_rating)}
                          {record.performance_rating ? (
                            <span className="text-sm">{record.performance_rating}/10</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {canEditAttendance(record) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {/* Handle edit */}}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {profile?.role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAttendance(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};