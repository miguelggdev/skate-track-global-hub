import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, Package, Wrench, Archive, AlertTriangle,
  Plus, Search, Loader2, History, X,
} from 'lucide-react';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { MaintenanceForm } from '@/components/equipment/MaintenanceForm';
import { EquipmentAssignmentDialog } from '@/components/equipment/EquipmentAssignmentDialog';
import {
  useEquipmentList, useEquipmentStats, useEquipmentMaintenance,
  useAddEquipment, type Equipment,
} from '@/hooks/useEquipment';
import { cn } from '@/lib/utils';

// ─── New Equipment Form ───────────────────────────────────────────────────────

const newEqSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  equipment_type: z.enum(['patin', 'bicicleta', 'casco', 'chaleco', 'proteccion', 'uniforme', 'otro']),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  skate_size: z.string().optional(),
  chassis_size: z.string().optional(),
  wheel_diameter: z.coerce.number().optional(),
  purchase_date: z.string().optional(),
  purchase_value: z.coerce.number().optional(),
  condition_notes: z.string().optional(),
});

type NewEqValues = z.infer<typeof newEqSchema>;

function NewEquipmentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addEquipment = useAddEquipment();
  const form = useForm<NewEqValues>({
    resolver: zodResolver(newEqSchema),
    defaultValues: { equipment_type: 'patin', name: '' },
  });

  const onSubmit = async (values: NewEqValues) => {
    await addEquipment.mutateAsync({
      ...values,
      brand: values.brand || null,
      model: values.model || null,
      serial_number: values.serial_number || null,
      skate_size: values.skate_size || null,
      chassis_size: values.chassis_size || null,
      wheel_diameter: values.wheel_diameter || null,
      purchase_date: values.purchase_date || null,
      purchase_value: values.purchase_value || null,
      condition_notes: values.condition_notes || null,
      status: 'available',
    });
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-orange-500" />
            Registrar Equipo
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nombre del equipo</FormLabel>
                  <FormControl><Input placeholder="Ej: Patín Rollerblade #3" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="equipment_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="patin">Patín</SelectItem>
                      <SelectItem value="bicicleta">Bicicleta</SelectItem>
                      <SelectItem value="casco">Casco</SelectItem>
                      <SelectItem value="chaleco">Chaleco</SelectItem>
                      <SelectItem value="proteccion">Protección</SelectItem>
                      <SelectItem value="uniforme">Uniforme</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="serial_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de serie <span className="text-muted-foreground">(opc.)</span></FormLabel>
                  <FormControl><Input placeholder="SN-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl><Input placeholder="Rollerblade, Seba…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl><Input placeholder="TRS, FR1…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="skate_size" render={({ field }) => (
                <FormItem>
                  <FormLabel>Talla (patín)</FormLabel>
                  <FormControl><Input placeholder="38, 40, 42…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="chassis_size" render={({ field }) => (
                <FormItem>
                  <FormLabel>Talla de chasis</FormLabel>
                  <FormControl><Input placeholder="243mm, 267mm…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="wheel_diameter" render={({ field }) => (
                <FormItem>
                  <FormLabel>Diám. ruedas (mm)</FormLabel>
                  <FormControl><Input type="number" min={60} max={125} placeholder="100" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="purchase_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de compra</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="purchase_value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor compra (COP)</FormLabel>
                  <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="condition_notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas de condición <span className="text-muted-foreground">(opc.)</span></FormLabel>
                <FormControl>
                  <Textarea placeholder="Estado actual del equipo…" rows={2} className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={addEquipment.isPending}>
                {addEquipment.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando…</>
                  : 'Registrar equipo'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── History Dialog ───────────────────────────────────────────────────────────

function HistoryDialog({ equipment, open, onClose }: { equipment: Equipment | null; open: boolean; onClose: () => void }) {
  const { data: records = [], isLoading } = useEquipmentMaintenance(equipment?.id ?? null);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-orange-500" />
            Historial de mantenimiento
            {equipment && <span className="text-muted-foreground font-normal text-sm">— {equipment.name}</span>}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <Wrench className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Sin registros de mantenimiento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(r => (
              <div key={r.id} className="border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.maintenance_date}</span>
                  <Badge variant="outline" className="text-xs capitalize">{r.maintenance_type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                {r.parts_replaced && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Piezas:</span> {r.parts_replaced}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {r.cost != null && (
                    <span>Costo: ${r.cost.toLocaleString('es-CO')}</span>
                  )}
                  {r.next_maintenance && (
                    <span>Próximo: {r.next_maintenance}</span>
                  )}
                  {r.performed_by && (
                    <span>Por: {r.performed_by}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, className }: {
  label: string; value: number; icon: React.ElementType; className?: string;
}) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EquipmentPage = () => {
  const [filters, setFilters] = useState({ type: 'all', status: 'all', search: '' });
  const [newOpen, setNewOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Equipment | null>(null);
  const [maintenanceTarget, setMaintenanceTarget] = useState<Equipment | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Equipment | null>(null);

  const { data: equipment = [], isLoading } = useEquipmentList(filters);
  const { data: stats } = useEquipmentStats();

  return (
    <DashboardLayout title="Equipamiento">
      <div className="space-y-6 max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Equipamiento del Club</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Inventario, asignaciones e historial de mantenimiento
            </p>
          </div>
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo equipo
          </Button>
        </div>

        {/* KPIs */}
        {stats && (
          <>
            {stats.dueSoon > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  {stats.dueSoon} equipo{stats.dueSoon !== 1 ? 's' : ''} con mantenimiento pendiente en los próximos 7 días
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Disponibles" value={stats.available} icon={CheckCircle2} />
              <KpiCard label="Asignados" value={stats.assigned} icon={Package} />
              <KpiCard label="En mantenimiento" value={stats.maintenance} icon={Wrench} />
              <KpiCard label="Retirados" value={stats.retired} icon={Archive} />
            </div>
          </>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, marca, modelo…"
              className="pl-9"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
            {filters.search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setFilters(f => ({ ...f, search: '' }))}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={filters.type} onValueChange={v => setFilters(f => ({ ...f, type: v }))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="patin">Patín</SelectItem>
              <SelectItem value="bicicleta">Bicicleta</SelectItem>
              <SelectItem value="casco">Casco</SelectItem>
              <SelectItem value="chaleco">Chaleco</SelectItem>
              <SelectItem value="proteccion">Protección</SelectItem>
              <SelectItem value="uniforme">Uniforme</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
            <SelectTrigger className="w-[175px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="assigned">Asignado</SelectItem>
              <SelectItem value="maintenance">En mantenimiento</SelectItem>
              <SelectItem value="retired">Retirado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Equipment grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : equipment.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <Package className="h-14 w-14 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">
                {filters.search || filters.type !== 'all' || filters.status !== 'all'
                  ? 'Sin resultados para estos filtros'
                  : 'No hay equipos registrados aún'
                }
              </p>
              {!filters.search && filters.type === 'all' && filters.status === 'all' && (
                <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Registrar primer equipo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {equipment.length} equipo{equipment.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {equipment.map(eq => (
                <EquipmentCard
                  key={eq.id}
                  equipment={eq}
                  onAssign={setAssignTarget}
                  onMaintenance={setMaintenanceTarget}
                  onHistory={setHistoryTarget}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <NewEquipmentDialog open={newOpen} onClose={() => setNewOpen(false)} />

      <EquipmentAssignmentDialog
        equipment={assignTarget}
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
      />

      <MaintenanceForm
        equipment={maintenanceTarget}
        open={!!maintenanceTarget}
        onClose={() => setMaintenanceTarget(null)}
      />

      <HistoryDialog
        equipment={historyTarget}
        open={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
    </DashboardLayout>
  );
};

export default EquipmentPage;
