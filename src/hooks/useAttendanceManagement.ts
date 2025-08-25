
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

  // Register attendance mutation
  const registerAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: AttendanceFormData) => {
      try {
        // Try upsert first (faster)
        const { data, error } = await supabase
          .from('training_attendance')
          .upsert([attendanceData], { 
            onConflict: 'training_session_id,athlete_id',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (error) {
          console.error('Upsert failed, trying fallback:', error);
          
          // Fallback: check if record exists and update/insert accordingly
          const { data: existing } = await supabase
            .from('training_attendance')
            .select('id')
            .eq('training_session_id', attendanceData.training_session_id)
            .eq('athlete_id', attendanceData.athlete_id)
            .maybeSingle();

          if (existing) {
            // Update existing record
            const { data: updateData, error: updateError } = await supabase
              .from('training_attendance')
              .update({
                attended: attendanceData.attended,
                performance_rating: attendanceData.performance_rating,
                notes: attendanceData.notes
              })
              .eq('id', existing.id)
              .select()
              .single();

            if (updateError) throw updateError;
            return updateData;
          } else {
            // Insert new record
            const { data: insertData, error: insertError } = await supabase
              .from('training_attendance')
              .insert(attendanceData)
              .select()
              .single();

            if (insertError) throw insertError;
            return insertData;
          }
        }

        return data;
      } catch (fallbackError) {
        console.error('All attempts failed:', fallbackError);
        throw fallbackError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['training-kpis'] });
      toast.success('Asistencia registrada correctamente');
    },
    onError: (error: any) => {
      console.error('Error registering attendance:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      // Provide more specific error messages
      if (error.code === '23505') {
        toast.error('Ya existe un registro de asistencia para este atleta en esta sesión');
      } else if (error.message?.includes('foreign key')) {
        toast.error('Error: Sesión de entrenamiento o atleta no válido');
      } else if (error.message?.includes('unique constraint')) {
        toast.error('Error de restricción única en la base de datos');
      } else {
        toast.error('Error al registrar la asistencia: ' + (error.message || 'Error desconocido'));
      }
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
      console.error('Error updating attendance:', error);
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
    onError: (error: any) => {
      console.error('Error deleting attendance:', error);
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
    updateAttendance: updateAttendanceMutation.mutate,
    deleteAttendance: deleteAttendanceMutation.mutate,
    isRegistering: registerAttendanceMutation.isPending,
    isUpdating: updateAttendanceMutation.isPending,
    isDeleting: deleteAttendanceMutation.isPending,
    canEditAttendance,
    canRegisterAttendance,
  };
};
