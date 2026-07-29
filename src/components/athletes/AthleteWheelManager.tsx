import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Plus, Star, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getWheelLimitMm, calcularEdadDeportiva } from '@/utils/calculateCategory';

interface WheelRecord {
  id: string;
  brand: string;
  model: string | null;
  diameter_mm: number;
  hardness_a: number | null;
  purchase_date: string | null;
  is_current: boolean;
  exceeds_limit: boolean;
  category_limit_mm: number | null;
  notes: string | null;
  created_at: string;
}

interface AthleteWheelManagerProps {
  athleteId: string;
  athleteDateOfBirth?: string | null;
  cutoffSystem?: 'fcp' | 'worldskate';
}

const wheelSchema = z.object({
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().optional(),
  diameter_mm: z.coerce.number().min(60, 'Mínimo 60mm').max(130, 'Máximo 130mm'),
  hardness_a: z.coerce.number().min(60).max(110).optional(),
  purchase_date: z.string().optional(),
  notes: z.string().optional(),
});

type WheelFormData = z.infer<typeof wheelSchema>;

export function AthleteWheelManager({
  athleteId,
  athleteDateOfBirth,
  cutoffSystem = 'fcp',
}: AthleteWheelManagerProps) {
  const [addOpen, setAddOpen] = useState(false);
  const qc = useQueryClient();

  // Calculate wheel limit for current year based on athlete DOB
  const wheelLimitMm = React.useMemo(() => {
    if (!athleteDateOfBirth) return null;
    const year = new Date().getFullYear();
    const sportAge = calcularEdadDeportiva(athleteDateOfBirth, year, cutoffSystem);
    return getWheelLimitMm(sportAge);
  }, [athleteDateOfBirth, cutoffSystem]);

  const { data: wheels = [], isLoading } = useQuery({
    queryKey: ['athlete-wheels', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_wheels')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('is_current', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as WheelRecord[];
    },
  });

  const form = useForm<WheelFormData>({
    resolver: zodResolver(wheelSchema),
    defaultValues: { brand: '', model: '', diameter_mm: 100, hardness_a: undefined, purchase_date: '', notes: '' },
  });

  const addWheel = useMutation({
    mutationFn: async (values: WheelFormData) => {
      const { error } = await supabase.from('athlete_wheels').insert({
        athlete_id: athleteId,
        brand: values.brand,
        model: values.model || null,
        diameter_mm: values.diameter_mm,
        hardness_a: values.hardness_a ?? null,
        purchase_date: values.purchase_date || null,
        notes: values.notes || null,
        category_limit_mm: wheelLimitMm,
        is_current: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athlete-wheels', athleteId] });
      toast.success('Ruedas registradas correctamente');
      setAddOpen(false);
      form.reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setCurrent = useMutation({
    mutationFn: async (wheelId: string) => {
      // Desmarcar las demás
      await supabase.from('athlete_wheels').update({ is_current: false }).eq('athlete_id', athleteId);
      const { error } = await supabase.from('athlete_wheels').update({ is_current: true }).eq('id', wheelId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athlete-wheels', athleteId] });
      toast.success('Ruedas actuales actualizadas');
    },
  });

  const deleteWheel = useMutation({
    mutationFn: async (wheelId: string) => {
      const { error } = await supabase.from('athlete_wheels').delete().eq('id', wheelId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athlete-wheels', athleteId] });
      toast.success('Ruedas eliminadas');
    },
  });

  const diameterValue = form.watch('diameter_mm');
  const exceedsInForm = wheelLimitMm !== null && diameterValue > wheelLimitMm;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-sm font-semibold">Ruedas Registradas</CardTitle>
          <CardDescription className="text-xs">
            {wheelLimitMm
              ? `Límite para esta categoría: ${wheelLimitMm}mm`
              : 'Sin restricción de diámetro para esta categoría'}
          </CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Agregar ruedas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Ruedas</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => addWheel.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="brand" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <FormControl><Input placeholder="Bont, Powerslide…" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl><Input placeholder="Quad X…" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="diameter_mm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diámetro (mm) *</FormLabel>
                      <FormControl>
                        <Input type="number" min={60} max={130} {...field} />
                      </FormControl>
                      {exceedsInForm && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Supera el límite de {wheelLimitMm}mm
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="hardness_a" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dureza (Shore A)</FormLabel>
                      <FormControl><Input type="number" min={60} max={110} placeholder="85" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="purchase_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de compra</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl><Textarea placeholder="Condición, uso, observaciones…" rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {exceedsInForm && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 flex items-start gap-2 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    Estas ruedas superan el límite permitido para la categoría del atleta. Se registrarán con advertencia.
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={addWheel.isPending}>
                    {addWheel.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar ruedas
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
          </div>
        ) : wheels.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            No hay ruedas registradas. Agrega las ruedas actuales del atleta.
          </p>
        ) : (
          <div className="space-y-2">
            {wheels.map(w => (
              <div
                key={w.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${w.is_current ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{w.brand}</span>
                    {w.model && <span className="text-xs text-muted-foreground">{w.model}</span>}
                    {w.is_current && (
                      <Badge variant="default" className="text-[10px] h-4 px-1.5">Actuales</Badge>
                    )}
                    {w.exceeds_limit && (
                      <Badge variant="destructive" className="text-[10px] h-4 px-1.5 flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" /> Supera límite
                      </Badge>
                    )}
                    {!w.exceeds_limit && w.category_limit_mm && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 flex items-center gap-0.5 text-emerald-600">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Válidas
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="font-mono font-medium text-foreground">{w.diameter_mm}mm</span>
                    {w.hardness_a && <span>{w.hardness_a}A</span>}
                    {w.purchase_date && (
                      <span>Compra: {new Date(w.purchase_date).toLocaleDateString('es-CO')}</span>
                    )}
                  </div>
                  {w.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{w.notes}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!w.is_current && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Marcar como actuales"
                      aria-label="Marcar como ruedas actuales"
                      onClick={() => setCurrent.mutate(w.id)}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar ruedas"
                    title="Eliminar ruedas"
                    onClick={() => deleteWheel.mutate(w.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
