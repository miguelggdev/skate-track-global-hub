import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from './useUserProfile';

type TrainingType = 'technical' | 'physical' | 'mental' | 'recovery' | 'gym' | 'road_skating' | 'track_skating' | 'bicycle' | 'static_bicycle' | 'simulator';

interface TrainingSession {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  training_type: TrainingType;
  location?: string;
  description?: string;
  max_athletes?: number;
  coach_id?: string;
  created_at: string;
  updated_at: string;
}

interface TrainingSessionWithCoach extends TrainingSession {
  coaches?: {
    first_name: string;
    last_name: string;
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

  // Build query based on options — today is passed in so it's computed at execution time
  const buildQuery = (today: string) => {
    if (includeCoachInfo) {
      let query = supabase
        .from('training_sessions')
        .select(`
          *,
          coaches:coach_id (
            first_name,
            last_name
          )
        `);

      // Apply date filters
      if (dateFilter === 'upcoming') {
        query = query.gte('scheduled_at', today);
      } else if (dateFilter === 'today') {
        query = query.gte('scheduled_at', today).lt('scheduled_at', today + 'T23:59:59');
      }

      return query.order('scheduled_at', { ascending: true });
    } else {
      let query = supabase.from('training_sessions').select('*');

      // Apply date filters
      if (dateFilter === 'upcoming') {
        query = query.gte('scheduled_at', today);
      } else if (dateFilter === 'today') {
        query = query.gte('scheduled_at', today).lt('scheduled_at', today + 'T23:59:59');
      }

      return query.order('scheduled_at', { ascending: true });
    }
  };

  // Fetch training sessions
  const { data: trainingSessions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['training-sessions', { includeCoachInfo, dateFilter }],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]; // computed here to stay fresh after midnight
      const query = buildQuery(today);
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
    const sessionStart = new Date(session.scheduled_at);
    const sessionEnd = new Date(sessionStart.getTime() + (session.duration_minutes || 60) * 60_000);
    const now = new Date();

    let status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' = 'scheduled';
    if (now >= sessionStart && now <= sessionEnd) {
      status = 'in-progress';
    } else if (now > sessionEnd) {
      status = 'completed';
    }

    return {
      ...session,
      status,
      coach: session.coaches
        ? `${session.coaches.first_name} ${session.coaches.last_name}`.trim()
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