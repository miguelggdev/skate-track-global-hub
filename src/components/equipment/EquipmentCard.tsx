import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bike, Package, Shield, Shirt, Zap, HardHat,
  Wrench, UserCheck, History, AlertTriangle, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Equipment } from '@/hooks/useEquipment';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  patin:      Zap,
  bicicleta:  Bike,
  casco:      HardHat,
  chaleco:    Shield,
  proteccion: Shield,
  uniforme:   Shirt,
  otro:       Package,
};

const TYPE_LABEL: Record<string, string> = {
  patin:      'Patín',
  bicicleta:  'Bicicleta',
  casco:      'Casco',
  chaleco:    'Chaleco',
  proteccion: 'Protección',
  uniforme:   'Uniforme',
  otro:       'Otro',
};

const STATUS_STYLE: Record<string, string> = {
  available:   'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  assigned:    'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  maintenance: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  retired:     'bg-gray-500/15 text-gray-500 border-gray-500/30',
};

const STATUS_LABEL: Record<string, string> = {
  available:   'Disponible',
  assigned:    'Asignado',
  maintenance: 'En mantenimiento',
  retired:     'Retirado',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EquipmentCardProps {
  equipment: Equipment;
  onAssign: (eq: Equipment) => void;
  onMaintenance: (eq: Equipment) => void;
  onHistory: (eq: Equipment) => void;
}

export function EquipmentCard({ equipment: eq, onAssign, onMaintenance, onHistory }: EquipmentCardProps) {
  const Icon = TYPE_ICON[eq.equipment_type] ?? Package;

  const maintenanceDays = eq.next_maintenance_at ? daysUntil(eq.next_maintenance_at) : null;
  const maintenanceDue = maintenanceDays !== null && maintenanceDays <= 7;
  const maintenanceOverdue = maintenanceDays !== null && maintenanceDays < 0;

  const assigneeName = eq.athletes
    ? `${eq.athletes.first_name} ${eq.athletes.last_name}`
    : null;

  return (
    <Card className={cn(
      'relative transition-all duration-200 hover:shadow-md',
      maintenanceDue && 'ring-1 ring-amber-500/40'
    )}>
      {maintenanceDue && (
        <div className="absolute top-2 right-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-orange-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">{eq.name}</p>
            <p className="text-xs text-muted-foreground">
              {TYPE_LABEL[eq.equipment_type]}
              {eq.brand && ` · ${eq.brand}`}
              {eq.model && ` ${eq.model}`}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn('text-xs', STATUS_STYLE[eq.status])}>
            {STATUS_LABEL[eq.status]}
          </Badge>
          {eq.skate_size && (
            <Badge variant="outline" className="text-xs">Talla {eq.skate_size}</Badge>
          )}
          {eq.wheel_diameter && (
            <Badge variant="outline" className="text-xs">{eq.wheel_diameter}mm</Badge>
          )}
        </div>

        {/* Assignee */}
        {assigneeName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <span className="truncate">{assigneeName}</span>
            {eq.assigned_at && (
              <span className="text-muted-foreground/60 flex-shrink-0">
                desde {eq.assigned_at.slice(0, 10)}
              </span>
            )}
          </div>
        )}

        {/* Next maintenance */}
        {eq.next_maintenance_at && (
          <div className={cn(
            'flex items-center gap-1.5 text-xs rounded-md px-2 py-1',
            maintenanceOverdue
              ? 'bg-red-500/10 text-red-600'
              : maintenanceDue
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'text-muted-foreground'
          )}>
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {maintenanceOverdue
                ? `Mantenimiento vencido hace ${Math.abs(maintenanceDays!)} día${Math.abs(maintenanceDays!) !== 1 ? 's' : ''}`
                : maintenanceDue
                  ? `Mantenimiento en ${maintenanceDays} día${maintenanceDays !== 1 ? 's' : ''}`
                  : `Próx. mantenimiento: ${eq.next_maintenance_at.slice(0, 10)}`
              }
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => onAssign(eq)}
            disabled={eq.status === 'retired'}
          >
            <UserCheck className="h-3 w-3 mr-1" />
            {eq.status === 'assigned' ? 'Reasignar' : 'Asignar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => onMaintenance(eq)}
            disabled={eq.status === 'retired'}
          >
            <Wrench className="h-3 w-3 mr-1" />
            Mantenim.
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onHistory(eq)}
            title="Ver historial"
          >
            <History className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
