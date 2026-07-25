import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAthlete } from './useCurrentAthlete';
import { useToast } from '@/hooks/use-toast';

interface TrainingSession {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  training_type: string;
  location?: string;
  description?: string;
  max_participants?: number;
}

interface AttendanceRecord {
  id: string;
  training_session_id: string;
  attended: boolean;
  performance_rating?: number;
  notes?: string;
  created_at: string;
  training_sessions: TrainingSession;
}

export const useAthleteTraining = () => {
  const { athlete } = useCurrentAthlete();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sessions where the athlete is already registered or has attended
  // This ensures athletes only see sessions relevant to them
  const { data: availableSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['athlete-available-sessions', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];

      // Get session IDs where athlete is registered
      const { data: registeredSessionIds } = await supabase
        .from('training_attendance')
        .select('training_session_id')
        .eq('athlete_id', athlete.id);

      const sessionIds = registeredSessionIds?.map(r => r.training_session_id) || [];

      // Fetch upcoming sessions (only those athlete is registered for or open for registration)
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Return sessions - in a full implementation, filter by category/level
      // For now, show all upcoming sessions as they're available for registration
      return data as TrainingSession[];
    },
    enabled: !!athlete?.id,
  });

  // Fetch athlete's attendance records
  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['athlete-attendance', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) return [];

      const { data, error } = await supabase
        .from('training_attendance')
        .select(`
          *,
          training_sessions!training_attendance_training_session_id_fkey (*)
        `)
        .eq('athlete_id', athlete.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!athlete?.id,
  });

  // Register for a training session
  const registerForSessionMutation = useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes?: string }) => {
      if (!athlete?.id) throw new Error('No athlete found');

      // Check if already registered
      const { data: existing } = await supabase
        .from('training_attendance')
        .select('id')
        .eq('training_session_id', sessionId)
        .eq('athlete_id', athlete.id)
        .single();

      if (existing) {
        throw new Error('Ya estás registrado para esta sesión');
      }

      const { data, error } = await supabase
        .from('training_attendance')
        .insert({
          training_session_id: sessionId,
          athlete_id: athlete.id,
          attended: true, // Self-registration implies intention to attend
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-attendance'] });
      toast({
        title: 'Registro exitoso',
        description: 'Te has registrado para la sesión de entrenamiento',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update attendance record
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ 
      attendanceId, 
      updates 
    }: { 
      attendanceId: string; 
      updates: { performance_rating?: number; notes?: string } 
    }) => {
      const { data, error } = await supabase
        .from('training_attendance')
        .update(updates)
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-attendance'] });
      toast({
        title: 'Actualizado',
        description: 'Tu registro de entrenamiento ha sido actualizado',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el registro',
        variant: 'destructive',
      });
    },
  });

  // Check if athlete is registered for a session
  const isRegisteredForSession = (sessionId: string): boolean => {
    return attendanceRecords?.some(record => record.training_session_id === sessionId) || false;
  };

  return {
    availableSessions,
    attendanceRecords,
    isLoadingSessions,
    isLoadingAttendance,
    registerForSession: registerForSessionMutation.mutate,
    updateAttendance: updateAttendanceMutation.mutate,
    isRegistering: registerForSessionMutation.isPending,
    isUpdating: updateAttendanceMutation.isPending,
    isRegisteredForSession,
  };
};
