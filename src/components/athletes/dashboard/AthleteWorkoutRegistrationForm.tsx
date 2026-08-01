import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { useAthleteTraining } from '@/hooks/useAthleteTraining';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const registrationSchema = z.object({
  sessionId: z.string().min(1, 'Debes seleccionar una sesión'),
  notes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface AthleteWorkoutRegistrationFormProps {
  sessionId?: string;
  onClose: () => void;
}

export const AthleteWorkoutRegistrationForm: React.FC<AthleteWorkoutRegistrationFormProps> = ({
  sessionId,
  onClose,
}) => {
  const { 
    availableSessions, 
    registerForSession, 
    isRegistering,
    isRegisteredForSession 
  } = useAthleteTraining();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      sessionId: sessionId ?? '',
      notes: '',
    },
  });

  const selectedSessionId = form.watch('sessionId');
  const selectedSession = availableSessions?.find(s => s.id === selectedSessionId);

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      await registerForSession({
        sessionId: data.sessionId,
        notes: data.notes,
      });
      onClose();
    } catch (error) {
      // Error is handled in the hook
    }
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

  const availableUnregisteredSessions = availableSessions?.filter(session =>
    !isRegisteredForSession(session.id) &&
    new Date(session.scheduled_at) >= new Date()
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Registrarse para Entrenamiento</h2>
          <p className="text-muted-foreground">
            Selecciona una sesión de entrenamiento y confirma tu asistencia
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de Registro</CardTitle>
          <CardDescription>
            Completa los datos para registrarte en una sesión de entrenamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sesión de Entrenamiento *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!!sessionId} // Disable if sessionId is pre-selected
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una sesión" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnregisteredSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium">{session.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(session.scheduled_at), 'PPP HH:mm', { locale: es })}
                                </div>
                              </div>
                              <Badge className={getTrainingTypeColor(session.training_type)}>
                                {session.training_type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {availableUnregisteredSessions.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No hay sesiones disponibles para registro
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {selectedSession && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedSession.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(selectedSession.scheduled_at), 'PPP', { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(selectedSession.scheduled_at), 'HH:mm')} ({selectedSession.duration_minutes ?? 60} min)
                          </span>
                          {selectedSession.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {selectedSession.location}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={getTrainingTypeColor(selectedSession.training_type)}>
                        {selectedSession.training_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  {selectedSession.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {selectedSession.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas u Objetivos (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Escribe tus objetivos para esta sesión, estado físico actual, o cualquier nota relevante..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isRegistering}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isRegistering || !selectedSession}
                  className="flex-1"
                >
                  {isRegistering ? 'Registrando...' : 'Confirmar Registro'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};