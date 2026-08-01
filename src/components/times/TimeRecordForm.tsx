import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, CheckCircle2, Loader2, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { parseTimeInput, formatTimeMs } from '@/lib/time-formatter';
import { useRaceEvents, useAddTimeRecord } from '@/hooks/useTimeRecords';
import { useCompetitions } from '@/hooks/useCompetitions';

const schema = z.object({
  athlete_id: z.string().uuid('Selecciona un atleta'),
  race_event_id: z.string().uuid('Selecciona una prueba'),
  context: z.enum(['training', 'competition']),
  competition_id: z.string().optional(),
  time_input: z.string().min(1, 'Ingresa el tiempo'),
  position: z.coerce.number().int().min(1).optional().or(z.literal('')),
  conditions: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultAthleteId?: string;
}

export function TimeRecordForm({ defaultAthleteId }: Props) {
  const [parsedMs, setParsedMs] = useState<number | null>(null);
  const [parseError, setParseError] = useState(false);

  const { data: raceEvents = [] } = useRaceEvents();
  const { data: competitions = [] } = useCompetitions();
  const { data: athletes = [], isLoading: athletesLoading } = useQuery({
    queryKey: ['athletes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category')
        .eq('status', 'active')
        .order('last_name');
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: trainingSessions = [] } = useQuery({
    queryKey: ['training-sessions-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id, title, scheduled_at')
        .order('scheduled_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const addRecord = useAddTimeRecord();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      athlete_id: defaultAthleteId ?? '',
      race_event_id: '',
      context: 'training',
      competition_id: '',
      time_input: '',
      position: '',
      conditions: '',
      notes: '',
    },
  });

  const context = form.watch('context');
  const timeInput = form.watch('time_input');

  React.useEffect(() => {
    const ms = parseTimeInput(timeInput);
    setParsedMs(ms);
    setParseError(timeInput.length > 0 && ms === null);
  }, [timeInput]);

  const onSubmit = async (data: FormData) => {
    const ms = parseTimeInput(data.time_input);
    if (!ms) return;

    await addRecord.mutateAsync({
      athlete_id: data.athlete_id,
      race_event_id: data.race_event_id,
      competition_id: data.context === 'competition' && data.competition_id ? data.competition_id : null,
      time_ms: ms,
      time_formatted: formatTimeMs(ms),
      position: data.position ? Number(data.position) : null,
      conditions: data.conditions || null,
      notes: data.notes || null,
      recorded_by: currentUser?.id ?? null,
    });

    form.reset({ ...form.getValues(), time_input: '', position: '', notes: '', conditions: '' });
    setParsedMs(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Timer className="h-4 w-4 text-primary" />
          Registrar Tiempo Cronometrado
        </CardTitle>
        <CardDescription>
          El sistema detecta automáticamente si es récord personal al guardar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Atleta */}
              <FormField control={form.control} name="athlete_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Atleta *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!!defaultAthleteId || athletesLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar atleta…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {athletes.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.last_name}, {a.first_name}
                          {a.category && <span className="text-muted-foreground ml-1">({a.category})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Prueba */}
              <FormField control={form.control} name="race_event_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prueba *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prueba…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {raceEvents.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                          {e.distance_m && <span className="text-muted-foreground ml-1">({e.distance_m}m)</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Contexto */}
            <FormField control={form.control} name="context" render={({ field }) => (
              <FormItem>
                <FormLabel>Contexto</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="training">Entrenamiento</SelectItem>
                    <SelectItem value="competition">Competencia</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Competencia (solo si context = competition) */}
            {context === 'competition' && (
              <FormField control={form.control} name="competition_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Competencia</FormLabel>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar competencia (opcional)…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {competitions.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tiempo */}
              <FormField control={form.control} name="time_input" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiempo *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="1:23.456 ó 83.456"
                        className="font-mono pr-24"
                        {...field}
                      />
                      {parsedMs !== null && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-mono font-medium">
                          {formatTimeMs(parsedMs)}s
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Formato: <code>m:ss.ms</code> (ej. <code>1:23.456</code>) o solo segundos (<code>83.456</code>)
                  </FormDescription>
                  {parseError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Formato inválido
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              {/* Posición */}
              <FormField control={form.control} name="position" render={({ field }) => (
                <FormItem>
                  <FormLabel>Posición</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="1°, 2°…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Condiciones */}
            <FormField control={form.control} name="conditions" render={({ field }) => (
              <FormItem>
                <FormLabel>Condiciones de pista</FormLabel>
                <FormControl>
                  <Input placeholder="Seca, húmeda, viento en contra…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Notas */}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea placeholder="Observaciones adicionales…" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Preview antes de guardar */}
            {parsedMs !== null && form.watch('athlete_id') && form.watch('race_event_id') && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">Tiempo a registrar: </span>
                  <span className="font-mono text-primary font-semibold">{formatTimeMs(parsedMs)}s</span>
                  <span className="text-muted-foreground ml-2">
                    ({parsedMs.toLocaleString('es-CO')} ms)
                  </span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={addRecord.isPending || !parsedMs || parseError}
              className="w-full sm:w-auto"
            >
              {addRecord.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar tiempo
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
