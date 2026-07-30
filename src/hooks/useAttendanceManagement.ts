import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { toast } from 'sonner';

export interface AttendanceRecord {
  id: string;
  training_session_id: string;
  athlete_id: string;
  attended: boolean;
  performance_rating?: number;
  notes?: string;
  created_at: string;
}

export interface AttendanceFormData {
  training_session_id: string;
  athlete_id: string;
  attended: boolean;
  performance_rating?: number;
  notes?: string;
}

export const useAttendanceManagement = () => {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  // Fetch attendance records
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['attendance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_attendance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });

  // Register attendance via upsert (handles both insert and update)
  const registerAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: AttendanceFormData) => {
      const { data, error } = await supabase
        .from('training_attendance')
        .upsert({
          training_session_id: attendanceData.training_session_id,
          athlete_id: attendanceData.athlete_id,
          attended: attendanceData.attended,
          performance_rating: attendanceData.performance_rating ?? null,
          notes: attendanceData.notes ?? null,
        }, { onConflict: 'training_session_id,athlete_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['training-kpis'] });
      toast.success('Asistencia registrada correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al registrar la asistencia: ' + (error.message || 'Error desconocido'));
    },
  });

  // Bulk register attendance via upsert
  const registerBulkAttendanceMutation = useMutation({
    mutationFn: async (attendanceRows: AttendanceFormData[]) => {
      const rows = attendanceRows.map(row => ({
        training_session_id: row.training_session_id,
        athlete_id: row.athlete_id,
        attended: row.attended,
        performance_rating: row.performance_rating ?? null,
        notes: row.notes ?? null,
      }));

      const { data, error } = await supabase
        .from('training_attendance')
        .upsert(rows, { onConflict: 'training_session_id,athlete_id' });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['training-kpis'] });
      toast.success('Asistencia registrada correctamente');
    },
    onError: (error: any) => {
      toast.error('Error al registrar la asistencia: ' + (error.message || 'Error desconocido'));
    },
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AttendanceFormData> }) => {
      const { data, error } = await supabase
        .from('training_attendance')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['training-kpis'] });
      toast.success('Asistencia actualizada correctamente');
    },
    onError: (error: any) => {
      if (error.message.includes('48 hours')) {
        toast.error('No se puede editar la asistencia después de 48 horas');
      } else {
        toast.error('Error al actualizar la asistencia');
      }
    },
  });

  // Delete attendance mutation
  const deleteAttendanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_attendance')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['training-kpis'] });
      toast.success('Asistencia eliminada correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar la asistencia');
    },
  });

  // Check if user can edit attendance
  const canEditAttendance = (attendanceRecord: AttendanceRecord) => {
    if (profile?.role === 'admin') return true;
    
    const createdAt = new Date(attendanceRecord.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < 48;
  };

  // Check if user can register attendance
  const canRegisterAttendance = () => {
    return profile?.role && ['admin', 'coach', 'delegate'].includes(profile.role);
  };

  return {
    attendanceRecords,
    isLoading,
    registerAttendance: registerAttendanceMutation.mutate,
    registerBulkAttendance: registerBulkAttendanceMutation.mutate,
    updateAttendance: updateAttendanceMutation.mutate,
    deleteAttendance: deleteAttendanceMutation.mutate,
    isRegistering: registerAttendanceMutation.isPending,
    isBulkRegistering: registerBulkAttendanceMutation.isPending,
    isUpdating: updateAttendanceMutation.isPending,
    isDeleting: deleteAttendanceMutation.isPending,
    canEditAttendance,
    canRegisterAttendance,
  };
};
