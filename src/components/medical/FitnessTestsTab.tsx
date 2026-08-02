import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Activity, Plus, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FitnessTest {
  id: string;
  athlete_id: string;
  test_date: string;
  evaluator: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  resting_hr: number | null;
  max_hr: number | null;
  vo2max: number | null;
  flexibility_cm: number | null;
  leg_press_kg: number | null;
  bench_press_kg: number | null;
  plank_sec: number | null;
  sprint_30m_sec: number | null;
  cooper_m: number | null;
  notes: string | null;
  created_at: string;
}

const optionalNum = z.preprocess(
  v => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().optional(),
);

const schema = z.object({
  test_date:      z.string().min(1, 'Fecha requerida'),
  evaluator:      z.string().optional(),
  weight_kg:      optionalNum,
  height_cm:      optionalNum,
  body_fat_pct:   optionalNum,
  resting_hr:     optionalNum,
  max_hr:         optionalNum,
  vo2max:         optionalNum,
  flexibility_cm: optionalNum,
  leg_press_kg:   optionalNum,
  bench_press_kg: optionalNum,
  plank_sec:      optionalNum,
  sprint_30m_sec: optionalNum,
  cooper_m:       optionalNum,
  notes:          z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function trendIcon(current: number | null, prev: number | null, higherIsBetter = true) {
  if (current === null || prev === null) return null;
  const diff = current - prev;
  if (Math.abs(diff) < 0.01) return <Minus className="h-3 w-3 text-muted-foreground" />;
  const positive = higherIsBetter ? diff > 0 : diff < 0;
  return positive
    ? <TrendingUp className="h-3 w-3 text-emerald-500" />
    : <TrendingDown className="h-3 w-3 text-red-500" />;
}

type FieldGroup = {
  section: string;
  fields: { key: keyof FitnessTest; label: string; unit: string; higherIsBetter?: boolean }[];
};

const FIELD_GROUPS: FieldGroup[] = [
  {
    section: 'Composición corporal',
    fields: [
      { key: 'weight_kg',    label: 'Peso',        unit: 'kg',  higherIsBetter: false },
      { key: 'height_cm',    label: 'Talla',        unit: 'cm',  higherIsBetter: true  },
      { key: 'body_fat_pct', label: '% grasa',      unit: '%',   higherIsBetter: false },
    ],
  },
  {
    section: 'Cardiovascular',
    fields: [
      { key: 'resting_hr', label: 'FC reposo',  unit: 'lpm', higherIsBetter: false },
      { key: 'max_hr',     label: 'FC máxima',  unit: 'lpm', higherIsBetter: true  },
      { key: 'vo2max',     label: 'VO₂ máx',    unit: 'ml/kg/min', higherIsBetter: true },
      { key: 'cooper_m',   label: 'Cooper',     unit: 'm',   higherIsBetter: true  },
    ],
  },
  {
    section: 'Fuerza / Flexibilidad',
    fields: [
      { key: 'flexibility_cm', label: 'Flexibilidad', unit: 'cm', higherIsBetter: true },
      { key: 'leg_press_kg',   label: 'Leg press',    unit: 'kg', higherIsBetter: true },
      { key: 'bench_press_kg', label: 'Banca',        unit: 'kg', higherIsBetter: true },
      { key: 'plank_sec',      label: 'Plancha',      unit: 's',  higherIsBetter: true },
    ],
  },
  {
    section: 'Velocidad',
    fields: [
      { key: 'sprint_30m_sec', label: 'Sprint 30m', unit: 's', higherIsBetter: false },
    ],
  },
];

interface Props {
  athleteId: string;
  athleteName: string;
}

export function FitnessTestsTab({ athleteId, athleteName }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['fitness-tests', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_fitness_tests')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('test_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FitnessTest[];
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { test_date: new Date().toISOString().split('T')[0] },
  });

  const addMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from('physical_fitness_tests').insert({
        athlete_id:     athleteId,
        test_date:      values.test_date,
        evaluator:      values.evaluator      || null,
        weight_kg:      values.weight_kg      ?? null,
        height_cm:      values.height_cm      ?? null,
        body_fat_pct:   values.body_fat_pct   ?? null,
        resting_hr:     values.resting_hr     ?? null,
        max_hr:         values.max_hr         ?? null,
        vo2max:         values.vo2max         ?? null,
        flexibility_cm: values.flexibility_cm ?? null,
        leg_press_kg:   values.leg_press_kg   ?? null,
        bench_press_kg: values.bench_press_kg ?? null,
        plank_sec:      values.plank_sec      ?? null,
        sprint_30m_sec: values.sprint_30m_sec ?? null,
        cooper_m:       values.cooper_m       ?? null,
        notes:          values.notes          || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fitness-tests', athleteId] });
      toast({ title: 'Test físico registrado' });
      reset({ test_date: new Date().toISOString().split('T')[0] });
      setAdding(false);
    },
    onError: () => toast({ title: 'Error al guardar', variant: 'destructive' }),
  });

  const today = new Date().toISOString().split('T')[0];
  const latest = tests[0] ?? null;
  const prev   = tests[1] ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Tests de condición física</h4>
          {tests.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {tests.length} evaluación{tests.length !== 1 ? 'es' : ''} registrada{tests.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Nuevo test
          </Button>
        )}
      </div>

      {/* Latest snapshot */}
      {latest && !adding && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              Última evaluación — {formatDate(latest.test_date)}
              {latest.evaluator && (
                <Badge variant="secondary" className="text-[10px] ml-auto">{latest.evaluator}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {FIELD_GROUPS.map(g => {
              const hasSome = g.fields.some(f => latest[f.key] !== null);
              if (!hasSome) return null;
              return (
                <div key={g.section}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {g.section}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {g.fields.map(f => {
                      const val = latest[f.key] as number | null;
                      const prevVal = prev ? (prev[f.key] as number | null) : null;
                      if (val === null) return null;
                      return (
                        <div key={f.key} className="bg-muted/40 rounded-lg p-3">
                          <p className="text-[10px] text-muted-foreground">{f.label}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-lg font-bold">{val}</span>
                            <span className="text-xs text-muted-foreground">{f.unit}</span>
                            {trendIcon(val, prevVal, f.higherIsBetter)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {latest.notes && (
              <p className="text-xs text-muted-foreground italic">{latest.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add form */}
      {adding && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm flex items-center justify-between">
              Registrar evaluación física
              <button onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSubmit(v => addMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Fecha del test *</Label>
                  <Input type="date" max={today} {...register('test_date')} />
                  {errors.test_date && <p className="text-xs text-red-500">{errors.test_date.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Evaluador</Label>
                  <Input placeholder="Nombre del evaluador" {...register('evaluator')} />
                </div>
              </div>

              {FIELD_GROUPS.map(g => (
                <div key={g.section}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{g.section}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {g.fields.map(f => (
                      <div key={f.key} className="space-y-1">
                        <Label className="text-xs">{f.label} <span className="text-muted-foreground">({f.unit})</span></Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="—"
                          className="h-8"
                          {...register(f.key as keyof FormValues)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea rows={2} placeholder="Notas del evaluador…" {...register('notes')} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando…' : 'Guardar test'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {!isLoading && tests.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-14 text-center space-y-2">
          <Activity className="h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Sin evaluaciones físicas para {athleteName}</p>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Primera evaluación
          </Button>
        </div>
      )}

      {tests.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historial</p>
          {tests.slice(1).map(t => (
            <div key={t.id} className="border border-border rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{formatDate(t.test_date)}</p>
                {t.evaluator && <p className="text-xs text-muted-foreground">{t.evaluator}</p>}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {t.weight_kg !== null && <span>{t.weight_kg} kg</span>}
                {t.vo2max !== null && <span>VO₂: {t.vo2max}</span>}
                {t.sprint_30m_sec !== null && <span>30m: {t.sprint_30m_sec}s</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
