import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type EquipmentRow = Database['public']['Tables']['equipment']['Row'];
type EquipmentInsert = Database['public']['Tables']['equipment']['Insert'];
type EquipmentUpdate = Database['public']['Tables']['equipment']['Update'];
type MaintenanceInsert = Database['public']['Tables']['equipment_maintenance']['Insert'];

export type Equipment = EquipmentRow & {
  athletes?: { first_name: string; last_name: string } | null;
};
export type EquipmentMaintenance = Database['public']['Tables']['equipment_maintenance']['Row'];

export interface EquipmentFilters {
  type?: string;
  status?: string;
  search?: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useEquipmentList(filters?: EquipmentFilters) {
  return useQuery({
    queryKey: ['equipment', filters],
    queryFn: async () => {
      let q = supabase
        .from('equipment')
        .select('*, athletes (first_name, last_name)')
        .order('created_at', { ascending: false });

      if (filters?.type && filters.type !== 'all') {
        q = q.eq('equipment_type', filters.type as EquipmentRow['equipment_type']);
      }
      if (filters?.status && filters.status !== 'all') {
        q = q.eq('status', filters.status as EquipmentRow['status']);
      }
      if (filters?.search) {
        q = q.or(
          `name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Equipment[];
    },
  });
}

export function useEquipmentStats() {
  return useQuery({
    queryKey: ['equipment-stats'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('status, next_maintenance_at');
      if (error) throw error;

      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return {
        available:  (data ?? []).filter(e => e.status === 'available').length,
        assigned:   (data ?? []).filter(e => e.status === 'assigned').length,
        maintenance:(data ?? []).filter(e => e.status === 'maintenance').length,
        retired:    (data ?? []).filter(e => e.status === 'retired').length,
        dueSoon:    (data ?? []).filter(e => {
          if (!e.next_maintenance_at) return false;
          return new Date(e.next_maintenance_at) <= in7Days;
        }).length,
      };
    },
  });
}

export function useEquipmentMaintenance(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment-maintenance', equipmentId],
    enabled: !!equipmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_maintenance')
        .select('*')
        .eq('equipment_id', equipmentId!)
        .order('maintenance_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as EquipmentMaintenance[];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddEquipment() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: EquipmentInsert) => {
      const { data, error } = await supabase.from('equipment').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      qc.invalidateQueries({ queryKey: ['equipment-stats'] });
      toast({ title: 'Equipo registrado' });
    },
  });
}

export function useUpdateEquipment() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & EquipmentUpdate) => {
      const { data, error } = await supabase
        .from('equipment')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      qc.invalidateQueries({ queryKey: ['equipment-stats'] });
      toast({ title: 'Equipo actualizado' });
    },
  });
}

export function useAddMaintenance() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: MaintenanceInsert) => {
      const { error: mErr } = await supabase.from('equipment_maintenance').insert(input);
      if (mErr) throw mErr;

      // Sync dates + return equipment to available
      const { error: eErr } = await supabase
        .from('equipment')
        .update({
          last_maintenance_at: input.maintenance_date ?? new Date().toISOString().slice(0, 10),
          next_maintenance_at: input.next_maintenance ?? null,
          status: 'available',
        })
        .eq('id', input.equipment_id);
      if (eErr) throw eErr;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      qc.invalidateQueries({ queryKey: ['equipment-stats'] });
      qc.invalidateQueries({ queryKey: ['equipment-maintenance', vars.equipment_id] });
      toast({ title: 'Mantenimiento registrado' });
    },
  });
}

export function useAssignEquipment() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, athleteId }: { id: string; athleteId: string | null }) => {
      const { error } = await supabase
        .from('equipment')
        .update({
          assigned_to: athleteId,
          assigned_at: athleteId ? new Date().toISOString() : null,
          status: athleteId ? 'assigned' : 'available',
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      qc.invalidateQueries({ queryKey: ['equipment-stats'] });
      toast({ title: vars.athleteId ? 'Equipo asignado' : 'Asignación removida' });
    },
  });
}
