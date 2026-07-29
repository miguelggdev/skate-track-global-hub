import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Stethoscope, HeartPulse, Plus, AlertTriangle, CheckCircle2,
  Clock, Shield, Activity, Phone, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MedicalSessionForm, SESSION_TYPES, SESSION_STATUSES } from './MedicalSessionForm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AthleteBasic {
  id: string;
  first_name: string;
  last_name: string;
  category: string;
  blood_type?: string | null;
  allergies?: string | null;
  eps?: string | null;
  accident_insurance?: string | null;
  fractures?: string | null;
  surgeries?: string | null;
  physical_limitations?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

interface Props {
  athlete: AthleteBasic | null;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeLabel = (v: string) => SESSION_TYPES.find(t => t.value === v)?.label ?? v;
const statusLabel = (v: string) => SESSION_STATUSES.find(s => s.value === v)?.label ?? v;

const statusBadge = (status: string) => {
  const classes: Record<string, string> = {
    active_restriction:  'bg-red-500/15 text-red-600 border-red-200',
    partial_restriction: 'bg-amber-500/15 text-amber-700 border-amber-200',
    scheduled:           'bg-blue-500/15 text-blue-600 border-blue-200',
    completed:           'bg-emerald-500/15 text-emerald-700 border-emerald-200',
    cleared:             'bg-emerald-500/15 text-emerald-700 border-emerald-200',
  };
  return classes[status] ?? 'bg-muted text-muted-foreground';
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
}

// ─── Medical info form schema ─────────────────────────────────────────────────

const medInfoSchema = z.object({
  blood_type:              z.string().optional(),
  allergies:               z.string().optional(),
  eps:                     z.string().optional(),
  accident_insurance:      z.string().optional(),
  fractures:               z.string().optional(),
  surgeries:               z.string().optional(),
  physical_limitations:    z.string().optional(),
  emergency_contact_name:  z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

type MedInfoValues = z.infer<typeof medInfoSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function AthleteMedicalDialog({ athlete, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addingSession, setAddingSession] = useState(false);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['medical-sessions', athlete?.id],
    queryFn: async () => {
      if (!athlete) return [];
      const { data, error } = await supabase
        .from('medical_sessions')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('session_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!athlete,
  });

  const { register, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm<MedInfoValues>({
    resolver: zodResolver(medInfoSchema),
    values: {
      blood_type:              athlete?.blood_type              ?? '',
      allergies:               athlete?.allergies               ?? '',
      eps:                     athlete?.eps                     ?? '',
      accident_insurance:      athlete?.accident_insurance      ?? '',
      fractures:               athlete?.fractures               ?? '',
      surgeries:               athlete?.surgeries               ?? '',
      physical_limitations:    athlete?.physical_limitations    ?? '',
      emergency_contact_name:  athlete?.emergency_contact_name  ?? '',
      emergency_contact_phone: athlete?.emergency_contact_phone ?? '',
    },
  });

  const saveMedInfo = async (values: MedInfoValues) => {
    if (!athlete) return;
    const { error } = await supabase
      .from('athletes')
      .update({
        blood_type:              values.blood_type              || null,
        allergies:               values.allergies               || null,
        eps:                     values.eps                     || null,
        accident_insurance:      values.accident_insurance      || null,
        fractures:               values.fractures               || null,
        surgeries:               values.surgeries               || null,
        physical_limitations:    values.physical_limitations    || null,
        emergency_contact_name:  values.emergency_contact_name  || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
      })
      .eq('id', athlete.id);
    if (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['medical-athletes'] });
      toast({ title: 'Ficha médica actualizada' });
      reset(values);
    }
  };

  const activeRestrictions = sessions.filter(s =>
    s.status === 'active_restriction' || s.status === 'partial_restriction',
  );
  const upcomingFollowUps = sessions.filter(s =>
    s.follow_up_date && new Date(s.follow_up_date) >= new Date(),
  );

  if (!athlete) return null;

  return (
    <Dialog open={!!athlete} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-red-500" />
            {athlete.first_name} {athlete.last_name}
            <Badge variant="secondary" className="ml-1 capitalize text-xs">{athlete.category}</Badge>
          </DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {activeRestrictions.length > 0 && (
              <Badge className="gap-1 bg-red-500/15 text-red-600 border-red-200 border">
                <AlertTriangle className="h-3 w-3" />
                {activeRestrictions.length} restricción{activeRestrictions.length !== 1 ? 'es' : ''} activa{activeRestrictions.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {upcomingFollowUps.length > 0 && (
              <Badge className="gap-1 bg-blue-500/15 text-blue-600 border-blue-200 border">
                <Clock className="h-3 w-3" />
                {upcomingFollowUps.length} seguimiento{upcomingFollowUps.length !== 1 ? 's' : ''} pendiente{upcomingFollowUps.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {activeRestrictions.length === 0 && (
              <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-200 border">
                <CheckCircle2 className="h-3 w-3" />
                Sin restricciones
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="ficha" className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4 grid grid-cols-3 w-auto max-w-xs flex-shrink-0">
              <TabsTrigger value="ficha" className="gap-1.5 text-xs">
                <Shield className="h-3.5 w-3.5" /> Ficha
              </TabsTrigger>
              <TabsTrigger value="sesiones" className="gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5" /> Sesiones
                {sessions.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">{sessions.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="restricciones" className="gap-1.5 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" /> Restricciones
                {activeRestrictions.length > 0 && (
                  <Badge className="h-4 px-1 text-[10px] ml-1 bg-red-500 text-white">{activeRestrictions.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Ficha médica ── */}
            <TabsContent value="ficha" className="flex-1 overflow-auto px-6 py-4 space-y-5">
              <form onSubmit={handleSubmit(saveMedInfo)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Grupo sanguíneo</Label>
                    <Input placeholder="Ej: O+" {...register('blood_type')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>EPS / Aseguradora</Label>
                    <Input placeholder="Nombre de la EPS" {...register('eps')} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Seguro de accidentes</Label>
                    <Input placeholder="Póliza o número de seguro" {...register('accident_insurance')} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    Historial médico relevante
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label>Alergias</Label>
                      <Textarea rows={2} placeholder="Medicamentos, alimentos u otras alergias conocidas" {...register('allergies')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fracturas previas</Label>
                      <Textarea rows={2} placeholder="Descripción de fracturas anteriores" {...register('fractures')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cirugías</Label>
                      <Textarea rows={2} placeholder="Cirugías realizadas" {...register('surgeries')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Limitaciones físicas</Label>
                      <Textarea rows={2} placeholder="Condiciones o limitaciones físicas permanentes" {...register('physical_limitations')} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Contacto de emergencia
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nombre</Label>
                      <Input placeholder="Nombre del contacto" {...register('emergency_contact_name')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Teléfono</Label>
                      <Input placeholder="Número de celular" {...register('emergency_contact_phone')} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={!isDirty || isSubmitting}>
                    {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* ── Tab: Sesiones ── */}
            <TabsContent value="sesiones" className="flex-1 overflow-auto px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Historial de sesiones</h4>
                {!addingSession && (
                  <Button size="sm" onClick={() => setAddingSession(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Nueva sesión
                  </Button>
                )}
              </div>

              {addingSession && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm">Registrar nueva sesión</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <MedicalSessionForm
                      athleteId={athlete.id}
                      onSuccess={() => setAddingSession(false)}
                      onCancel={() => setAddingSession(false)}
                    />
                  </CardContent>
                </Card>
              )}

              {sessionsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center space-y-2">
                  <Activity className="h-12 w-12 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">Sin sesiones médicas registradas</p>
                  <Button size="sm" variant="outline" onClick={() => setAddingSession(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Registrar primera sesión
                  </Button>
                </div>
              ) : (
                <div className="relative space-y-0">
                  {sessions.map((s, i) => (
                    <div key={s.id} className="relative pl-8 pb-5 last:pb-0">
                      {i < sessions.length - 1 && (
                        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
                      )}
                      <div className={cn(
                        'absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold',
                        s.status === 'active_restriction'  ? 'bg-red-500 text-white' :
                        s.status === 'partial_restriction' ? 'bg-amber-500 text-white' :
                        s.status === 'completed'           ? 'bg-emerald-500 text-white' :
                        s.status === 'cleared'             ? 'bg-emerald-600 text-white' :
                        'bg-blue-500 text-white',
                      )}>
                        {typeLabel(s.session_type)[0]}
                      </div>
                      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-semibold">{typeLabel(s.session_type)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(s.session_date)} · {timeAgo(s.session_date)}
                              {s.provider_name && ` · ${s.provider_name}`}
                            </p>
                          </div>
                          <Badge className={cn('text-[10px] border', statusBadge(s.status))}>
                            {statusLabel(s.status)}
                          </Badge>
                        </div>
                        {s.diagnosis && (
                          <p className="text-xs mt-2"><span className="text-muted-foreground font-medium">Diagnóstico:</span> {s.diagnosis}</p>
                        )}
                        {s.treatment && (
                          <p className="text-xs mt-1"><span className="text-muted-foreground font-medium">Tratamiento:</span> {s.treatment}</p>
                        )}
                        {s.follow_up_date && (
                          <p className="text-xs mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span className="text-muted-foreground font-medium">Seguimiento:</span> {formatDate(s.follow_up_date)}
                          </p>
                        )}
                        {s.notes && (
                          <p className="text-xs mt-1 text-muted-foreground italic">{s.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Tab: Restricciones ── */}
            <TabsContent value="restricciones" className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {activeRestrictions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">Sin restricciones activas</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {athlete.first_name} está habilitado para entrenar normalmente
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {athlete.first_name} tiene <strong>{activeRestrictions.length}</strong> restricción{activeRestrictions.length !== 1 ? 'es' : ''} activa{activeRestrictions.length !== 1 ? 's' : ''}
                  </p>
                  {activeRestrictions.map(r => (
                    <Card key={r.id} className={cn(
                      'border-l-4',
                      r.status === 'active_restriction'  ? 'border-l-red-500' : 'border-l-amber-400',
                    )}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{typeLabel(r.session_type)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(r.session_date)}</p>
                          </div>
                          <Badge className={cn('text-xs border', statusBadge(r.status))}>
                            {statusLabel(r.status)}
                          </Badge>
                        </div>
                        {r.diagnosis && (
                          <p className="text-xs"><span className="font-medium text-muted-foreground">Diagnóstico:</span> {r.diagnosis}</p>
                        )}
                        {r.treatment && (
                          <p className="text-xs"><span className="font-medium text-muted-foreground">Tratamiento:</span> {r.treatment}</p>
                        )}
                        {r.follow_up_date && (
                          <p className="text-xs flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span className="font-medium text-muted-foreground">Seguimiento:</span>
                            <span className={cn(
                              new Date(r.follow_up_date) < new Date() ? 'text-red-500' : 'text-blue-600',
                            )}>
                              {formatDate(r.follow_up_date)}
                            </span>
                          </p>
                        )}
                        {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
                        {r.provider_name && (
                          <p className="text-xs flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" /> {r.provider_name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
