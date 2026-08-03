import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const SESSION_TYPES = [
  { value: 'injury',            label: 'Lesión' },
  { value: 'physiotherapy',     label: 'Fisioterapia' },
  { value: 'psychology',        label: 'Psicología' },
  { value: 'medical_followup',  label: 'Control médico' },
  { value: 'nutrition',         label: 'Nutrición' },
  { value: 'other',             label: 'Otro' },
] as const;

export const SESSION_STATUSES = [
  { value: 'scheduled',           label: 'Programada' },
  { value: 'completed',           label: 'Completada' },
  { value: 'active_restriction',  label: 'Restricción activa' },
  { value: 'partial_restriction', label: 'Restricción parcial' },
  { value: 'cleared',             label: 'Dado de alta' },
] as const;

const schema = z.object({
  session_type:   z.string().min(1, 'Tipo requerido'),
  session_date:   z.string().min(1, 'Fecha requerida'),
  status:         z.string().min(1, 'Estado requerido'),
  provider_name:  z.string().optional(),
  diagnosis:      z.string().optional(),
  treatment:      z.string().optional(),
  follow_up_date: z.string().optional(),
  notes:          z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface MedicalSessionFormProps {
  athleteId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MedicalSessionForm({ athleteId, onSuccess, onCancel }: MedicalSessionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      session_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      session_type: 'medical_followup',
    },
  });

  const sessionType = watch('session_type');
  const status = watch('status');

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from('medical_sessions').insert({
        athlete_id:     athleteId,
        session_type:   values.session_type,
        session_date:   values.session_date,
        status:         values.status,
        provider_name:  values.provider_name  || null,
        diagnosis:      values.diagnosis      || null,
        treatment:      values.treatment      || null,
        follow_up_date: values.follow_up_date || null,
        notes:          values.notes          || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-sessions', athleteId] });
      queryClient.invalidateQueries({ queryKey: ['medical-all-sessions'] });
      toast({ title: 'Sesión registrada correctamente' });
      onSuccess();
    },
    onError: () => {
      toast({ title: 'Error al registrar la sesión', variant: 'destructive' });
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Type */}
        <div className="space-y-1.5">
          <Label>Tipo de sesión *</Label>
          <Select value={sessionType} onValueChange={v => setValue('session_type', v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
            <SelectContent>
              {SESSION_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.session_type && <p className="text-xs text-red-500">{errors.session_type.message}</p>}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label>Fecha *</Label>
          <Input type="date" {...register('session_date')} />
          {errors.session_date && <p className="text-xs text-red-500">{errors.session_date.message}</p>}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Estado *</Label>
          <Select value={status} onValueChange={v => setValue('status', v)}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              {SESSION_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
        </div>

        {/* Provider */}
        <div className="space-y-1.5">
          <Label>Profesional / Entidad</Label>
          <Input placeholder="Nombre del médico o clínica" {...register('provider_name')} />
        </div>

        {/* Follow-up date */}
        <div className="space-y-1.5">
          <Label>Fecha de seguimiento</Label>
          <Input type="date" {...register('follow_up_date')} />
        </div>
      </div>

      {/* Diagnosis */}
      <div className="space-y-1.5">
        <Label>Diagnóstico</Label>
        <Textarea rows={2} placeholder="Diagnóstico médico" {...register('diagnosis')} />
      </div>

      {/* Treatment */}
      <div className="space-y-1.5">
        <Label>Tratamiento</Label>
        <Textarea rows={2} placeholder="Tratamiento indicado" {...register('treatment')} />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notas adicionales</Label>
        <Textarea rows={2} placeholder="Observaciones" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando…' : 'Guardar sesión'}
        </Button>
      </div>
    </form>
  );
}
