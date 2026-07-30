import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const editTrainingSchema = z.object({
  title: z.string().min(1, 'El nombre es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
  start_time: z.string().min(1, 'La hora de inicio es requerida'),
  end_time: z.string().min(1, 'La hora de fin es requerida'),
  training_type: z.enum(['technical', 'physical', 'mental', 'recovery', 'gym', 'road_skating', 'track_skating', 'bicycle', 'static_bicycle', 'simulator']),
  location: z.string().optional(),
  description: z.string().optional(),
  max_athletes: z.string().optional(),
});

type EditTrainingFormData = z.infer<typeof editTrainingSchema>;

interface EditTrainingDialogProps {
  children: React.ReactNode;
  session: {
    id: string;
    title: string;
    scheduled_at: string;
    duration_minutes?: number;
    training_type: string;
    location?: string;
    description?: string;
    max_athletes?: number;
  };
}

export default function EditTrainingDialog({ children, session }: EditTrainingDialogProps) {
  const [open, setOpen] = useState(false);
  const { updateSession, isUpdating } = useTrainingSessions();
  const { toast } = useToast();

  const sessionDt = new Date(session.scheduled_at);
  const sessionEndDt = new Date(sessionDt.getTime() + (session.duration_minutes || 60) * 60_000);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EditTrainingFormData>({
    resolver: zodResolver(editTrainingSchema),
    defaultValues: {
      title: session.title,
      date: format(sessionDt, 'yyyy-MM-dd'),
      start_time: format(sessionDt, 'HH:mm'),
      end_time: format(sessionEndDt, 'HH:mm'),
      training_type: session.training_type as any,
      location: session.location || '',
      description: session.description || '',
      max_athletes: session.max_athletes?.toString() || '',
    }
  });

  const trainingType = watch('training_type');

  const onSubmit = (data: EditTrainingFormData) => {
    const [startH, startM] = data.start_time.split(':').map(Number);
    const [endH, endM] = data.end_time.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    const updates = {
      title: data.title,
      scheduled_at: `${data.date}T${data.start_time}:00`,
      duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
      training_type: data.training_type,
      location: data.location || null,
      description: data.description || null,
      max_athletes: data.max_athletes ? parseInt(data.max_athletes) : null,
    };

    updateSession({ sessionId: session.id, updates }, {
      onSuccess: () => {
        setOpen(false);
        toast({
          title: 'Sesión actualizada',
          description: 'La sesión de entrenamiento ha sido actualizada exitosamente',
        });
      }
    });
  };

  const trainingTypes = [
    { value: 'technical', label: 'Técnico' },
    { value: 'physical', label: 'Físico' },
    { value: 'mental', label: 'Mental' },
    { value: 'recovery', label: 'Recuperación' },
    { value: 'gym', label: 'Gimnasio' },
    { value: 'road_skating', label: 'Patinaje en Ruta' },
    { value: 'track_skating', label: 'Patinaje en Pista' },
    { value: 'bicycle', label: 'Bicicleta' },
    { value: 'static_bicycle', label: 'Bicicleta Estática' },
    { value: 'simulator', label: 'Simulador' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Sesión de Entrenamiento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre de la Sesión *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ej: Entrenamiento de Velocidad"
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="training_type">Tipo de Entrenamiento *</Label>
              <Select
                value={trainingType}
                onValueChange={(value) => setValue('training_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {trainingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.training_type && (
                <p className="text-sm text-red-600">{errors.training_type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
              />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Hora de Inicio *</Label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time')}
              />
              {errors.start_time && (
                <p className="text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Hora de Fin *</Label>
              <Input
                id="end_time"
                type="time"
                {...register('end_time')}
              />
              {errors.end_time && (
                <p className="text-sm text-red-600">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Ej: Pista Principal, Gimnasio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_athletes">Máximo de Participantes</Label>
              <Input
                id="max_athletes"
                type="number"
                min="1"
                {...register('max_athletes')}
                placeholder="Ej: 20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe los objetivos y actividades de la sesión..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="argon-gradient-blue text-white"
              disabled={isUpdating}
            >
              {isUpdating ? 'Actualizando...' : 'Actualizar Sesión'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
