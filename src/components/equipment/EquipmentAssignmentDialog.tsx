import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAssignEquipment, type Equipment } from '@/hooks/useEquipment';

interface Props {
  equipment: Equipment | null;
  open: boolean;
  onClose: () => void;
}

export function EquipmentAssignmentDialog({ equipment, open, onClose }: Props) {
  const assign = useAssignEquipment();
  const [athleteId, setAthleteId] = useState('');

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

  const isAssigned = equipment?.status === 'assigned';
  const currentAssignee = equipment?.athletes
    ? `${equipment.athletes.first_name} ${equipment.athletes.last_name}`
    : null;

  const handleAssign = async () => {
    if (!equipment || !athleteId) return;
    await assign.mutateAsync({ id: equipment.id, athleteId });
    setAthleteId('');
    onClose();
  };

  const handleUnassign = async () => {
    if (!equipment) return;
    await assign.mutateAsync({ id: equipment.id, athleteId: null });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setAthleteId(''); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-orange-500" />
            Asignación de Equipo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {equipment && (
            <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm space-y-0.5">
              <p className="font-medium">{equipment.name}</p>
              <p className="text-muted-foreground text-xs">
                {equipment.brand} {equipment.model}
              </p>
            </div>
          )}

          {isAssigned && currentAssignee && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Actualmente asignado a</Label>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {currentAssignee}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={handleUnassign}
                  disabled={assign.isPending}
                >
                  <UserX className="h-3.5 w-3.5 mr-1" />
                  Desasignar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{isAssigned ? 'Reasignar a' : 'Asignar a'}</Label>
            <Select value={athleteId} onValueChange={setAthleteId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar atleta…" />
              </SelectTrigger>
              <SelectContent>
                {athletes.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.last_name}, {a.first_name}
                    <span className="text-muted-foreground ml-1 text-xs">({a.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAssign} disabled={!athleteId || assign.isPending}>
            {assign.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Asignando…</>
              : <><UserCheck className="h-4 w-4 mr-2" />Confirmar asignación</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
