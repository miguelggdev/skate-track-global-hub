import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Clock, Users, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useAthletes } from '@/hooks/useAthletes';
import { useAttendanceManagement } from '@/hooks/useAttendanceManagement';
import { useUserProfile } from '@/hooks/useUserProfile';

const attendanceSchema = z.object({
  athlete_attendances: z.array(z.object({
    athlete_id: z.string(),
    attended: z.boolean(),
    performance_rating: z.number().min(1).max(10).optional(),
    notes: z.string().optional(),
  })),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

interface AttendanceRegistrationFormProps {
  trainingSession: {
    id: string;
    name: string;
    date: string;
    start_time: string;
    end_time: string;
    training_type: string;
    location?: string;
    description?: string;
    max_participants?: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TRAINING_TYPE_LABELS = {
  technical: 'Técnico',
  physical: 'Físico',
  mental: 'Mental',
  recovery: 'Recuperación',
  gym: 'Gimnasio',
  road_skating: 'Patinaje en Ruta',
  track_skating: 'Patinaje en Pista',
  bicycle: 'Bicicleta',
  static_bicycle: 'Bicicleta Estática',
  simulator: 'Simulador',
};

export const AttendanceRegistrationForm: React.FC<AttendanceRegistrationFormProps> = ({
  trainingSession,
  onSuccess,
  onCancel,
}) => {
  const { profile } = useUserProfile();
  const { data: athletes = [] } = useAthletes();
  const { registerAttendance, isRegistering, canRegisterAttendance } = useAttendanceManagement();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      athlete_attendances: athletes.map(athlete => ({
        athlete_id: athlete.id,
        attended: false,
        performance_rating: undefined,
        notes: '',
      })),
    },
  });

  // Filter athletes based on category and level
  const filteredAthletes = athletes.filter(athlete => {
    if (categoryFilter !== 'all' && athlete.category !== categoryFilter) return false;
    if (levelFilter !== 'all' && athlete.level !== levelFilter) return false;
    return true;
  });

  const handleSubmit = async (data: AttendanceFormData) => {
    if (!canRegisterAttendance()) {
      return;
    }

    for (const attendance of data.athlete_attendances) {
      if (attendance.attended || attendance.performance_rating || attendance.notes) {
        await registerAttendance({
          training_session_id: trainingSession.id,
          athlete_id: attendance.athlete_id,
          attended: attendance.attended,
          performance_rating: attendance.performance_rating,
          notes: attendance.notes,
        });
      }
    }

    onSuccess?.();
  };

  const calculateDuration = () => {
    const start = new Date(`2000-01-01T${trainingSession.start_time}`);
    const end = new Date(`2000-01-01T${trainingSession.end_time}`);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const toggleAllAttendance = (attended: boolean) => {
    const currentValues = form.getValues();
    const updatedAttendances = currentValues.athlete_attendances.map(attendance => ({
      ...attendance,
      attended,
    }));
    form.setValue('athlete_attendances', updatedAttendances);
  };

  if (!canRegisterAttendance()) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No tienes permisos para registrar asistencia
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Registro de Asistencia
        </CardTitle>
        
        {/* Training Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{trainingSession.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(trainingSession.date), 'dd/MM/yyyy', { locale: es })} - 
              {trainingSession.start_time} a {trainingSession.end_time} ({calculateDuration()})
            </div>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline">
              {TRAINING_TYPE_LABELS[trainingSession.training_type as keyof typeof TRAINING_TYPE_LABELS]}
            </Badge>
            {trainingSession.location && (
              <div className="text-sm text-muted-foreground">
                📍 {trainingSession.location}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Categoría:</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="escuela">Escuela</SelectItem>
                    <SelectItem value="menores">Menores</SelectItem>
                    <SelectItem value="transicion">Transición</SelectItem>
                    <SelectItem value="prejuvenil">Prejuvenil</SelectItem>
                    <SelectItem value="juvenil">Juvenil</SelectItem>
                    <SelectItem value="mayores">Mayores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Nivel:</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="escuela">Escuela</SelectItem>
                    <SelectItem value="escuela_menores">Escuela Menores</SelectItem>
                    <SelectItem value="transicion">Transición</SelectItem>
                    <SelectItem value="pre_juvenil">Pre Juvenil</SelectItem>
                    <SelectItem value="juvenil_primer_ano">Juvenil 1er Año</SelectItem>
                    <SelectItem value="juvenil_segundo_ano">Juvenil 2do Año</SelectItem>
                    <SelectItem value="juvenil_tercer_ano">Juvenil 3er Año</SelectItem>
                    <SelectItem value="mayores_unica">Mayores Única</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 ml-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleAllAttendance(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Todos Presentes
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleAllAttendance(false)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Todos Ausentes
                </Button>
              </div>
            </div>

            <Separator />

            {/* Athlete List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Atletas ({filteredAthletes.length})
              </h3>
              
              <div className="grid gap-4">
                {filteredAthletes.map((athlete, index) => {
                  const fieldIndex = athletes.findIndex(a => a.id === athlete.id);
                  
                  return (
                    <Card key={athlete.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        {/* Athlete Info */}
                        <div className="space-y-1">
                          <div className="font-medium">
                            {athlete.first_name} {athlete.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {athlete.category} - {athlete.level}
                          </div>
                        </div>

                        {/* Attendance Checkbox */}
                        <FormField
                          control={form.control}
                          name={`athlete_attendances.${fieldIndex}.attended`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">
                                {field.value ? 'Presente' : 'Ausente'}
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        {/* Performance Rating */}
                        <FormField
                          control={form.control}
                          name={`athlete_attendances.${fieldIndex}.performance_rating`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Rendimiento (1-10)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  placeholder="Opcional"
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Notes */}
                        <FormField
                          control={form.control}
                          name={`athlete_attendances.${fieldIndex}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Notas</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Observaciones..."
                                  className="min-h-[60px]"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isRegistering}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isRegistering}
              >
                {isRegistering ? 'Registrando...' : 'Registrar Asistencia'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};