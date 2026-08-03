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
import { Syringe, Plus, CheckCircle2, AlertTriangle, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VaccineRecord {
  id: string;
  athlete_id: string;
  vaccine_name: string;
  dose_number: string | null;
  vaccine_date: string;
  expiry_date: string | null;
  provider: string | null;
  lot_number: string | null;
  notes: string | null;
  created_at: string;
}

const schema = z.object({
  vaccine_name: z.string().min(1, 'Nombre requerido'),
  dose_number:  z.string().optional(),
  vaccine_date: z.string().min(1, 'Fecha requerida'),
  expiry_date:  z.string().optional(),
  provider:     z.string().optional(),
  lot_number:   z.string().optional(),
  notes:        z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpired(expiry: string | null) {
  if (!expiry) return false;
  return new Date(expiry) < new Date();
}

function expiresColor(expiry: string | null) {
  if (!expiry) return 'text-muted-foreground';
  const daysLeft = Math.floor((new Date(expiry).getTime() - Date.now()) / 86_400_000);
  if (daysLeft < 0)  return 'text-red-500';
  if (daysLeft < 30) return 'text-amber-500';
  return 'text-emerald-600 dark:text-emerald-400';
}

interface Props {
  athleteId: string;
  athleteName: string;
}

export function VaccineRecordsTab({ athleteId, athleteName }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['vaccine-records', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaccine_records')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('vaccine_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as VaccineRecord[];
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vaccine_date: new Date().toISOString().split('T')[0] },
  });

  const addMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from('vaccine_records').insert({
        athlete_id:   athleteId,
        vaccine_name: values.vaccine_name,
        dose_number:  values.dose_number  || null,
        vaccine_date: values.vaccine_date,
        expiry_date:  values.expiry_date  || null,
        provider:     values.provider     || null,
        lot_number:   values.lot_number   || null,
        notes:        values.notes        || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccine-records', athleteId] });
      toast({ title: 'Vacuna registrada' });
      reset({ vaccine_date: new Date().toISOString().split('T')[0] });
      setAdding(false);
    },
    onError: () => toast({ title: 'Error al guardar', variant: 'destructive' }),
  });

  const today = new Date().toISOString().split('T')[0];
  const expired = records.filter(r => r.expiry_date && r.expiry_date < today);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Registro de vacunación</h4>
          {expired.length > 0 && (
            <p className="text-xs text-amber-600 mt-0.5">
              {expired.length} vacuna{expired.length !== 1 ? 's' : ''} con vencimiento pasado
            </p>
          )}
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Nueva vacuna
          </Button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm flex items-center justify-between">
              Registrar vacuna
              <button onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSubmit(v => addMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Nombre de la vacuna *</Label>
                  <Input placeholder="Ej: Triple viral, COVID-19, Tetánica…" {...register('vaccine_name')} />
                  {errors.vaccine_name && (
                    <p className="text-xs text-red-500">{errors.vaccine_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Número de dosis</Label>
                  <Input placeholder="1ª, 2ª, Refuerzo…" {...register('dose_number')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha de aplicación *</Label>
                  <Input type="date" max={today} {...register('vaccine_date')} />
                  {errors.vaccine_date && (
                    <p className="text-xs text-red-500">{errors.vaccine_date.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha de vencimiento</Label>
                  <Input type="date" {...register('expiry_date')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Centro / Entidad</Label>
                  <Input placeholder="Hospital, clínica…" {...register('provider')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Número de lote</Label>
                  <Input placeholder="Lote de la vacuna" {...register('lot_number')} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Observaciones</Label>
                  <Textarea rows={2} placeholder="Reacciones, observaciones…" {...register('notes')} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando…' : 'Guardar vacuna'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Records list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center space-y-2">
          <Syringe className="h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Sin registros de vacunación para {athleteName}</p>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Registrar primera vacuna
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => {
            const expired_ = isExpired(r.expiry_date);
            return (
              <div
                key={r.id}
                className={cn(
                  'rounded-lg border p-4 space-y-2',
                  expired_ ? 'border-red-200 bg-red-500/5' : 'border-border bg-card',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Syringe className={cn('h-4 w-4 flex-shrink-0', expired_ ? 'text-red-500' : 'text-emerald-500')} />
                    <span className="font-semibold text-sm">{r.vaccine_name}</span>
                    {r.dose_number && (
                      <Badge variant="secondary" className="text-[10px]">{r.dose_number}</Badge>
                    )}
                  </div>
                  {expired_
                    ? <Badge className="text-[10px] bg-red-500/15 text-red-600 border border-red-200 gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> Vencida
                      </Badge>
                    : <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 border border-emerald-200 gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Vigente
                      </Badge>
                  }
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Aplicada: {formatDate(r.vaccine_date)}
                  </span>
                  {r.expiry_date && (
                    <span className={cn('flex items-center gap-1', expiresColor(r.expiry_date))}>
                      <Calendar className="h-3 w-3" /> Vence: {formatDate(r.expiry_date)}
                    </span>
                  )}
                  {r.provider && (
                    <span className="text-muted-foreground">{r.provider}</span>
                  )}
                  {r.lot_number && (
                    <span className="text-muted-foreground">Lote: {r.lot_number}</span>
                  )}
                </div>

                {r.notes && (
                  <p className="text-xs text-muted-foreground italic">{r.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
