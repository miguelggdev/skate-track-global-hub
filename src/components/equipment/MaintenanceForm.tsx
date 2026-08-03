import React from 'react';
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
import { Loader2, Wrench } from 'lucide-react';
import { useAddMaintenance, type Equipment } from '@/hooks/useEquipment';

const schema = z.object({
  maintenance_date: z.string().min(1, 'Requerido'),
  maintenance_type: z.string().min(1, 'Requerido'),
  description: z.string().min(3, 'Describe el mantenimiento'),
  parts_replaced: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  next_maintenance: z.string().optional(),
  performed_by: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface MaintenanceFormProps {
  equipment: Equipment | null;
  open: boolean;
  onClose: () => void;
}

export function MaintenanceForm({ equipment, open, onClose }: MaintenanceFormProps) {
  const addMaintenance = useAddMaintenance();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      maintenance_date: new Date().toISOString().slice(0, 10),
      maintenance_type: 'preventivo',
      description: '',
      parts_replaced: '',
      cost: undefined,
      next_maintenance: '',
      performed_by: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!equipment) return;
    await addMaintenance.mutateAsync({
      equipment_id: equipment.id,
      maintenance_date: values.maintenance_date,
      maintenance_type: values.maintenance_type,
      description: values.description,
      parts_replaced: values.parts_replaced || null,
      cost: values.cost ?? null,
      next_maintenance: values.next_maintenance || null,
      performed_by: values.performed_by || null,
    });
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-500" />
            Registrar Mantenimiento
            {equipment && (
              <span className="text-muted-foreground font-normal text-sm">— {equipment.name}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="maintenance_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="maintenance_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="revision">Revisión</SelectItem>
                      <SelectItem value="limpieza">Limpieza</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalla el trabajo realizado…" rows={3} className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="parts_replaced" render={({ field }) => (
              <FormItem>
                <FormLabel>Piezas reemplazadas <span className="text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl><Input placeholder="Ruedas, rodamientos, chasis…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="cost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo (COP) <span className="text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="next_maintenance" render={({ field }) => (
                <FormItem>
                  <FormLabel>Próximo mantenimiento</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="performed_by" render={({ field }) => (
              <FormItem>
                <FormLabel>Realizado por <span className="text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl><Input placeholder="Nombre del técnico o entrenador" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={addMaintenance.isPending}>
                {addMaintenance.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando…</>
                  : 'Registrar mantenimiento'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
