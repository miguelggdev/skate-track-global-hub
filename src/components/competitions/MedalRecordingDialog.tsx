import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Medal, Trophy, Timer } from 'lucide-react';
import { useMedalRecording, useCompetitionEvents, useCompetitionParticipants } from '@/hooks/useMedalRecording';

const medalSchema = z.object({
  athlete_id: z.string().min(1, 'Athlete is required'),
  event_type: z.string().min(1, 'Event type is required'),
  medal_type: z.enum(['gold', 'silver', 'bronze']),
  time_achieved: z.string().optional(),
  event_location: z.string().optional(),
  position: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type MedalFormData = z.infer<typeof medalSchema>;

interface MedalRecordingDialogProps {
  competitionId: string;
  competitionName: string;
}

const SKATING_EVENTS = {
  'Velocidad (Pista Corta)': [
    { value: 'speed_short_track_500m', label: '500m' },
    { value: 'speed_short_track_1000m', label: '1000m' },
    { value: 'speed_short_track_1500m', label: '1500m' },
  ],
  'Relevos (Pista Corta)': [
    { value: 'relay_5000m_men', label: 'Relevo 5000m Masculino' },
    { value: 'relay_3000m_women', label: 'Relevo 3000m Femenino' },
    { value: 'relay_mixed', label: 'Relevo Mixto' },
  ],
  'Velocidad (Pista Larga)': [
    { value: 'speed_200m_time_trial', label: '200m Contra Reloj' },
    { value: 'speed_group_500m_distance', label: '500m + Distancia (Grupal)' },
    { value: 'speed_group_1000m', label: '1000m (Grupal)' },
    { value: 'points_race_5000m', label: '5000m por Puntos' },
    { value: 'elimination_10000m', label: '10000m Eliminación' },
  ],
  'Pruebas de Ruta': [
    { value: 'road_100m', label: '100m' },
    { value: 'road_500m_distance', label: '500m + Distancia' },
    { value: 'road_1000m', label: '1000m' },
    { value: 'road_5000m', label: '5000m' },
    { value: 'road_10000m', label: '10000m' },
    { value: 'road_15000m_elimination', label: '15000m Eliminación' },
    { value: 'road_marathon_42km', label: '42km Maratón' },
  ],
};

export const MedalRecordingDialog = ({ competitionId, competitionName }: MedalRecordingDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { recordMedal } = useMedalRecording();
  const { data: events } = useCompetitionEvents(competitionId);
  const { data: participants } = useCompetitionParticipants(competitionId);

  const form = useForm<MedalFormData>({
    resolver: zodResolver(medalSchema),
    defaultValues: {
      athlete_id: '',
      event_type: '',
      medal_type: 'gold',
      time_achieved: '',
      event_location: '',
      notes: '',
    },
  });

  const onSubmit = async (data: MedalFormData) => {
    try {
      await recordMedal.mutateAsync({
        competition_id: competitionId,
        athlete_id: data.athlete_id,
        event_type: data.event_type,
        medal_type: data.medal_type,
        time_achieved: data.time_achieved,
        event_location: data.event_location,
        position: data.position,
        notes: data.notes,
      });
      setOpen(false);
      form.reset();
    } catch {
      toast({ title: 'Error al registrar medalla', description: 'Por favor intenta nuevamente.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trophy className="mr-2 h-4 w-4" />
          Registrar Medallas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" />
            Registrar Medalla — {competitionName}
          </DialogTitle>
          <DialogDescription>
            Registra las medallas obtenidas por los deportistas en esta competencia
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="athlete_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deportista</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el deportista" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {participants?.map((participant: any) => (
                        <SelectItem key={participant.athlete_id} value={participant.athlete_id}>
                          {participant.athletes?.first_name} {participant.athletes?.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Prueba *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de prueba" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(SKATING_EVENTS).map(([category, events]) => (
                        <SelectGroup key={category}>
                          <SelectLabel>{category}</SelectLabel>
                          {events.map((event) => (
                            <SelectItem key={event.value} value={event.value}>
                              {event.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Medalla</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gold">🥇 Oro</SelectItem>
                      <SelectItem value="silver">🥈 Plata</SelectItem>
                      <SelectItem value="bronze">🥉 Bronce</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time_achieved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo (mm:ss.ms)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Timer className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="01:23.45"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posición</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="event_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lugar (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Pista, recinto o área" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales sobre la actuación..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={recordMedal.isPending}>
                {recordMedal.isPending ? 'Guardando...' : 'Registrar Medalla'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
