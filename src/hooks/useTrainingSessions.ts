import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from './useUserProfile';

type TrainingType = 'technical' | 'physical' | 'mental' | 'recovery' | 'gym' | 'road_skating' | 'track_skating' | 'bicycle' | 'static_bicycle' | 'simulator';

interface TrainingSession {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  training_type: TrainingType;
  location?: string;
  description?: string;
  max_participants?: number;
  coach_id?: string;
  created_at: string;
  updated_at: string;
}

interface TrainingSessionWithCoach extends TrainingSession {
  coaches?: {
    id: string;
    user_id: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
}

export const useTrainingSessions = (options?: {
  includeCoachInfo?: boolean;
  dateFilter?: 'upcoming' | 'today' | 'all';
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  
  const {
    includeCoachInfo = false,
    dateFilter = 'all'
  } = options || {};

  // Build query based on options
  const buildQuery = () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (includeCoachInfo) {
      let query = supabase
        .from('training_sessions')
        .select(`
          *,
          coaches:coach_id (
            id,
            user_id,
            profiles:user_id (
              first_name,
              last_name
            )
          )
        `);

      // Apply date filters
      if (dateFilter === 'upcoming') {
        query = query.gte('date', today);
      } else if (dateFilter === 'today') {
        query = query.eq('date', today);
      }

      return query.order('date', { ascending: true }).order('start_time', { ascending: true });
    } else {
      let query = supabase.from('training_sessions').select('*');
      
      // Apply date filters
      if (dateFilter === 'upcoming') {
        query = query.gte('date', today);
      } else if (dateFilter === 'today') {
        query = query.eq('date', today);
      }

      return query.order('date', { ascending: true }).order('start_time', { ascending: true });
    }
  };

  // Fetch training sessions
  const { data: trainingSessions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['training-sessions', { includeCoachInfo, dateFilter }],
    queryFn: async () => {
      const query = buildQuery();
      const { data, error } = await query;

      if (error) throw error;
      return data as TrainingSessionWithCoach[];
    },
  });

  // Delete training session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast({
        title: 'Sesión eliminada',
        description: 'La sesión de entrenamiento ha sido eliminada exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la sesión de entrenamiento',
        variant: 'destructive',
      });
    },
  });

  // Update training session
  const updateSessionMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      updates 
    }: { 
      sessionId: string; 
      updates: Partial<TrainingSession> 
    }) => {
      const { data, error } = await supabase
        .from('training_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
      toast({
        title: 'Sesión actualizada',
        description: 'La sesión de entrenamiento ha sido actualizada exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la sesión de entrenamiento',
        variant: 'destructive',
      });
    },
  });

  // Get sessions with computed status
  const sessionsWithStatus = trainingSessions.map(session => {
    const sessionDate = new Date(session.date);
    const now = new Date();
    const today = new Date().toDateString();
    
    let status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' = 'scheduled';
    
    if (sessionDate.toDateString() === today) {
      const [startHour, startMinute] = session.start_time.split(':').map(Number);
      const [endHour, endMinute] = session.end_time.split(':').map(Number);
      
      const sessionStart = new Date();
      sessionStart.setHours(startHour, startMinute, 0, 0);
      
      const sessionEnd = new Date();
      sessionEnd.setHours(endHour, endMinute, 0, 0);
      
      if (now >= sessionStart && now <= sessionEnd) {
        status = 'in-progress';
      } else if (now > sessionEnd) {
        status = 'completed';
      }
    } else if (sessionDate < now) {
      status = 'completed';
    }

    return {
      ...session,
      status,
      coach: session.coaches?.profiles 
        ? `${session.coaches.profiles.first_name} ${session.coaches.profiles.last_name}`.trim()
        : 'Sin asignar'
    };
  });

  // Permission checks
  const canManageSessions = profile?.role === 'admin' || profile?.role === 'coach' || profile?.role === 'leader';

  return {
    trainingSessions: sessionsWithStatus,
    isLoading,
    error,
    refetch,
    deleteSession: deleteSessionMutation.mutate,
    updateSession: updateSessionMutation.mutate,
    isDeleting: deleteSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
    canManageSessions,
  };
};