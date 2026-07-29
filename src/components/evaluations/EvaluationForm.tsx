import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAddEvaluation } from '@/hooks/useEvaluations';
import { cn } from '@/lib/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  athlete_id: z.string().min(1, 'Selecciona un atleta'),
  evaluation_type: z.string().min(1, 'Requerido'),
  evaluation_date: z.string().min(1, 'Requerido'),
  status: z.enum(['pending', 'completed', 'reviewed']),
  speed_score:     z.coerce.number().min(0).max(10).optional(),
  technique_score: z.coerce.number().min(0).max(10).optional(),
  strength_score:  z.coerce.number().min(0).max(10).optional(),
  endurance_score: z.coerce.number().min(0).max(10).optional(),
  overall_score:   z.coerce.number().min(0).max(10).optional(),
  weight_kg:  z.coerce.number().optional(),
  height_cm:  z.coerce.number().optional(),
  strengths:         z.string().optional(),
  areas_to_improve:  z.string().optional(),
  goals:             z.string().optional(),
  coach_notes:       z.string().optional(),
  next_eval_date:    z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Score Input ──────────────────────────────────────────────────────────────

function ScoreInput({ value, onChange, label }: {
  value: number | undefined; onChange: (v: number) => void; label: string;
}) {
  const num = value ?? 0;
  const color = num >= 8 ? 'text-green-600' : num >= 6 ? 'text-blue-600' : num >= 4 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className={cn('text-sm font-bold tabular-nums', color)}>{num.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={num}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full accent-orange-500 cursor-pointer"
        />
        <Input
          type="number"
          min={0}
          max={10}
          step={0.5}
          value={num}
          onChange={e => onChange(Number(e.target.value))}
          className="w-16 h-7 text-xs text-center"
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>0</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  defaultAthleteId?: string;
}

export function EvaluationForm({ open, onClose, defaultAthleteId }: Props) {
  const addEval = useAddEvaluation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      athlete_id: defaultAthleteId ?? '',
      evaluation_type: 'integral',
      evaluation_date: new Date().toISOString().slice(0, 10),
      status: 'completed',
      speed_score: 5,
      technique_score: 5,
      strength_score: 5,
      endurance_score: 5,
      overall_score: 5,
    },
  });

  useEffect(() => {
    if (defaultAthleteId) form.setValue('athlete_id', defaultAthleteId);
  }, [defaultAthleteId, form]);

  // Auto-calc IMC when weight/height change
  const watchWeight = form.watch('weight_kg');
  const watchHeight = form.watch('height_cm');
  const imc = watchWeight && watchHeight
    ? (watchWeight / Math.pow(watchHeight / 100, 2)).toFixed(1)
    : null;

  // Auto-calc overall as average of 4 scores
  const scores = form.watch(['speed_score', 'technique_score', 'strength_score', 'endurance_score']);
  useEffect(() => {
    const valid = scores.filter((s): s is number => s !== undefined && !isNaN(s));
    if (valid.length === 4) {
      const avg = valid.reduce((a, b) => a + b, 0) / 4;
      form.setValue('overall_score', Math.round(avg * 10) / 10);
    }
  }, [scores, form]);

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-active-list'],
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

  const onSubmit = async (values: FormValues) => {
    await addEval.mutateAsync({
      athlete_id: values.athlete_id,
      evaluation_type: values.evaluation_type,
      evaluation_date: values.evaluation_date,
      status: values.status,
      speed_score:     values.speed_score ?? null,
      technique_score: values.technique_score ?? null,
      strength_score:  values.strength_score ?? null,
      endurance_score: values.endurance_score ?? null,
      overall_score:   values.overall_score ?? null,
      weight_kg:  values.weight_kg ?? null,
      height_cm:  values.height_cm ?? null,
      imc: imc ? Number(imc) : null,
      strengths:        values.strengths || null,
      areas_to_improve: values.areas_to_improve || null,
      goals:            values.goals || null,
      coach_notes:      values.coach_notes || null,
      next_eval_date:   values.next_eval_date || null,
    });
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-orange-500" />
            Nueva Evaluación
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Datos básicos */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="athlete_id" render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Atleta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {athletes.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.last_name}, {a.first_name}
                          <span className="text-muted-foreground ml-1 text-xs">({a.category})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="evaluation_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de evaluación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="integral">Integral</SelectItem>
                      <SelectItem value="fisica">Física</SelectItem>
                      <SelectItem value="tecnica">Técnica</SelectItem>
                      <SelectItem value="seguimiento">Seguimiento</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="evaluation_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de evaluación</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="reviewed">Revisada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <Separator />

            {/* Scores */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Puntuaciones (0 – 10)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="speed_score" render={({ field }) => (
                  <ScoreInput label="⚡ Velocidad" value={field.value} onChange={field.onChange} />
                )} />
                <FormField control={form.control} name="technique_score" render={({ field }) => (
                  <ScoreInput label="🎯 Técnica" value={field.value} onChange={field.onChange} />
                )} />
                <FormField control={form.control} name="strength_score" render={({ field }) => (
                  <ScoreInput label="💪 Fuerza" value={field.value} onChange={field.onChange} />
                )} />
                <FormField control={form.control} name="endurance_score" render={({ field }) => (
                  <ScoreInput label="🏃 Resistencia" value={field.value} onChange={field.onChange} />
                )} />
              </div>
              {/* Overall (auto) */}
              <div className="mt-4 bg-orange-500/10 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Score General (promedio)</span>
                <FormField control={form.control} name="overall_score" render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-orange-500">
                      {(field.value ?? 0).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">/ 10</span>
                  </div>
                )} />
              </div>
            </div>

            <Separator />

            {/* Medidas físicas */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Medidas Físicas
              </p>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="weight_kg" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl><Input type="number" min={20} max={200} step={0.1} placeholder="65.0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="height_cm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Talla (cm)</FormLabel>
                    <FormControl><Input type="number" min={100} max={220} placeholder="170" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <FormLabel>IMC</FormLabel>
                  <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-semibold text-muted-foreground">
                    {imc ?? '—'}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Texto libre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="strengths" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fortalezas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Aspectos positivos del deportista…" rows={3} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="areas_to_improve" render={({ field }) => (
                <FormItem>
                  <FormLabel>Áreas a mejorar</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Aspectos a trabajar…" rows={3} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="goals" render={({ field }) => (
                <FormItem>
                  <FormLabel>Metas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Objetivos para el próximo período…" rows={3} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="coach_notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas del entrenador</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observaciones adicionales…" rows={3} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="next_eval_date" render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Próxima evaluación</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={addEval.isPending}>
                {addEval.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando…</>
                  : 'Guardar evaluación'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
